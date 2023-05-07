import { type FIXME } from '@react-json-templates/core'
import { createContext, useContext } from 'react'

export interface RJT_CONFIG {
  components: Record<string, FIXME>
  actions: Record<string, (...args: any[]) => void>
  constants: Record<string, unknown>
}

export const RJTContext = createContext<RJT_CONFIG | null>(null)

export const RJTProvider = ({ config, children }: { config: RJT_CONFIG, children: any }): JSX.Element => {
  return (
    <RJTContext.Provider value={config}>
      {children}
    </RJTContext.Provider>
  )
}

export const useRJTConfig = (): RJT_CONFIG => {
  const config = useContext(RJTContext)
  if (config === null) {
    throw new Error('RJT is not configured, make sure to use this hook inside a RJTProvider !')
  }

  return config
}
