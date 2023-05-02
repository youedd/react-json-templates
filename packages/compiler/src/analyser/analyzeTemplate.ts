import traverse from '@babel/traverse'
import * as types from '@babel/types'
import type { RJTAnalyserConfig, RJTAnalyserResult } from '../types'
import { InvalidSyntaxError } from '../errors'

/**
 *
 * Analyze a template file source code and check if it's valid.
 *
 * @param filePath
 * @param config Compiler config
 * @returns  Analyser's result
 */
export const analyzeTemplate = (config: RJTAnalyserConfig): RJTAnalyserResult => {
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

  return { type: "Template", exports: null }
}
