import { type NodePath } from '@babel/traverse'
import type * as types from '@babel/types'
import { type RJTComponentType, type RJTType } from './types'

export const getIdentifierPossibleTypes = (
  path: NodePath<types.Identifier | types.JSXIdentifier>
): Array<RJTComponentType | null> => {
  const binding = path.scope.getBinding(path.node.name)

  if (binding == null || !binding?.path.isVariableDeclarator()) {
    return []
  }

  const rightValues = [
    binding.path,
    ...binding.constantViolations
  ]

  const possibleTypes: Array<RJTComponentType | null> = []

  for (let i = rightValues.length - 1; i >= 0; i--) {
    const valuePath = rightValues[i]

    if (valuePath.isVariableDeclarator()) {
      const init = valuePath.get('init')
      possibleTypes.push(getRJTTypeFromPath(init))
    } else if (valuePath.isAssignmentExpression()) {
      const rVal = valuePath.get('right')
      possibleTypes.push(getRJTTypeFromPath(rVal))
    } else {
      possibleTypes.push(null)
    }

    if (!isConditional(valuePath)) {
      break
    }
  }

  return possibleTypes
    .filter((item, index, self) => {
      const isFirstOccurrence = index === self.findIndex(i => {
        if (item?.type === 'Serializable') {
          return i?.type === 'Serializable' && i?.name === item.name
        }

        return i === null
      })

      return isFirstOccurrence
    })
}

export const getRJTTypeFromPath = (path: NodePath<any>): RJTComponentType | null => {
  if (path.isCallExpression()) {
    return getRJTTypeFromCallExpression(path)
  }

  if (path.isIdentifier()) {
    return getRJTTypeFromIdentifier(path)
  }

  return null
}

const getRJTTypeFromCallExpression = (path: NodePath<types.CallExpression>): RJTComponentType | null => {
  const callee = path.get('callee')

  if (!callee.isIdentifier()) {
    return null
  }

  const name = callee.node.name
  const binding = callee.scope.getBinding(name)

  if (binding == null || !binding?.path.isImportSpecifier()) {
    return null
  }

  const type = getRJTTypeFromImportSpecifier(binding?.path)

  if (type === 'Serializable') {
    const name = path.get('arguments')[0]

    if (name?.isStringLiteral()) {
      return {
        type,
        name: name.node.value
      }
    }
  }

  return null
}

const getRJTTypeFromIdentifier = (path: NodePath<types.Identifier>): RJTComponentType | null => {
  const possibleTypes = getIdentifierPossibleTypes(path)

  return possibleTypes.length === 1
    ? possibleTypes[0]
    : null
}

const getRJTTypeFromImportSpecifier = (path: NodePath<types.ImportSpecifier>): RJTType | null => {
  const parent = path.parent as types.ImportDeclaration
  const source = parent.source.value

  if (source != "@react-json-templates/core") {
    return null
  }

  const imported = path.get('imported')

  if (!imported.isIdentifier()) {
    return null
  }

  return ['Serializable'].includes(imported.node.name)
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
