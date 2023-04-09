import traverse, { NodePath } from '@babel/traverse';
import { parse } from '@babel/parser';
import { ImportSpecifier } from '@babel/types'

type ExportType = "Unknown" | "Template" | "Specifier"
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

        const getType = (): ExportType => {
          if (!declaration.isCallExpression()) {
            return "Unknown"
          }
          const callee = declaration.get("callee")

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

        result.exports.default = getType()
      }
    }
  );

  return result
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
