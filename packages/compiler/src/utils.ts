import fs from 'fs'
import crypto from 'crypto'
import { parse } from '@babel/parser'
import { type File } from '@babel/types'
import { type RJTCompilerConfig } from './types'

/**
 * Given a file path, parse the file code into an AST
 * @param path
 * @returns
 */
export const parseFile = (path: string, config: RJTCompilerConfig): { code: string, ast: File } => {
  const code = readFile(path)
  return {
    code,
    ast: parseString(code, config)
  }
}

/**
 * Parse the source code into an AST
 * @param source
 * @returns AST
 */
export const parseString = (source: string, config: RJTCompilerConfig): File => {
  return parse(source, config)
}

/**
 *
 * @param path
 * @returns source
 */
export const readFile = (path: string): string => {
  return fs.readFileSync(path).toString()
}

/**
 * Returns a sha1 hash of the given string
 * @param str
 * @returns hash
 */
export const getHash = (str: string): string => {
  const shasum = crypto.createHash('sha1')
  shasum.update(str)
  return shasum.digest('hex')
}
