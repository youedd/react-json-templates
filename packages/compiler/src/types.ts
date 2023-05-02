import type { ParserPlugin } from '@babel/parser'
import { type File } from '@babel/types'

export type RJTType = 'Serializable'
export type RJTComponentType = {
  type: RJTType,
  name: string
}


export type RJTAnalyserResult =
  | {
    type: "Exports",
    exports: Record<string, RJTComponentType>
  }
  | {
    type: "Template",
    exports: null
  }

export type RJTAnalyserCache = Record<string, RJTAnalyserResult>

export interface RJTCompilerConfig {
  sourceType: 'module'
  plugins: ParserPlugin[]
}


export type RJTAnalyserConfig = {
  code: string,
  ast: File,
  filePath: string,
  cache: RJTAnalyserCache
}