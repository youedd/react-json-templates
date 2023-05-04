import { InternalError, InvalidSyntaxError, ParseError } from './errors'
import type { RJTCompilerConfig, RJTCompilerCache, RJTComponentType } from './types'
import { isTemplatePath, parseFile, parseString, readFile } from './utils'
import traverse, { type NodePath } from '@babel/traverse'
import generate from '@babel/generator'
import * as types from '@babel/types'
import UnusedVarsPlugin from 'babel-plugin-remove-unused-vars'
import { getIdentifierPossibleTypes } from './typeUtils'
import Path from 'path'
import { analyze } from './analyser'
import resolve from "enhanced-resolve"

const resolveModule = resolve.create.sync({
  extensions: [".tsx", ".jsx", "ts", "js"]
});

interface Config {
  filePath: string
  compilerConfig: RJTCompilerConfig
  cache: RJTCompilerCache
}

export const compile = (config: Config): string => {
  const { filePath, compilerConfig } = config
  const { ast, code } = parseFile(filePath, compilerConfig)

  validate(filePath, ast, code)
  replaceJSX(ast, code, config)
  transform(ast)

  const newCode = generate(ast).code

  return `// @ts-nocheck \n\n ${newCode}`
}

const validate = (filePath: string, ast: types.File, code: string): void => {
  const lastExpression = ast.program.body.at(-1)

  if (
    !types.isExpressionStatement(lastExpression) ||
    !(
      types.isJSXFragment(lastExpression.expression) ||
      types.isJSXElement(lastExpression.expression)
    )
  ) {
    throw new InvalidSyntaxError(filePath, {
      code,
      start: lastExpression?.loc?.start,
      end: lastExpression?.loc?.end
    })
  }
}

const replaceJSX = (ast: types.File, code: string, config: Config): void => {
  const { filePath } = config

  traverse(
    ast,
    {
      ExportAllDeclaration(path) {
        throw new InvalidSyntaxError(filePath, {
          code,
          start: path.node.loc?.start,
          end: path.node.loc?.end
        })
      },
      ExportNamedDeclaration(path) {
        throw new InvalidSyntaxError(filePath, {
          code,
          start: path.node.loc?.start,
          end: path.node.loc?.end
        })
      },
      ExportDefaultDeclaration(path) {
        throw new InvalidSyntaxError(filePath, {
          code,
          start: path.node.loc?.start,
          end: path.node.loc?.end
        })
      },
      JSXAttribute(path) {
        const value = path.get('value')
        if (value.isJSXElement() || value.isJSXFragment()) {
          path.node.value = types.jsxExpressionContainer(value.node)
        }
      },
      JSXFragment: {
        exit(path) {
          path.replaceWith(
            types.objectExpression([
              types.objectProperty(
                types.identifier('type'),
                types.stringLiteral('__RJT_FRAGMENT__')
              ),
              types.objectProperty(
                types.identifier('children'),
                types.arrayExpression(types.react.buildChildren(path.node) as types.Expression[])
              )
            ])
          )
        }
      },
      JSXElement: {
        exit(path) {
          const openingElement = path.get('openingElement')
          const name = openingElement.get('name')

          if (!name.isJSXIdentifier()) {
            throw new InvalidSyntaxError(
              filePath,
              {
                code,
                start: openingElement.node.name.loc?.start,
                end: openingElement.node.name.loc?.end,
                message: `${openingElement.node.type} tags are not supported.`
              }
            )
          }

          const tagName = name.node.name
          const componentType = getJSXIdentifierType(name, code, config)

          if (componentType === null) {
            throw new ParseError(
              filePath,
              {
                code,
                start: openingElement.node.name.loc?.start,
                end: openingElement.node.name.loc?.end,
                message: 'JSX element is neither a Template nor a Serializable.'
              }
            )
          }

          const props = buildProps(
            openingElement.node.attributes,
            path.node
          )

          if (componentType === 'Template') {
            path.replaceWith(
              types.callExpression(
                types.identifier(tagName),
                [props]
              )
            )
            return
          }

          if (componentType.type === 'Serializable') {
            path.replaceWith(
              types.objectExpression([
                types.objectProperty(
                  types.identifier('type'),
                  types.stringLiteral('__RJT_COMPONENT__')
                ),
                types.objectProperty(
                  types.identifier('name'),
                  types.stringLiteral(componentType.name)
                ),
                types.objectProperty(
                  types.identifier('props'),
                  props
                )
              ])
            )
          }
        }
      }
    }
  )
}

