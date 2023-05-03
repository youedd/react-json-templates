import { RJTCompilerConfig } from "../types"
import { parseString } from "../utils"
import * as Validator from "../validator"

const config: RJTCompilerConfig = {
  sourceType: 'module',
  plugins: ['jsx', 'typescript']
}


describe("validator", () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe(Validator.isValidTemplate, () => {
    it("should return true for a valid template", () => {
      const code = `
      import {Repeat} from "./Repeat"

      const x = 5;

      <Repeat count={x}>
        Test
      </Repeat>
      `
      const ast = parseString(code, config)

      expect(Validator.isValidTemplate({ ast, code, filePath: "filePath" })).toBe(true)
    })

    it("should throw Invalid syntax error if last statement is not JSX  expression", () => {
      const code = `
      import {Repeat} from "./Repeat"

      const x = 5;

      <Repeat count={x}>
        Test
      </Repeat>

      const y = ""
      `
      const ast = parseString(code, config)

      expect(() => Validator.isValidTemplate({ ast, code, filePath: "filePath" })).toThrow("invalid syntax")
    })

    it("should throw Invalid syntax error if export ExportNamedDeclaration found", () => {
      const code = `
      import {Repeat} from "./Repeat"

      export const x = 5;

      <Repeat count={x}>
        Test
      </Repeat>
      `
      const ast = parseString(code, config)

      expect(() => Validator.isValidTemplate({ ast, code, filePath: "filePath" })).toThrow("invalid syntax")
    })

    it("should throw Invalid syntax error if export ExportAllDeclaration found", () => {
      const code = `
      import {Repeat} from "./Repeat"
      export * from "./exports"

      const x = 5;

      <Repeat count={x}>
        Test
      </Repeat>
      `
      const ast = parseString(code, config)

      expect(() => Validator.isValidTemplate({ ast, code, filePath: "filePath" })).toThrow("invalid syntax")
    })

    it("should throw Invalid syntax error if export ExportDefaultDeclaration found", () => {
      const code = `
      import {Repeat} from "./Repeat"
      export * from "./exports"
      
      const x = 5;

      export default x;

      <Repeat count={x}>
        Test
      </Repeat>
      `
      const ast = parseString(code, config)

      expect(() => Validator.isValidTemplate({ ast, code, filePath: "filePath" })).toThrow("invalid syntax")
    })
  })
})