import { RJTAnalyserCache, RJTAnalyserResult, RJTCompilerConfig } from "../types";
import { getHash, readFile } from "../utils";
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
export const analyze = (
  filePath: string,
  config: RJTCompilerConfig,
  cache: RJTAnalyserCache
): RJTAnalyserResult => {
  const code = readFile(filePath)
  const hash = getHash(code)

  if (cache[hash]) {
    return cache[hash]
  }

  if (
    filePath.endsWith("rjt.tsx") ||
    filePath.endsWith("rjt.jsx")
  ) {
    cache[hash] = analyzeTemplate(filePath, code, config)
  } else {
    cache[hash] = analyzeExports(filePath, code, config)
  }

  return cache[hash]
}