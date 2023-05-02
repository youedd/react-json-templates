import fs from 'fs'
import * as Analyser from '../analyser'
import * as ExportAnalyser from "../analyser/analyzeExports"
import * as TemplateAnalyser from "../analyser/analyzeTemplate"
import * as Utils from "../utils"
import type { RJTAnalyserCache, RJTAnalyserResult, RJTCompilerConfig } from '../types'

const config: RJTCompilerConfig = {
  sourceType: 'module',
  plugins: ['jsx', 'typescript']
}

describe('analyzer', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe(Analyser.analyze, () => {
    it("should call analyzeExports for non templates files", () => {
      jest.spyOn(fs, 'readFileSync').mockReturnValue("")
      jest.spyOn(Utils, "getHash").mockReturnValue("hash")

      const result: RJTAnalyserResult = {
        type: "Exports",
        exports: {
          default: { name: "s11", type: "Serializable" }
        }
      }
      const cache: RJTAnalyserCache = {}

      const spy = jest.spyOn(ExportAnalyser, 'analyzeExports').mockReturnValue(result)

      expect(Analyser.analyze("filePath", config, cache)).toEqual(result)
      expect(spy).toBeCalled()
      expect(cache.hash).toBe(result)
    })

    it("should call analyzeTemplate for tsx templates files", () => {
      jest.spyOn(fs, 'readFileSync').mockReturnValue("")
      jest.spyOn(Utils, "getHash").mockReturnValue("hash")

      const result: RJTAnalyserResult = {
        type: "Template",
        exports: null
      }
      const cache: RJTAnalyserCache = {}

      const spy = jest.spyOn(TemplateAnalyser, 'analyzeTemplate').mockReturnValue(result)

      expect(Analyser.analyze("filePath.rjt.tsx", config, cache)).toEqual(result)
      expect(spy).toBeCalled()
      expect(cache.hash).toBe(result)
    })

    it("should call analyzeTemplate for jsx templates files", () => {
      jest.spyOn(fs, 'readFileSync').mockReturnValue("")
      jest.spyOn(Utils, "getHash").mockReturnValue("hash")

      const result: RJTAnalyserResult = {
        type: "Template",
        exports: null
      }

      const cache: RJTAnalyserCache = {}

      const spy = jest.spyOn(TemplateAnalyser, 'analyzeTemplate').mockReturnValue(result)

      expect(Analyser.analyze("filePath.rjt.jsx", config, cache)).toEqual(result)
      expect(spy).toBeCalled()
      expect(cache.hash).toBe(result)
    })

    it('should use cache for non templates files', () => {
      jest.spyOn(fs, 'readFileSync').mockReturnValue("")
      jest.spyOn(Utils, "getHash").mockReturnValue("hash")

      const result: RJTAnalyserResult = {
        type: "Exports",
        exports: {
          default: { name: "s11", type: "Serializable" }
        }
      }

      const cache: RJTAnalyserCache = { hash: result }

      const spy = jest.spyOn(ExportAnalyser, 'analyzeExports')

      expect(Analyser.analyze("filePath", config, cache)).toEqual(result)
      expect(spy).not.toBeCalled()
    })

    it('should use cache for tsx templates files', () => {
      jest.spyOn(fs, 'readFileSync').mockReturnValue("")
      jest.spyOn(Utils, "getHash").mockReturnValue("hash")

      const result: RJTAnalyserResult = {
        type: "Template",
        exports: null
      }

      const cache: RJTAnalyserCache = { hash: result }

      const spy = jest.spyOn(TemplateAnalyser, 'analyzeTemplate')

      expect(Analyser.analyze("filePath.rjt.tsx", config, cache)).toEqual(result)
      expect(spy).not.toBeCalled()
    })

    it('should use cache for jsx templates files', () => {
      jest.spyOn(fs, 'readFileSync').mockReturnValue("")
      jest.spyOn(Utils, "getHash").mockReturnValue("hash")

      const result: RJTAnalyserResult = {
        type: "Template",
        exports: null
      }

      const cache: RJTAnalyserCache = { hash: result }

      const spy = jest.spyOn(TemplateAnalyser, 'analyzeTemplate')

      expect(Analyser.analyze("filePath.rjt.jsx", config, cache)).toEqual(result)
      expect(spy).not.toBeCalled()
    })
  })

  describe(Analyser.analyzeExports, () => {
    const assert = (code: string, expected: RJTAnalyserResult): void => {
      const result = Analyser.analyzeExports('filPath', code, config)

      expect(result).toEqual(expected)
    }

    it('should not detect default unknown exports', () => {
      assert(
        'export default 5;',
        {
          type: "Exports",
          exports: {}
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
          type: "Exports",
          exports: {
            default: { type: 'Serializable', name: 's1' }
          }
        }
      )

      assert(
        `
        import {Serializable as _Serializable} from 'react-json-templates'
  
        export default _Serializable("s1", () => null);
        `,
        {
          type: "Exports",
          exports: {
            default: { type: 'Serializable', name: 's1' }
          }
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
          type: "Exports",
          exports: {
            default: { type: 'Serializable', name: 's1' }
          }
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
          type: "Exports",
          exports: {
            default: { type: 'Serializable', name: 's1' }
          }
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
          type: "Exports",
          exports: {
            default: { type: 'Serializable', name: "s1" }
          }
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
          type: "Exports",
          exports: {}
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
          type: "Exports",
          exports: {}
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
          type: "Exports",
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
          type: "Exports",
          exports: {}
        }
      )

      assert(
        `    
        const n1 = () => null
  
        export { n1 }
        `,
        {
          type: "Exports",
          exports: {}
        }
      )

      assert(
        `    
        const _n1 = () => null
  
        export { _n1 as n1 }
        `,
        {
          type: "Exports",
          exports: {}
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
          type: "Exports",
          exports: {
            s1: { type: 'Serializable', name: 's1' }
          }
        }
      )

      assert(
        `
        import {Serializable} from 'react-json-templates'
      
        const s1 = Serializable("s1", () => null)
  
        export { s1 }
        `,
        {
          type: "Exports",
          exports: {
            s1: { type: 'Serializable', name: 's1' }
          }
        }
      )

      assert(
        `
        import {Serializable} from 'react-json-templates'
      
        const _s1 = Serializable("s1", () => null)
  
        export { _s1 as s1 }
        `,
        {
          type: "Exports",
          exports: {
            s1: { type: 'Serializable', name: 's1' }
          }
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
          type: "Exports",
          exports: {
            s1: { type: 'Serializable', name: 's1' }
          }
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
          type: "Exports",
          exports: {
            s1: { type: 'Serializable', name: 's1' }
          }
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
          type: "Exports",
          exports: {
            s1: { type: 'Serializable', name: 's1' }
          }
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
          type: "Exports",
          exports: {
            s1: { type: 'Serializable', name: 's1' }
          }
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
          type: "Exports",
          exports: {
            s1: { type: 'Serializable', name: "s1" }
          }
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
          type: "Exports",
          exports: {}
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
          type: "Exports",
          exports: {}
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
          type: "Exports",
          exports: {}
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
          type: "Exports",
          exports: {}
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
          type: "Exports",
          exports: {}
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
          type: "Exports",
          exports: {
            s1: { type: 'Serializable', name: 's1' },
            s2: { type: 'Serializable', name: 's1' },
            default: { type: 'Serializable', name: 's3' }
          }
        }
      )
    })

  })

  describe(Analyser.analyzeTemplate, () => {
    it("should detect valid templates", () => {

      const result = Analyser.analyzeTemplate(
        'filPath',
        `
        import {S1, S2} from "../serializable"

        const a = Math.random();

        <S1 value={a}>
          <S2 />
        </S1>
        `,
        config
      )
      expect(result).toEqual({ type: 'Template', exports: null })
    })

    it("should throw Syntax error if invalid template", () => {

      const invalidCodes = [
        `
        import {S1, S2} from "../serializable"

        const a = Math.random();
        `,
        `
        import {S1, S2} from "../serializable"

        const a = Math.random();

        <S1 value={a}>
          <S2 />
        </S1>

        const x = 5
        `,
        `
        import {S1, S2} from "../serializable"

        export const a = Math.random();

        <S1 value={a}>
          <S2 />
        </S1>
        `,
        `
        import {S1, S2} from "../serializable"

        const a = Math.random();

        export default a;
        
        <S1 value={a}>
          <S2 />
        </S1>
        `,
        `
        import {S1, S2} from "../serializable"

        const a = Math.random();

        export * from "../test";
        
        <S1 value={a}>
          <S2 />
        </S1>
        `
      ]

      invalidCodes.forEach((code) => {
        expect(() => {
          Analyser.analyzeTemplate(
            'filPath',
            code,
            config
          )
        })
          .toThrow("invalid syntax")
      })
    })
  })
})
