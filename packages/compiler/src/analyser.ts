import traverse, { NodePath } from '@babel/traverse';
import { parse } from '@babel/parser';
import { ImportSpecifier, CallExpression, Identifier, Expression } from '@babel/types'

type ExportType = "Unknown" | "Template" | "Serializable"
export type AnalyserResult = {
  exports: Record<string, ExportType>,
}

export const analyser = (code: string): AnalyserResult => {

  const result: AnalyserResult = { exports: {} }

  const ast = parse(
    code,
    {
      sourceType: 'module',
      plugins: ["typescript", "jsx"]
    })
  traverse(
    ast,
    {
      ExportDeclaration(path) {

      },
      ExportDefaultDeclaration(path) {
        const declaration = path.get("declaration")
        result.exports.default = getExportTypeFromDeclaration(declaration)
      }
    }
  );
  return result
}

const getExportTypeFromDeclaration = (path: NodePath): ExportType => {
  if (path.isCallExpression()) {
    return getExportTypeFromCallExpression(path)
  }

  if (path.isIdentifier()) {
    return getExportTypeFromIdentifier(path)
  }

  return "Unknown"
}

const getExportTypeFromCallExpression = (path: NodePath<CallExpression>) => {

  const callee = path.get("callee")

  if (!callee.isIdentifier()) {
    return "Unknown"
  }

  const name = callee.node.name
  const binding = callee.scope.getBinding(name)

  if (!binding?.path.isImportSpecifier()) {
    return "Unknown"
  }

  return getImportSpecifierType(binding?.path)
}

const getExportTypeFromIdentifier = (path: NodePath<Identifier>): ExportType => {
  const binding = path.scope.getBinding(path.node.name)

  if (!binding?.path.isVariableDeclarator()) {
    return "Unknown"
  }

  const rightValues = [
    binding.path.get("init"),
    ...binding.constantViolations
  ]

  const possibleTypes = new Set<ExportType>()

  for (let i = rightValues.length - 1; i >= 0; i--) {
    const valuePath = rightValues[i];

    if (valuePath.isCallExpression()) {
      possibleTypes.add(getExportTypeFromCallExpression(valuePath))
    }

    else if (valuePath.isAssignmentExpression()) {
      const rVal = valuePath.get("right")

      possibleTypes.add(
        rVal.isCallExpression()
          ? getExportTypeFromCallExpression(rVal)
          : "Unknown"
      )
    }

    else {
      possibleTypes.add("Unknown")
    }


    if (!isConditional(valuePath)) {
      break;
    }
  }

  return possibleTypes.size === 1
    ? Array.from(possibleTypes)[0]
    : "Unknown"
}

const getImportSpecifierType = (path: NodePath<ImportSpecifier>): ExportType => {
  const imported = path.get('imported')

  if (!imported.isIdentifier()) {
    return "Unknown"
  }

  return ["Template", "Serializable"].includes(imported.node.name)
    ? imported.node.name as ExportType
    : "Unknown"
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