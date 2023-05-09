import { type NodePath } from '@babel/traverse'
import * as types from '@babel/types'
import { type RJTComponentType } from './types'

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
  if (path.isIdentifier()) {
    return getRJTTypeFromIdentifier(path)
  }

  return parseSerializable(path)
}

const parseSerializable = (path: NodePath): RJTComponentType | null => {
  if (!path.isFunctionDeclaration() && !path.isArrowFunctionExpression()) {
    return null
  }
  const body = path.node.body

  if (!types.isBlockStatement(body)) {
    return null
  }

  const serializableDirective = body.directives.find(item => item.value.value.match(/serializable .+/))?.value.value

  if (serializableDirective == null) {
    return null
  }

  const name = serializableDirective.replace('serializable ', '').trim()

  if (name === '') {
    return null
  }

  return {
    type: 'Serializable',
    name
  }
}

const getRJTTypeFromIdentifier = (path: NodePath<types.Identifier>): RJTComponentType | null => {
  const possibleTypes = getIdentifierPossibleTypes(path)

  return possibleTypes.length === 1
    ? possibleTypes[0]
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
