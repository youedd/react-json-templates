import type { ParserPlugin } from '@babel/parser'

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

export type RJTCompilerCache = Record<string, RJTAnalyserResult>

export interface RJTCompilerConfig {
  sourceType: 'module'
  plugins: ParserPlugin[]
}
