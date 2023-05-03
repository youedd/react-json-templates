import { codeFrameColumns, type SourceLocation } from '@babel/code-frame'

interface ErrorParams {
  code?: string
  start?: SourceLocation['start']
  end?: SourceLocation['end']
  message?: string
}

export class InvalidSyntaxError extends SyntaxError {
  constructor (
    file: string,
    params?: ErrorParams
  ) {
    const {
      code = '',
      start,
      end,
      message = 'invalid syntax'
    } = params ?? {}

    const content = code !== '' && (start != null) && (end != null)
      ? `${codeFrameColumns(code, { start, end })}`
      : ''

    const { line = '', column = '' } = start ?? {}
    const startLine = line !== '' ? `:${line}` : ''
    const startColumn = column !== '' ? `:${column}` : ''

    super(`${message}\n${file}${startLine}${startColumn}\n${content}`)
  }
}

export class ParseError extends Error {
  constructor (
    file: string,
    options?: ErrorParams
  ) {
    const {
      code,
      start,
      end,
      message = 'Parse Error'
    } = options ?? {}

    const content = code != null && (start != null) && (end != null)
      ? `${codeFrameColumns(code, { start, end })}`
      : ''
    const { line = '', column = '' } = start ?? {}
    const startLine = line !== '' ? `:${line}` : ''
    const startColumn = column !== '' ? `:${column}` : ''

    super(`${message}\n${file}${startLine}${startColumn}\n${content}`)
  }
}

export class InternalError extends Error {
}
