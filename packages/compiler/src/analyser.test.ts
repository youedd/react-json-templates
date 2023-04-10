import { analyser } from './analyser'
import type { RJTAnalyserResult } from './types'

const assert = (code: string, expected: RJTAnalyserResult['exports']): void => {
  const result = analyser(code)

  expect(result.exports).toEqual(expected)
}

describe('analyser', () => {
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

      export default Serializable(() => null);
      `,
      {
        default: 'Serializable'
      }
    )

    assert(
      `
      import {Serializable as _Serializable} from 'react-json-templates'

      export default _Serializable(() => null);
      `,
      {
        default: 'Serializable'
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
        default: 'Template'
      }
    )

    assert(
      `
      import {Template as _Template} from 'react-json-templates'

      export default _Template(() => null);
      `,
      {
        default: 'Template'
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
        default: 'Template'
      }
    )

    assert(
      `
      import {Template, Serializable} from 'react-json-templates'
    
      let variable = Template(() => null)

      variable = Serializable(() => null)

      export default variable
      `,
      {
        default: 'Serializable'
      }
    )

    assert(
      `
      import {Template, Serializable} from 'react-json-templates'
    
      let variable = () => null

      variable = Serializable(() => null)
  
      export default variable
      `,
      {
        default: 'Serializable'
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
        default: 'Template'
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
        t1: 'Template'
      }
    )

    assert(
      `
      import {Template, Serializable} from 'react-json-templates'
    
      const t1 = Template(() => null)

      export { t1 }
      `,
      {
        t1: 'Template'
      }
    )

    assert(
      `
      import {Template, Serializable} from 'react-json-templates'
    
      const _t1 = Template(() => null)

      export { _t1 as t1 }
      `,
      {
        t1: 'Template'
      }
    )
  })

  it('should detect named Serializable exports', () => {
    assert(
      `
      import {Template, Serializable} from 'react-json-templates'
    
      export const s1 = Serializable(() => null)
      `,
      {
        s1: 'Serializable'
      }
    )

    assert(
      `
      import {Template, Serializable} from 'react-json-templates'
    
      const s1 = Serializable(() => null)

      export { s1 }
      `,
      {
        s1: 'Serializable'
      }
    )

    assert(
      `
      import {Template, Serializable} from 'react-json-templates'
    
      const _s1 = Serializable(() => null)

      export { _s1 as s1 }
      `,
      {
        s1: 'Serializable'
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
        t1: 'Template'
      }
    )

    assert(
      `
      import {Template, Serializable} from 'react-json-templates'
    
      let variable = Serializable(() => null)

      variable = Serializable(() => null)

      export const s1 = variable
      `,
      {
        s1: 'Serializable'
      }
    )

    assert(
      `
      import {Template, Serializable} from 'react-json-templates'
    
      let variable = () => null

      variable = Serializable(() => null)
  
      export const s1 = variable
      `,
      {
        s1: 'Serializable'
      }
    )

    assert(
      `
      import {Template, Serializable} from 'react-json-templates'
    
      let variable = () => null

      variable = Serializable(() => null)

      const s1 = variable

      export { s1 }
      `,
      {
        s1: 'Serializable'
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
        t1: 'Template'
      }
    )

    assert(
      `
      import {Template, Serializable} from 'react-json-templates'
    
      let variable = Template(() => null)

      if(cond) {
        variable = Serializable(() => null)
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

      export const s1 = Serializable(() => null)

      export const t1 = Template(()=> null)

      const n1 = 5

      export const s2 = s1

      export let n2 = Template(()=> null)

      n2 = () => null

      export default Template(()=> null)
      `,
      {
        s1: 'Serializable',
        s2: 'Serializable',
        t1: 'Template',
        default: 'Template'
      }
    )
  })
})
