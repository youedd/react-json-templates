import type { Config } from 'jest'
import baseConfig from '../../jest.config.base'

const config: Config = {
  ...baseConfig,
  displayName: 'compiler'
}

export default config
