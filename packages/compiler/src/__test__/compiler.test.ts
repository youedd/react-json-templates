import fs from 'fs'
import { compile } from '../compiler'
import type { RJTCompilerConfig } from '../types'

const compilerConfig: RJTCompilerConfig = {
  sourceType: 'module',
  plugins: ['jsx', 'typescript']
}

const _compile = (code: string): string => {
  jest.spyOn(fs, 'readFileSync').mockImplementation((path) => {
    if (path === 'filePath') {
      return code
    }

    return ''
  })

  return compile({ filePath: 'filePath', compilerConfig })
}

describe('compiler', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should throw Invalid syntax error if last statement is not JSX expression', () => {
    const code = `
    const x = 5;

    <Repeat count={x}>
      Test
    </Repeat>

    const y = ""
    `

    expect(() => _compile(code)).toThrow('Invalid syntax')
  })

  it('should throw Invalid syntax error if export ExportNamedDeclaration found', () => {
    const code = `
    export const x = 5;

    <Repeat count={x}>
      Test
    </Repeat>
    `

    expect(() => _compile(code)).toThrow('Invalid syntax')
  })

  it('should throw Invalid syntax error if export ExportAllDeclaration found', () => {
    const code = `
    export * from "./exports"
    
    const x = 5;

    <Repeat count={x}>
      Test
    </Repeat>
    `

    expect(() => _compile(code)).toThrow('Invalid syntax')
  })

  it('should throw Invalid syntax error if export ExportDefaultDeclaration found', () => {
    const code = `    
    const x = 5;

    export default x;

    <Repeat count={x}>
      Test
    </Repeat>
    `

    expect(() => _compile(code)).toThrow('Invalid syntax')
  })

  it('should compile simple template', () => {
    const code = `  
    type X = number
  
    const x : X = 5;
  
    <S1>
      <S2 x={x} />
    </S1>
    `

    expect(_compile(code)).toMatchSnapshot()
  })

  it('should compile template with nested templates', () => {
    const code = `
    import T1 from "./T"
    
    type X = number
    const x : X = 5;
  
    interface Y { foo: string}
    const y = { foo: "bar" };
      
    <T1 x={x} y={y} s={<S1 x={x} />} />
    `

    expect(_compile(code)).toMatchSnapshot()
  })

  it('should compile template with unordered imports and types', () => {
    const code = `
    type X = number
    const x : X = 5;
    
    import T1 from "./T"

    interface Y { foo: string}
    const y = { foo: "bar" };
      
    <T1 x={x} y={y} />
    `

    expect(_compile(code)).toMatchSnapshot()
  })

  it('should compile template with fragment', () => {
    const code = `    
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

  it('should compile template with string literals ', () => {
    const code = `
    import T1 from "./T"

    <T1>
      Test
      <S1 />
    </T1>
    `

    expect(_compile(code)).toMatchSnapshot()
  })

  it('should compile template with js code ', () => {
    const code = `
    import T1 from "./T"

    <T1>
      <S1 x={0} />
      {[1, 2, 3].map(item => <S1 x={item} />)}
    </T1>
    `

    expect(_compile(code)).toMatchSnapshot()
  })
})
