import { RJTAnalyserConfig, RJTAnalyserResult } from "../types";
import { getHash } from "../utils";
import { analyzeExports } from "./analyzeExports";
import { analyzeTemplate } from "./analyzeTemplate";


/**
 *
 * Analyze a file source code and check for valid template or exported Serializables.
 * Updates the Analyser's cache
 *
 * @param filePath
 * @param config Compiler config
 * @param cache Analyser's cache
 * @returns  Analyser's result
 */
export const analyze = (config: RJTAnalyserConfig): RJTAnalyserResult => {
  const { filePath, code, cache } = config

  const hash = getHash(code)

  if (cache[hash]) {
    return cache[hash]
  }

  if (
    filePath.endsWith("rjt.tsx") ||
    filePath.endsWith("rjt.jsx")
  ) {
    cache[hash] = analyzeTemplate(config)
  } else {
    cache[hash] = analyzeExports(config)
  }

  return cache[hash]
}