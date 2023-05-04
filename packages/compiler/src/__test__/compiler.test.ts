import fs from 'fs'
import { compile } from '../compiler'
import { type RJTCompilerCache, type RJTCompilerConfig } from '../types'

const S = `
import {Serializable} from "react-json-template"

export const S2 = Serializable("S2", () => null)

export default Serializable("S1", () => null)
`

const compilerConfig: RJTCompilerConfig = {
  sourceType: 'module',
  plugins: ['jsx', 'typescript']
}

const _compile = (code: string, cache: RJTCompilerCache = {}): string => {
  jest.spyOn(fs, 'readFileSync').mockImplementation((path) => {
    if (path === 'filePath') {
      return code
    }

    if (path === 'filePath/S') {
      return S
    }

    return ''
  })
  return compile({ filePath: 'filePath', compilerConfig, cache })
}

describe('compiler', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should throw Invalid syntax error if last statement is not JSX expression', () => {
    const code = `
    import {Repeat} from "./Repeat"

    const x = 5;

    <Repeat count={x}>
      Test
    </Repeat>

    const y = ""
    `

    expect(() => _compile(code)).toThrow('invalid syntax')
  })

  it('should throw Invalid syntax error if export ExportNamedDeclaration found', () => {
    const code = `
    import {Repeat} from "./Repeat"

    export const x = 5;

    <Repeat count={x}>
      Test
    </Repeat>
    `

    expect(() => _compile(code)).toThrow('invalid syntax')
  })

  it('should throw Invalid syntax error if export ExportAllDeclaration found', () => {
    const code = `
    import {Repeat} from "./Repeat"
    export * from "./exports"

    const x = 5;

    <Repeat count={x}>
      Test
    </Repeat>
    `

    expect(() => _compile(code)).toThrow('invalid syntax')
  })

  it('should throw Invalid syntax error if export ExportDefaultDeclaration found', () => {
    const code = `
    import {Repeat} from "./Repeat"
    export * from "./exports"
    
    const x = 5;

    export default x;

    <Repeat count={x}>
      Test
    </Repeat>
    `

    expect(() => _compile(code)).toThrow('invalid syntax')
  })

  it('should compile simple template', () => {
    const code = `
    import S1, {S2} from "./S"
  
    type X = number
  
    const x : X = 5;
  
    <S1>
      <S2 x={x} />
    </S1>
    `

    expect(_compile(code)).toMatchSnapshot()
  })

  it('should compile template with unordered imports and types', () => {
    const code = `
    
    type X = number
    const x : X = 5;
    
    import T1 from "./T.rjt"

    interface Y { foo: string}
    const y = { foo: "bar" };
      
    <T1 x={x} y={y} />
    `

    expect(_compile(code)).toMatchSnapshot()
  })

  it('should compile template with fragment', () => {
    const code = `
    import S1, {S2} from "./S"
    
    type X = number
    const x : X = 5;
  
    interface Y { foo: string}
    const y = { foo: "bar" };
      
    <>
      <S1 x={x} />
      <S2 y={y} />
    </>
    `

    expect(_compile(code)).toMatchSnapshot()
  })

  it('should compile template with nested templates', () => {
    const code = `
    import T1 from "./T.rjt"
    import S1 from "./S"
    
    type X = number
    const x : X = 5;
  
    interface Y { foo: string}
    const y = { foo: "bar" };
      
    <T1 x={x} y={y} s={<S1 x={x} />} />
    `

    expect(_compile(code)).toMatchSnapshot()
  })

  it('should compile template with string literals ', () => {
    const code = `
    import T1 from "./T.rjt"
    import S1 from "./S"

    <T1>
      Test
      <S1 />
    </T1>
    `

    expect(_compile(code)).toMatchSnapshot()
  })

  it('should compile template with js code ', () => {
    const code = `
    import T1 from "./T.rjt"
    import S1 from "./S"

    <T1>
      <S1 x={0} />
      {[1, 2, 3].map(item => <S1 x={item} />)}
    </T1>
    `

    expect(_compile(code)).toMatchSnapshot()
  })
})
