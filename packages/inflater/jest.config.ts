import type { Config } from 'jest'
import baseConfig from '../../jest.config.base'

const config: Config = {
  ...baseConfig,
  displayName: 'inflater'
}

export default config
