import { create } from 'enhanced-resolve'
import type * as types from '@babel/types'
import { type NodePath } from '@babel/traverse'

const resolveModule = create.sync({
  extensions: ['.tsx', '.jsx', 'ts', 'js']
})

export const resolve = (currentPath: string, module: string): string | null => {
  const path = resolveModule(currentPath, module)

  if (path === false) {
    return null
  }

  return path
}

export const resolveFromSpecifier = (currentPath: string, nodePath: NodePath<types.Node>): { imported: string, modulePath: string | null } | null => {
  const isImportDefault = nodePath.isImportDefaultSpecifier()
  const isImport = nodePath.isImportSpecifier() || isImportDefault

  if (!isImport) {
    return null
  }

  const importDeclaration = nodePath.parentPath as NodePath<types.ImportDeclaration>

  const source = importDeclaration.node.source.value
  const modulePath = resolve(currentPath, source)

  if (isImportDefault) {
    return {
      imported: 'default',
      modulePath
    }
  }

  const imported = nodePath.get('imported')

  return {
    imported: imported.isStringLiteral()
      ? imported.node.value
      : imported.isIdentifier()
        ? imported.node.name
        : '',
    modulePath
  }
}
