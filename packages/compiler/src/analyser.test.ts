import { analyser } from './analyser'
import type { RJTAnalyserCache, RJTAnalyserResult, RJTCompilerConfig } from './types'
import fs from 'fs'
import { getHash } from './utils'

const config: RJTCompilerConfig = {
  sourceType: 'module',
  plugins: ['jsx', 'typescript']
}

const assert = (code: string, expected: RJTAnalyserResult['exports']): void => {
  jest.spyOn(fs, 'readFileSync').mockReturnValue(code)

  const result = analyser('filPath', config)

  expect(result.exports).toEqual(expected)
}

describe('analyser', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should not detect default unknown exports', () => {
    assert(
      'export default 5;',
      {
      }
    )
  })

  it('should detect default Serializable exports', () => {
    assert(
      `
      import {Serializable as Serializable} from 'react-json-templates'

      export default Serializable("s1",() => null);
      `,
      {
        default: { type: 'Serializable', name: 's1' }
      }
    )

    assert(
      `
      import {Serializable as _Serializable} from 'react-json-templates'

      export default _Serializable("s1", () => null);
      `,
      {
        default: { type: 'Serializable', name: 's1' }
      }
    )
  })

  it('should detect default variables export type', () => {
    assert(
      `
      import {Serializable} from 'react-json-templates'
    
      const variable = Serializable("s1", () => null)
  
      export default variable
      `,
      {
        default: { type: 'Serializable', name: 's1' }
      }
    )


    assert(
      `
      import {Serializable} from 'react-json-templates'
    
      let variable = () => null

      variable = Serializable("s1", () => null)
  
      export default variable
      `,
      {
        default: { type: 'Serializable', name: 's1' }
      }
    )
  })

  it('should not detect default variables export with conditional type', () => {
    assert(
      `
      import {Serializable} from 'react-json-templates'
    
      let variable = Serializable("s1", () => null)

      if(cond) {
        variable = Serializable("s1", () => null)
      }

      export default variable
      `,
      {
        default: { type: 'Serializable', name: "s1" }
      }
    )

    assert(
      `
      import {Template, Serializable} from 'react-json-templates'
    
      let variable = Serializable("s1", () => null)

      if(cond) {
        variable = Serializable("s2", () => null)
      }

      export default variable
      `,
      {
      }
    )

    assert(
      `
      import {Serializable} from 'react-json-templates'
    
      let variable = () => null

      if(cond) {
        variable = Serializable("s1", () => null)
      }
  
      export default variable
      `,
      {
      }
    )

    assert(
      `
      import {Serializable} from 'react-json-templates'
    
      let variable = cond
        ? Serializable("s1", () => null)
        : () => null
  
      export default variable
      `,
      {
      }
    )
  })

  it('should not detect named unknown exports', () => {
    assert(
      `    
      export const n1 = () => null
      `,
      {
      }
    )

    assert(
      `    
      const n1 = () => null

      export { n1 }
      `,
      {
      }
    )

    assert(
      `    
      const _n1 = () => null

      export { _n1 as n1 }
      `,
      {
      }
    )
  })

  it('should detect named Serializable exports', () => {
    assert(
      `
      import {Serializable} from 'react-json-templates'
    
      export const s1 = Serializable("s1", () => null)
      `,
      {
        s1: { type: 'Serializable', name: 's1' }
      }
    )

    assert(
      `
      import {Serializable} from 'react-json-templates'
    
      const s1 = Serializable("s1", () => null)

      export { s1 }
      `,
      {
        s1: { type: 'Serializable', name: 's1' }
      }
    )

    assert(
      `
      import {Serializable} from 'react-json-templates'
    
      const _s1 = Serializable("s1", () => null)

      export { _s1 as s1 }
      `,
      {
        s1: { type: 'Serializable', name: 's1' }
      }
    )
  })

  it('should detect named variables export type', () => {
    assert(
      `
      import {Serializable} from 'react-json-templates'
    
      const variable = Serializable("s1", () => null)
  
      export const s1 = variable
      `,
      {
        s1: { type: 'Serializable', name: 's1' }
      }
    )

    assert(
      `
      import {Serializable} from 'react-json-templates'
    
      let variable = Serializable("_s1", () => null)

      variable = Serializable("s1", () => null)

      export const s1 = variable
      `,
      {
        s1: { type: 'Serializable', name: 's1' }
      }
    )

    assert(
      `
      import {Serializable} from 'react-json-templates'
    
      let variable = () => null

      variable = Serializable("s1", () => null)
  
      export const s1 = variable
      `,
      {
        s1: { type: 'Serializable', name: 's1' }
      }
    )

    assert(
      `
      import {Serializable} from 'react-json-templates'
    
      let variable = () => null

      variable = Serializable("s1", () => null)

      const s1 = variable

      export { s1 }
      `,
      {
        s1: { type: 'Serializable', name: 's1' }
      }
    )
  })

  it('should not detect named variables export with conditional type', () => {
    assert(
      `
      import {Serializable} from 'react-json-templates'
    
      const variable = Serializable("s1", () => null)

      if(cond) {
        variable = Serializable("s1", () => null)
      }

      export { variable as s1 }
      `,
      {
        s1: { type: 'Serializable', name: "s1" }
      }
    )

    assert(
      `
      import {Serializable} from 'react-json-templates'
    
      const variable = Serializable("s1", () => null)

      if(cond) {
        variable = Serializable("s2", () => null)
      }

      export { variable as s1 }
      `,
      {
      }
    )

    assert(
      `
      import {Serializable} from 'react-json-templates'
    
      let variable = () => null

      if(cond) {
        variable = Serializable("s1", () => null)
      }
  
      export { variable as n1 }
      `,
      {
      }
    )

    assert(
      `
      import {Serializable} from 'react-json-templates'
    
      let variable =  () => null
      
      variable = cond
        ? Serializable("s1", () => null)
        : () => null
  
      export { variable as n1 }
      `,
      {
      }
    )

    assert(
      `
      import {Template, Serializable} from 'react-json-templates'
    
      export const n1 = cond
        ? Serializable("s1", () => null)
        : () => null
      `,
      {
      }
    )

    assert(
      `
      import {Template, Serializable} from 'react-json-templates'
    
      export let variable = Serializable("s1", () => null)
      
      variable = cond
        ? Serializable("s2", () => null)
        : () => null
      `,
      {
      }
    )
  })

  it('should detect multiple export types', () => {
    assert(
      `
      import {Serializable} from 'react-json-templates'

      export const s1 = Serializable("s1", () => null)

      const n1 = 5

      export const s2 = s1

      export let n2 = Serializable("_s2", () => null)

      n2 = () => null

      export default Serializable("s3", () => null)
      `,
      {
        s1: { type: 'Serializable', name: 's1' },
        s2: { type: 'Serializable', name: 's1' },
        default: { type: 'Serializable', name: 's3' }
      }
    )
  })

  it('should use analyser cache', () => {
    const code = `
    import { Serializable } from "react-json-template";

    export const s1 = Serializable("s1",()=> null)
    `
    const hash = getHash(code)

    jest.spyOn(fs, 'readFileSync').mockReturnValue(code)

    const cache: RJTAnalyserCache = {
      [hash]: { exports: { s1: { type: 'Serializable', name: "s1" } } }
    }

    const result = analyser('filePath', config, cache)

    expect(result).toBe(cache[hash])
  })

  it('should populate analyser cache', () => {
    const code = `
    import { Serializable } from "react-json-template";

    export const s1 = Serializable("s1", ()=> null)
    `
    const hash = getHash(code)

    jest.spyOn(fs, 'readFileSync').mockReturnValue(code)

    const cache: RJTAnalyserCache = {}

    expect(cache[hash]).toBeUndefined()

    const result = analyser('filePath', config, cache)

    expect(cache[hash]).toEqual({ exports: { s1: { type: 'Serializable', name: "s1" } } })
    expect(result).toBe(cache[hash])
  })
})
