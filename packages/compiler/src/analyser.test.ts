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

  it('should detect default Template exports', () => {
    assert(
      `
      import {Template} from 'react-json-templates'

      export default Template(() => null);
      `,
      {
        default: { type: 'Template' }
      }
    )

    assert(
      `
      import {Template as _Template} from 'react-json-templates'

      export default _Template(() => null);
      `,
      {
        default: { type: 'Template' }
      }
    )
  })

  it('should detect default variables export type', () => {
    assert(
      `
      import {Template} from 'react-json-templates'
    
      const variable = Template(() => null)
  
      export default variable
      `,
      {
        default: { type: 'Template' }
      }
    )

    assert(
      `
      import {Template, Serializable} from 'react-json-templates'
    
      let variable = Template(() => null)

      variable = Serializable("s1", () => null)

      export default variable
      `,
      {
        default: { type: 'Serializable', name: 's1' }
      }
    )

    assert(
      `
      import {Template, Serializable} from 'react-json-templates'
    
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
      import {Template, Serializable} from 'react-json-templates'
    
      let variable = Template(() => null)

      if(cond) {
        variable = Template(() => null)
      }

      export default variable
      `,
      {
        default: { type: 'Template' }
      }
    )

    assert(
      `
      import {Template, Serializable} from 'react-json-templates'
    
      let variable = Template(() => null)

      if(cond) {
        variable = Serializable(() => null)
      }
  
      export default variable
      `,
      {
      }
    )

    assert(
      `
      import {Template, Serializable} from 'react-json-templates'
    
      let variable = cond
        ? Template(() => null)
        : () => null
  
      export default variable
      `,
      {
      }
    )

    assert(
      `
      import {Template, Serializable} from 'react-json-templates'
    
      let variable = Template(() => null)
      
      variable = cond
        ? Template(() => null)
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
      import {Template, Serializable} from 'react-json-templates'
    
      export const n1 = () => null
      `,
      {
      }
    )

    assert(
      `
      import {Template, Serializable} from 'react-json-templates'
    
      const n1 = () => null

      export { n1 }
      `,
      {
      }
    )

    assert(
      `
      import {Template, Serializable} from 'react-json-templates'
    
      const _n1 = () => null

      export { _n1 as n1 }
      `,
      {
      }
    )
  })

  it('should detect named Template exports', () => {
    assert(
      `
      import {Template, Serializable} from 'react-json-templates'
    
      export const t1 = Template(() => null)
      `,
      {
        t1: { type: 'Template' }
      }
    )

    assert(
      `
      import {Template, Serializable} from 'react-json-templates'
    
      const t1 = Template(() => null)

      export { t1 }
      `,
      {
        t1: { type: 'Template' }
      }
    )

    assert(
      `
      import {Template, Serializable} from 'react-json-templates'
    
      const _t1 = Template(() => null)

      export { _t1 as t1 }
      `,
      {
        t1: { type: 'Template' }
      }
    )
  })

  it('should detect named Serializable exports', () => {
    assert(
      `
      import {Template, Serializable} from 'react-json-templates'
    
      export const s1 = Serializable("s1", () => null)
      `,
      {
        s1: { type: 'Serializable', name: 's1' }
      }
    )

    assert(
      `
      import {Template, Serializable} from 'react-json-templates'
    
      const s1 = Serializable("s1", () => null)

      export { s1 }
      `,
      {
        s1: { type: 'Serializable', name: 's1' }
      }
    )

    assert(
      `
      import {Template, Serializable} from 'react-json-templates'
    
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
      import {Template} from 'react-json-templates'
    
      const variable = Template(() => null)
  
      export const t1 = variable
      `,
      {
        t1: { type: 'Template' }
      }
    )

    assert(
      `
      import {Template, Serializable} from 'react-json-templates'
    
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
      import {Template, Serializable} from 'react-json-templates'
    
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
      import {Template, Serializable} from 'react-json-templates'
    
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
      import {Template, Serializable} from 'react-json-templates'
    
      const variable = Template(() => null)

      if(cond) {
        variable = Template(() => null)
      }

      export { variable as t1 }
      `,
      {
        t1: { type: 'Template' }
      }
    )

    assert(
      `
      import {Template, Serializable} from 'react-json-templates'
    
      let variable = Template(() => null)

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
      import {Template, Serializable} from 'react-json-templates'
    
      export const n1 = cond
        ? Template(() => null)
        : () => null
      `,
      {
      }
    )

    assert(
      `
      import {Template, Serializable} from 'react-json-templates'
    
      let variable = Template(() => null)
      
      variable = cond
        ? Template(() => null)
        : () => null
  
      export { variable as n1 }
      `,
      {
      }
    )

    assert(
      `
      import {Template, Serializable} from 'react-json-templates'
    
      export let variable = Template(() => null)
      
      variable = cond
        ? Template(() => null)
        : () => null
      `,
      {
      }
    )
  })

  it('should detect multiple export types', () => {
    assert(
      `
      import {Template, Serializable} from 'react-json-templates'

      export const s1 = Serializable("s1", () => null)

      export const t1 = Template(()=> null)

      const n1 = 5

      export const s2 = s1

      export let n2 = Template(()=> null)

      n2 = () => null

      export default Template(()=> null)
      `,
      {
        s1: { type: 'Serializable', name: 's1' },
        s2: { type: 'Serializable', name: 's1' },
        t1: { type: 'Template' },
        default: { type: 'Template' }
      }
    )
  })

  it('should use analyser cache', () => {
    const code = `
    import { Template } from "react-json-template";

    export const t1 = Template(()=> null)
    `
    const hash = getHash(code)

    jest.spyOn(fs, 'readFileSync').mockReturnValue(code)

    const cache: RJTAnalyserCache = {
      [hash]: { exports: { t1: { type: 'Template' } } }
    }

    const result = analyser('filePath', config, cache)

    expect(result).toBe(cache[hash])
  })

  it('should populate analyser cache', () => {
    const code = `
    import { Template } from "react-json-template";

    export const t1 = Template(()=> null)
    `
    const hash = getHash(code)

    jest.spyOn(fs, 'readFileSync').mockReturnValue(code)

    const cache: RJTAnalyserCache = {}

    expect(cache[hash]).toBeUndefined()

    const result = analyser('filePath', config, cache)

    expect(cache[hash]).toEqual({ exports: { t1: { type: 'Template' } } })
    expect(result).toBe(cache[hash])
  })
})
