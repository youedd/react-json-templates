import { AnalyserResult, analyser } from './analyser'



const assert = (code: string, expected: AnalyserResult['exports']) => {
  const result = analyser(code)

  expect(result.exports).toEqual(expected)
}


describe("analyser", () => {

  it('should detect default unknown exports', () => {
    assert(
      `export default 5;`,
      {
        default: 'Unknown'
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

  it('should detect default export variables type', () => {
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

  it('should return unknown for default export variables with conditional type', () => {

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
        default: 'Unknown'
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
        default: 'Unknown'
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
        default: 'Unknown'
      }
    )
  })



  // const code = `
  // import {Template, Serializable} from 'react-json-templates'

  // export const s1 = Serializable(() => null)

  // export const t1 = Template(()=> null)

  // const n1 = 5

  // export const s2 = s1

  // export const n2 = Serializable

  // export const s3=  n2(() => null)

  // export default Template(()=> null)
  // `

  // const result = analyser(code)

  // expect(result.exports).toEqual({
  //   s1: 'Serializable',
  //   s2: 'Serializable',
  //   s3: 'Serializable',
  //   t1: 'Template',
  //   n1: 'Unknown',
  //   n2: 'Unknown',
  //   default: 'Template'
  // })
})