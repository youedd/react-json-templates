import traverse, { NodePath } from '@babel/traverse';
import { parse } from '@babel/parser';
import { ImportSpecifier, CallExpression, Identifier } from '@babel/types'

type ExportType = "Template" | "Serializable"
export type AnalyserResult = {
  exports: Record<string, ExportType>,
}

export const analyser = (code: string): AnalyserResult => {

  const result: AnalyserResult = { exports: {} }

  const setExportType = (key: string, value: ExportType | null) => {
    if (!value) {
      return
    }

    result.exports[key] = value
  }

  const ast = parse(
    code,
    {
      sourceType: 'module',
      plugins: ["typescript", "jsx"]
    })
  traverse(
    ast,
    {
      ExportNamedDeclaration(path) {

        const declaration = path.get("declaration")

        if (declaration.isVariableDeclaration()) {
          declaration.get("declarations").forEach(declarator => {
            const lVal = declarator.get("id")
            const rVal = declarator.get("init")

            if (!lVal.isIdentifier()) {
              return
            }

            const name = lVal.node.name

            const exportType = getExportTypeFromNode(rVal)
            setExportType(name, exportType)
          })
        }

        const specifiers = path.get("specifiers")

        specifiers.forEach(specifier => {
          if (!specifier.isExportSpecifier()) {
            return
          }

          const local = specifier.get('local')
          const exported = specifier.get("exported") as NodePath<Identifier>

          const name = exported.node.name

          const exportType = getExportTypeFromIdentifier(local)
          setExportType(name, exportType)

        })
      },
      ExportDefaultDeclaration(path) {
        const declaration = path.get("declaration")

        const exportType = getExportTypeFromNode(declaration)
        setExportType("default", exportType)
      }
    }
  );
  return result
}

const getExportTypeFromNode = (path: NodePath<any>): ExportType | null => {
  if (path.isCallExpression()) {
    return getExportTypeFromCallExpression(path)
  }

  if (path.isIdentifier()) {
    return getExportTypeFromIdentifier(path)
  }

  return null
}

const getExportTypeFromCallExpression = (path: NodePath<CallExpression>): ExportType | null => {

  const callee = path.get("callee")

  if (!callee.isIdentifier()) {
    return null
  }

  const name = callee.node.name
  const binding = callee.scope.getBinding(name)

  if (!binding?.path.isImportSpecifier()) {
    return null
  }

  return getImportSpecifierType(binding?.path)
}

const getExportTypeFromIdentifier = (path: NodePath<Identifier>): ExportType | null => {
  const possibleTypes = getIdentifierPossibleTypes(path)

  return possibleTypes.length === 1
    ? possibleTypes[0]
    : null
}

const getImportSpecifierType = (path: NodePath<ImportSpecifier>): ExportType | null => {
  const imported = path.get('imported')

  if (!imported.isIdentifier()) {
    return null
  }

  return ["Template", "Serializable"].includes(imported.node.name)
    ? imported.node.name as ExportType
    : null
}

const isConditional = (path: NodePath<any> | null): boolean => {
  if (!path) {
    return false
  }

  if (path.isConditionalExpression() || path.isIfStatement()) {
    return true
  }

  return isConditional(path.parentPath)
}

const getIdentifierPossibleTypes = (path: NodePath<Identifier>): Array<ExportType | null> => {
  const binding = path.scope.getBinding(path.node.name)

  if (!binding?.path.isVariableDeclarator()) {
    return []
  }

  const rightValues = [
    binding.path,
    ...binding.constantViolations
  ]

  const possibleTypes = new Set<ExportType | null>()

  for (let i = rightValues.length - 1; i >= 0; i--) {
    const valuePath = rightValues[i];

    if (valuePath.isVariableDeclarator()) {
      const init = valuePath.get("init")
      possibleTypes.add(getExportTypeFromNode(init))
    }
    else if (valuePath.isAssignmentExpression()) {
      const rVal = valuePath.get("right")
      possibleTypes.add(getExportTypeFromNode(rVal))
    }
    else {
      possibleTypes.add(null)
    }

    if (!isConditional(valuePath)) {
      break;
    }
  }

  return Array.from(possibleTypes)
}