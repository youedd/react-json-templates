import { InternalError, InvalidSyntaxError } from './errors'
import type { RJTCompilerConfig } from './types'
import { parseFile } from './utils'
import traverse, { type NodePath } from '@babel/traverse'
import generate from '@babel/generator'
import * as types from '@babel/types'

interface Config {
  filePath: string
  compilerConfig: RJTCompilerConfig
}

export const compile = (config: Config): string => {
  const { filePath, compilerConfig } = config
  const { ast, code } = parseFile(filePath, compilerConfig)

  const lastExpression = ast.program.body[ast.program.body.length - 1]

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

  traverse(
    ast,
    {
      ImportNamespaceSpecifier (path) {
        if (path.node.local.name !== 'RJT') {
          return
        }

        const parent = path.parent as types.ImportDeclaration
        if (parent.source.value !== '@react-json-templates/core') {
          return
        }

        if (parent.specifiers.length === 1) {
          path.parentPath.remove()
        } else {
          path.remove()
        }
      },
      ExportAllDeclaration (path) {
        throw new InvalidSyntaxError(filePath, {
          code,
          start: path.node.loc?.start,
          end: path.node.loc?.end
        })
      },
      ExportNamedDeclaration (path) {
        throw new InvalidSyntaxError(filePath, {
          code,
          start: path.node.loc?.start,
          end: path.node.loc?.end
        })
      },
      ExportDefaultDeclaration (path) {
        throw new InvalidSyntaxError(filePath, {
          code,
          start: path.node.loc?.start,
          end: path.node.loc?.end
        })
      },
      JSXAttribute (path) {
        const value = path.get('value')
        if (value.isJSXElement() || value.isJSXFragment()) {
          path.node.value = types.jsxExpressionContainer(value.node)
        }
      },
      JSXFragment: {
        exit (path) {
          const children = types.arrayExpression(buildChildren(path))

          path.replaceWith(
            types.callExpression(
              types.memberExpression(
                types.identifier('RJT'),
                types.identifier('Fragment')
              ),
              [children]
            )
          )
        }
      },
      JSXElement: {
        exit (path) {
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
          const isTemplate = path.scope.getBinding(tagName) != null

          const props = buildProps(path)

          if (isTemplate) {
            path.replaceWith(
              types.callExpression(
                types.identifier(tagName),
                [props]
              )
            )
            return
          }
          path.replaceWith(
            types.callExpression(
              types.memberExpression(
                types.identifier('RJT'),
                types.identifier('Component')
              ),
              [types.stringLiteral(tagName), props]
            )
          )
        }
      }
    }
  )

  addBuildersImport(ast)
  addDefaultExport(ast)

  return generate(ast).code
}

const addBuildersImport = (ast: types.File): void => {
  const builderImport = types.importDeclaration(
    [types.importNamespaceSpecifier(types.identifier('RJT'))],
    types.stringLiteral('@react-json-templates/core')
  )

  ast.program.body.unshift(builderImport)
}

const addDefaultExport = (ast: types.File): void => {
  let lastImportIndex = -1
  let lastTypeDeclarationIndex = -1

  let shouldTypeProps = false

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
      shouldTypeProps = shouldTypeProps || node.id.name === 'Props'
    }
  }

  const lastStatement = body[body.length - 1]

  if (!types.isExpressionStatement(lastStatement)) {
    throw new InternalError("Template's last statement should be an Expression statement")
  }

  const lastStatementExpression = lastStatement.expression

  if (!types.isExpression(lastStatement.expression)) {
    throw new InternalError('Last statement should be an Expression')
  }

  const props = types.identifier('props')
  if (shouldTypeProps) {
    props.typeAnnotation = types.tsTypeAnnotation(
      types.tsTypeReference(types.identifier('Props'))
    )
  }
  const defaultExport = types.exportDefaultDeclaration(
    types.functionDeclaration(
      null,
      [props],
      types.blockStatement([
        ...body.slice(lastTypeDeclarationIndex + 1, -1),
        types.returnStatement(lastStatementExpression)
      ]),
      false,
      true
    )
  )

  body.splice(lastTypeDeclarationIndex + 1, body.length - lastTypeDeclarationIndex, defaultExport)
}

const buildProps = (path: NodePath<types.JSXElement | types.JSXFragment>): types.ObjectExpression => {
  const properties: Array<types.ObjectProperty | types.SpreadElement> = []

  const attributes = path.isJSXElement()
    ? path.get('openingElement').get('attributes')
    : null

  if (attributes != null) {
    const props = attributes.map((nodePath) => {
      if (nodePath.isJSXSpreadAttribute()) {
        return types.spreadElement(nodePath.node.argument)
      }

      const node = nodePath.node as types.JSXAttribute

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

  const children = buildChildren(path)

  if (children.length > 0) {
    properties.push(
      types.objectProperty(
        types.identifier('children'),
        types.arrayExpression(children)
      )
    )
  }

  return types.objectExpression(properties)
}

const buildChildren = (path: NodePath<types.JSXElement | types.JSXFragment>): types.Expression[] => {
  return types.react.buildChildren(path.node) as types.Expression[]
}
