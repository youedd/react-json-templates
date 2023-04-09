import { analyser } from './analyser'

describe("analyser", () => {

  it('should detect default unknown exports', () => {
    const code = `
    import {Template, Serializable} from 'react-json-templates'

    export default 5;
    `
    const result = analyser(code)

    expect(result.exports).toEqual({
      default: 'Unknown'
    })
  })

  it('should detect default Serializable exports', () => {
    const code = `
    import {Template, Serializable} from 'react-json-templates'

    export default Serializable(() => null);
    `
    const result = analyser(code)

    expect(result.exports).toEqual({
      default: 'Serializable'
    })
  })

  it('should detect default Template exports', () => {
    const code = `
    import {Template, Serializable} from 'react-json-templates'

    export default Template(() => null);
    `
    const result = analyser(code)

    expect(result.exports).toEqual({
      default: 'Template'
    })
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