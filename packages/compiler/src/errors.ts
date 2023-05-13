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
      message = 'Invalid syntax'
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

export class InternalError extends Error {
}
