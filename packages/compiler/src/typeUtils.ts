import { NodePath } from "@babel/traverse"
import * as types from "@babel/types"
import { RJTType } from "./types"

export const getIdentifierPossibleTypes = (path: NodePath<types.Identifier>): Array<RJTType | null> => {
  const binding = path.scope.getBinding(path.node.name)

  if (binding == null || !binding?.path.isVariableDeclarator()) {
    return []
  }

  const rightValues = [
    binding.path,
    ...binding.constantViolations
  ]

  const possibleTypes = new Set<RJTType | null>()

  for (let i = rightValues.length - 1; i >= 0; i--) {
    const valuePath = rightValues[i]

    if (valuePath.isVariableDeclarator()) {
      const init = valuePath.get('init')
      possibleTypes.add(getRJTTypeFromPath(init))
    } else if (valuePath.isAssignmentExpression()) {
      const rVal = valuePath.get('right')
      possibleTypes.add(getRJTTypeFromPath(rVal))
    } else {
      possibleTypes.add(null)
    }

    if (!isConditional(valuePath)) {
      break
    }
  }

  return Array.from(possibleTypes)
}

export const getRJTTypeFromPath = (path: NodePath<any>): RJTType | null => {
  if (path.isCallExpression()) {
    return getRJTTypeFromCallExpression(path)
  }

  if (path.isIdentifier()) {
    return getRJTTypeFromIdentifier(path)
  }

  return null
}

const getRJTTypeFromCallExpression = (path: NodePath<types.CallExpression>): RJTType | null => {
  const callee = path.get('callee')

  if (!callee.isIdentifier()) {
    return null
  }

  const name = callee.node.name
  const binding = callee.scope.getBinding(name)

  if (binding == null || !binding?.path.isImportSpecifier()) {
    return null
  }

  return getRJTTypeFromImportSpecifier(binding?.path)
}

const getRJTTypeFromIdentifier = (path: NodePath<types.Identifier>): RJTType | null => {
  const possibleTypes = getIdentifierPossibleTypes(path)

  return possibleTypes.length === 1
    ? possibleTypes[0]
    : null
}

const getRJTTypeFromImportSpecifier = (path: NodePath<types.ImportSpecifier>): RJTType | null => {
  const imported = path.get('imported')

  if (!imported.isIdentifier()) {
    return null
  }

  return ['Template', 'Serializable'].includes(imported.node.name)
    ? imported.node.name as RJTType
    : null
}

const isConditional = (path: NodePath<any> | null): boolean => {
  if (path == null) {
    return false
  }

  if (path.isConditionalExpression() || path.isIfStatement()) {
    return true
  }

  return isConditional(path.parentPath)
}
