import traverse from "@babel/traverse"
import * as types from "@babel/types"
import { InvalidSyntaxError } from "./errors"

type Config = {
  code: string,
  filePath: string,
  ast: types.File
}

export const isValidTemplate = (config: Config): boolean => {
  const { ast, filePath, code } = config

  const lastExpression = ast.program.body.at(-1)

  if (
    !types.isExpressionStatement(lastExpression) ||
    !types.isJSXElement(lastExpression.expression)
  ) {
    throw new InvalidSyntaxError(filePath, {
      code,
      start: lastExpression?.loc?.start,
      end: lastExpression?.loc?.end,
    })
  }

  traverse(
    ast,
    {
      ExportAllDeclaration(path) {
        throw new InvalidSyntaxError(filePath, {
          code,
          start: path.node.loc?.start,
          end: path.node.loc?.end,
        })
      },
      ExportNamedDeclaration(path) {
        throw new InvalidSyntaxError(filePath, {
          code,
          start: path.node.loc?.start,
          end: path.node.loc?.end,
        })
      },
      ExportDefaultDeclaration(path) {
        throw new InvalidSyntaxError(filePath, {
          code,
          start: path.node.loc?.start,
          end: path.node.loc?.end,
        })
      }
    }
  )
  
  return true
}
