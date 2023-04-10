import type { ParserPlugin } from "@babel/parser"

export type RJTComponentType =
  | { type: 'Template' }
  | { type: 'Serializable', name: string }

export type RJTType = RJTComponentType['type']
export interface RJTAnalyserResult {
  exports: Record<string, RJTComponentType>
}

export type RJTCompilerCache = {
  [hash: string]: RJTAnalyserResult
}

export type RJTCompilerConfig = {
  sourceType: "module",
  plugins: ParserPlugin[]
}