const transform = (ast: types.File): void => {
  let lastImportIndex = -1
  let lastTypeDeclarationIndex = -1

  const body = ast.program.body

  body.forEach(item => {
    delete item.start
    delete item.end
    delete item.loc
  })

  const move = (from: number, to: number): void => {
    const node = body.splice(from, 1)[0]
    body.splice(to, 0, node)
  }

  for (let i = 0; i < body.length; i++) {
    const node = body[i]

    if (types.isImportDeclaration(node)) {
      move(i, ++lastImportIndex)
      lastTypeDeclarationIndex++
    } else if (types.isTSTypeAliasDeclaration(node) || types.isTSInterfaceDeclaration(node)) {
      move(i, ++lastTypeDeclarationIndex)
    }
  }

  const lastStatement = body.at(-1)

  if (!types.isExpressionStatement(lastStatement)) {
    throw new InternalError("Template's last statement should be an Expression statement")
  }

  const lastStatementExpression = lastStatement.expression

  if (!types.isExpression(lastStatement.expression)) {
    throw new InternalError('Last statement should be an Expression')
  }

  const defaultExport = types.exportDefaultDeclaration(
    types.functionDeclaration(
      null,
      [types.identifier('props')],
      types.blockStatement([
        ...body.slice(lastTypeDeclarationIndex + 1, -1),
        types.returnStatement(lastStatementExpression)
      ]),
      false,
      true
    )
  )

  body.splice(lastTypeDeclarationIndex + 1, body.length - lastTypeDeclarationIndex, defaultExport)

  const visitor = UnusedVarsPlugin({ types, traverse }).visitor

  traverse(ast, visitor)
}

const getJSXIdentifierType = (
  path: NodePath<types.JSXIdentifier>,
  code: string,
  config: Config
): 'Template' | RJTComponentType | null => {
  const binding = path.scope.getBinding(path.node.name)

  if (binding == null) {
    return null
  }

  if (binding.path.isVariableDeclarator()) {
    const possibleTypes = getIdentifierPossibleTypes(path)

    if (possibleTypes[0]?.type === 'Serializable') {
      throw new ParseError(config.filePath, {
        code,
        start: path.node.loc?.start,
        end: path.node.loc?.end,
        message: 'Serializable should not be declared in a template file'
      })
    }
  }


  let filePath: string | false = false
  let key: string | null = null

  if (binding.path.parentPath?.isImportDeclaration()) {
    const parent = binding.path.parent as types.ImportDeclaration
    const dirname = Path.dirname(config.filePath)
    filePath = resolveModule(dirname, parent.source.value)
    key = "default"

    if (filePath && isTemplatePath(filePath)) {
      return 'Template'
    }
  }

  if (binding.path.isImportSpecifier()) {
    const parent = binding.path.parent as types.ImportDeclaration
    const dirname = Path.dirname(config.filePath)
    filePath = resolveModule(dirname, parent.source.value)
    const imported = binding.path.get('imported')
    key = imported.isStringLiteral()
      ? imported.node.value
      : imported.isIdentifier()
        ? imported.node.name
        : ''
  }

  if (filePath && key) {

    const code = readFile(filePath)
    const ast = parseString(code, config.compilerConfig)

    const analyzerResult = analyze({
      cache: config.cache,
      ast,
      code,
      filePath
    })

    return analyzerResult.exports?.[key] ?? null
  }

  return null
}

const buildProps = (
  attributes?: Array<types.JSXAttribute | types.JSXSpreadAttribute>,
  children?: types.JSXElement
): types.ObjectExpression => {
  const properties: Array<types.ObjectProperty | types.SpreadElement> = []

  if (attributes != null) {
    const props = attributes.map((node) => {
      if (types.isJSXSpreadAttribute(node)) {
        return types.spreadElement(node.argument)
      }

      const propertyName = types.identifier(node.name.name as string)

      if (node.value == null) {
        return types.objectProperty(
          propertyName,
          types.booleanLiteral(true)
        )
      }

      if (types.isJSXExpressionContainer(node.value)) {
        return types.objectProperty(
          propertyName,
          types.isExpression(node.value.expression)
            ? node.value.expression
            : types.nullLiteral()
        )
      }

      return types.objectProperty(
        propertyName,
        node.value
      )
    })

    properties.push(...props)
  }

  if (children != null) {
    properties.push(
      types.objectProperty(
        types.identifier('children'),
        types.arrayExpression(types.react.buildChildren(children) as types.Expression[])
      )
    )
  }

  return types.objectExpression(properties)
}
