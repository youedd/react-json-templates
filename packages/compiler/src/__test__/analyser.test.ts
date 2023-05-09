import * as Analyser from '../analyser'
import * as Utils from '../utils'
import type { File } from '@babel/types'
import type { RJTCompilerCache, RJTAnalyserResult, RJTCompilerConfig } from '../types'

const config: RJTCompilerConfig = {
  sourceType: 'module',
  plugins: ['jsx', 'typescript']
}

describe('analyzer', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe(Analyser.analyze, () => {
    it('should call analyzeExports when result not found in cache', () => {
      jest.spyOn(Utils, 'getHash').mockReturnValue('hash')

      const result: RJTAnalyserResult = {
        type: 'Exports',
        exports: {
          default: { name: 's11', type: 'Serializable' }
        }
      }
      const cache: RJTCompilerCache = {}

      const spy = jest.spyOn(Analyser, 'analyzeExports').mockReturnValue(result)

      expect(Analyser.analyze({ filePath: 'filePath', code: '', ast: null as unknown as File, cache })).toEqual(result)
      expect(spy).toBeCalled()
      expect(cache.hash).toBe(result)
    })

    it('should use cache for ', () => {
      jest.spyOn(Utils, 'getHash').mockReturnValue('hash')

      const result: RJTAnalyserResult = {
        type: 'Exports',
        exports: {
          default: { name: 's11', type: 'Serializable' }
        }
      }

      const cache: RJTCompilerCache = { hash: result }

      const spy = jest.spyOn(Analyser, 'analyzeExports')

      expect(Analyser.analyze({ filePath: 'filePath', code: '', ast: null as unknown as File, cache })).toEqual(result)
      expect(spy).not.toBeCalled()
    })
  })

  describe(Analyser.analyzeExports, () => {
    const assert = (code: string, expected: RJTAnalyserResult): void => {
      const ast = Utils.parseString(code, config)

      const result = Analyser.analyzeExports({
        filePath: 'filePath',
        code,
        ast,
        cache: {}
      })

      expect(result).toEqual(expected)
    }

    it('should not detect default unknown exports', () => {
      assert(
        'export default 5;',
        {
          type: 'Exports',
          exports: {}
        }
      )
    })

    it('should detect default Serializable exports', () => {
      assert(
        `  
        export default () => {
          "serializable s1"

          return null;
        }
        `,
        {
          type: 'Exports',
          exports: {
            default: { type: 'Serializable', name: 's1' }
          }
        }
      )
    })

    it('should detect default variables export type', () => {
      assert(
        `      
        const variable = () => {
          "serializable s1"

          return null;
        }
    
        export default variable
        `,
        {
          type: 'Exports',
          exports: {
            default: { type: 'Serializable', name: 's1' }
          }
        }
      )

      assert(
        `      
        let variable = () => null
  
        variable = () => {
          "serializable s1"

          return null;
        }
    
        export default variable
        `,
        {
          type: 'Exports',
          exports: {
            default: { type: 'Serializable', name: 's1' }
          }
        }
      )
    })

    it('should not detect default variables export with conditional type', () => {
      assert(
        `
      
        let variable = () => {
          "serializable s1"

          return null;
        }
  
        if(cond) {
          variable = () => {
            "serializable s1"
  
            return null;
          }
        }
  
        export default variable
        `,
        {
          type: 'Exports',
          exports: {
            default: { type: 'Serializable', name: 's1' }
          }
        }
      )

      assert(
        `      
        let variable = () => {
          "serializable s1"

          return null;
        }
  
        if(cond) {
          variable = () => {
            "serializable s2"
  
            return null;
          }
        }
  
        export default variable
        `,
        {
          type: 'Exports',
          exports: {}
        }
      )

      assert(
        `      
        let variable = () => null
  
        if(cond) {
          variable = () => {
            "serializable s1"
  
            return null;
          }
        }
    
        export default variable
        `,
        {
          type: 'Exports',
          exports: {}
        }
      )

      assert(
        `
        let variable = cond
          ? () => {
              "serializable s1"
  
              return null;
            }
          : () => null
    
        export default variable
        `,
        {
          type: 'Exports',
          exports: {}
        }
      )
    })

    it('should not detect named unknown exports', () => {
      assert(
        `    
        export const n1 = () => null
        `,
        {
          type: 'Exports',
          exports: {}
        }
      )

      assert(
        `    
        const n1 = () => null
  
        export { n1 }
        `,
        {
          type: 'Exports',
          exports: {}
        }
      )

      assert(
        `    
        const _n1 = () => null
  
        export { _n1 as n1 }
        `,
        {
          type: 'Exports',
          exports: {}
        }
      )
    })

    it('should detect named Serializable exports', () => {
      assert(
        `
        export const s1 = () => {
          "serializable s1"

          return null;
        }
        `,
        {
          type: 'Exports',
          exports: {
            s1: { type: 'Serializable', name: 's1' }
          }
        }
      )

      assert(
        `      
        const s1 = () => {
          "serializable s1"

          return null;
        }
  
        export { s1 }
        `,
        {
          type: 'Exports',
          exports: {
            s1: { type: 'Serializable', name: 's1' }
          }
        }
      )

      assert(
        `      
        const _s1 = () => {
          "serializable s1"

          return null;
        }
  
        export { _s1 as s1 }
        `,
        {
          type: 'Exports',
          exports: {
            s1: { type: 'Serializable', name: 's1' }
          }
        }
      )
    })

    it('should detect named variables export type', () => {
      assert(
        `      
        const variable = () => {
          "serializable s1"

          return null;
        }
    
        export const s1 = variable
        `,
        {
          type: 'Exports',
          exports: {
            s1: { type: 'Serializable', name: 's1' }
          }
        }
      )

      assert(
        `      
        let variable = () => {
          "serializable _s1"

          return null;
        }
  
        variable = () => {
          "serializable s1"

          return null;
        }
  
        export const s1 = variable
        `,
        {
          type: 'Exports',
          exports: {
            s1: { type: 'Serializable', name: 's1' }
          }
        }
      )

      assert(
        `      
        let variable = () => null
  
        variable = () => {
          "serializable s1"

          return null;
        }
    
        export const s1 = variable
        `,
        {
          type: 'Exports',
          exports: {
            s1: { type: 'Serializable', name: 's1' }
          }
        }
      )

      assert(
        `      
        let variable = () => null
  
        variable = () => {
          "serializable s1"

          return null;
        }
  
        const s1 = variable
  
        export { s1 }
        `,
        {
          type: 'Exports',
          exports: {
            s1: { type: 'Serializable', name: 's1' }
          }
        }
      )
    })

    it('should not detect named variables export with conditional type', () => {
      assert(
        `      
        const variable = () => {
          "serializable s1"

          return null;
        }
  
        if(cond) {
          variable = () => {
          "serializable s1"

          return null;
        }
        }
  
        export { variable as s1 }
        `,
        {
          type: 'Exports',
          exports: {
            s1: { type: 'Serializable', name: 's1' }
          }
        }
      )

      assert(
        `      
        const variable = () => {
          "serializable s1"

          return null;
        }
  
        if(cond) {
          variable = () => {
            "serializable s2"
  
            return null;
          }
        }
  
        export { variable as s1 }
        `,
        {
          type: 'Exports',
          exports: {}
        }
      )

      assert(
        `      
        let variable = () => null
  
        if(cond) {
          variable = () => {
            "serializable s1"

            return null;
          }
        }
    
        export { variable as n1 }
        `,
        {
          type: 'Exports',
          exports: {}
        }
      )

      assert(
        `      
        let variable =  () => null
        
        variable = cond
          ? () => {
              "serializable s1"

              return null;
            }
          : () => null
    
        export { variable as n1 }
        `,
        {
          type: 'Exports',
          exports: {}
        }
      )

      assert(
        `      
        export const n1 = cond
          ? () => {
              "serializable s1"

              return null;
            }
          : () => null
        `,
        {
          type: 'Exports',
          exports: {}
        }
      )

      assert(
        `      
        export let variable = () => {
          "serializable s1"

          return null;
        }
        
        variable = cond
          ? () => {
              "serializable s2"
    
              return null;
            }
          : () => null
        `,
        {
          type: 'Exports',
          exports: {}
        }
      )
    })

    it('should detect multiple export types', () => {
      assert(
        `  
        export const s1 = () => {
          "serializable s1"

          return null;
        }
  
        const n1 = 5
  
        export const s2 = s1
  
        export let n2 = () => {
          "serializable _s2"

          return null;
        }
  
        n2 = () => null
  
        export default () => {
          "serializable s3"

          return null;
        }
        `,
        {
          type: 'Exports',
          exports: {
            s1: { type: 'Serializable', name: 's1' },
            s2: { type: 'Serializable', name: 's1' },
            default: { type: 'Serializable', name: 's3' }
          }
        }
      )
    })
  })
})
