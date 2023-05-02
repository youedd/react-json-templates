import traverse, { type NodePath } from '@babel/traverse'
import type * as types from '@babel/types'
import type { RJTAnalyserConfig, RJTAnalyserResult, RJTComponentType } from '../types'
import { getIdentifierPossibleTypes, getRJTTypeFromPath } from '../typeUtils'

/**
 *
 * Analyze a file source code, extract exported Serializables.
 * Updates the Analyser's cache
 *
 * @param filePath
 * @param config Compiler config
 * @returns  Analyser's result
 */
export const analyzeExports = (config: RJTAnalyserConfig): RJTAnalyserResult => {
  const { ast } = config

  const result: RJTAnalyserResult = { type: "Exports", exports: {} }

  const setExportType = (
    key: string,
    value: Array<RJTComponentType | null> | RJTComponentType | null
  ): void => {
    const val = Array.isArray(value)
      ? value.length === 1 && value[0] !== null
        ? value[0]
        : null
      : value

    if (val == null) {
      return
    }

    result.exports[key] = val
  }

  traverse(
    ast,
    {
      ExportNamedDeclaration(path) {
        const declaration = path.get('declaration')

        if (declaration.isVariableDeclaration()) {
          declaration.get('declarations').forEach(declarator => {
            const lVal = declarator.get('id')

            if (!lVal.isIdentifier()) {
              return
            }

            const name = lVal.node.name

            const exportTypes = getIdentifierPossibleTypes(lVal)
            setExportType(name, exportTypes)
          })
        }

        const specifiers = path.get('specifiers')

        specifiers.forEach(specifier => {
          if (!specifier.isExportSpecifier()) {
            return
          }

          const local = specifier.get('local')
          const exported = specifier.get('exported') as NodePath<types.Identifier>

          const name = exported.node.name

          const exportType = getRJTTypeFromPath(local)
          setExportType(name, exportType)
        })
      },
      ExportDefaultDeclaration(path) {
        const declaration = path.get('declaration')

        const exportType = getRJTTypeFromPath(declaration)
        setExportType('default', exportType)
      }
    }
  )

  return result
}
