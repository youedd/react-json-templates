import type { ParserPlugin } from "@babel/parser"

export type RJTType = 'Template' | 'Serializable';

export interface RJTAnalyserResult {
  exports: Record<string, RJTType>
}

export type RJTCompilerCache = {
  [hash: string]: RJTAnalyserResult
}

export type CompilerConfig = {
  sourceType: "module",
  plugins: ParserPlugin[]
}