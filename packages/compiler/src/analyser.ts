import traverse, { type NodePath } from '@babel/traverse'
import { parse } from '@babel/parser'
import * as types from '@babel/types'
import { RJTType, RJTAnalyserResult, CompilerConfig } from './types'
import { getIdentifierPossibleTypes, getRJTTypeFromPath } from './typeUtils'

export const analyser = (code: string, config: CompilerConfig): RJTAnalyserResult => {
  const result: RJTAnalyserResult = { exports: {} }

  const setExportType = (
    key: string,
    value: Array<RJTType | null> | RJTType | null
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

  const ast = parse(code, config)

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
