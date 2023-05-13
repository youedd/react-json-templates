import type { ParserPlugin } from '@babel/parser'

export interface RJTCompilerConfig {
  sourceType: 'module'
  plugins: ParserPlugin[]
}
