import { createContext, useContext, useMemo } from 'react'
import { type FIXME, type RJT_CONSTANT, type RJT_ELEMENT, type RJT_GENERIC_OPERATION, type RJT_OPERAND_TYPE } from './types'

export interface RJT_CONFIG {
  components: Record<string, FIXME>
  actions: Record<string, (...args: any[]) => void>
  constants: Record<string, unknown>
}

const context = createContext<RJT_CONFIG | null>(null)
export const RJTProvider = ({ config, children }: { config: RJT_CONFIG, children: any }): JSX.Element => {
  return (
    <context.Provider value={config}>
      {children}
    </context.Provider>
  )
}

export const useRJTConfig = (): RJT_CONFIG => {
  const config = useContext(context)
  if (config === null) {
    throw new Error('RJT is not configured, make sure to use this hook inside a RJTProvider !')
  }

  return config
}

export const Inflater = ({ sdui }: { sdui: RJT_ELEMENT }): FIXME => {
  const config = useRJTConfig()

  return useMemo(() => mapSDUI(sdui, config), [config, sdui])
}

const mapSDUI = (
  sdui: RJT_ELEMENT | RJT_CONSTANT | RJT_GENERIC_OPERATION | RJT_OPERAND_TYPE,
  config: RJT_CONFIG,
  key?: number
): FIXME => {
  if (Array.isArray(sdui)) {
    return sdui.map((item, index) => mapSDUI(item, config, index))
  }

  if (typeof sdui === 'object' && sdui !== null) {
    switch (sdui.type) {
      case '__RJT_FRAGMENT__': {
        return (
          <>
            {sdui.children.map((item, index) => mapSDUI(item, config, index))}
          </>
        )
      }
      case '__RJT_COMPONENT__': {
        const Comp = config.components[sdui.name]
        if (Comp == null) {
          throw new Error(`SDUI Component ${sdui.name} not found in config !`)
        }
        const props = mapSDUI(sdui.props as FIXME, config)
        return <Comp key={key} {...props} />
      }
      case '__RJT_ACTION__': {
        const action = config.actions[sdui.name]
        if (action == null) {
          throw new Error(`SDUI Action ${sdui.name} not found in config !`)
        }
        return () => { action(...sdui.params) }
      }
      case '__RJT_CONSTANT__': {
        const value = config.constants[sdui.name]
        return value
      }
      case '__RJT_OPERATION__': {
        const operation = sdui.operation
        switch (operation) {
          case '+': {
            const a = mapSDUI(sdui.operands[0], config) as number
            const b = mapSDUI(sdui.operands[1], config) as number
            return a + b
          }
          case '*': {
            return mapSDUI(sdui.operands[0], config) * mapSDUI(sdui.operands[1], config)
          }
          case '-': {
            return mapSDUI(sdui.operands[0], config) - mapSDUI(sdui.operands[1], config)
          }
          case '/': {
            return mapSDUI(sdui.operands[0], config) / mapSDUI(sdui.operands[1], config)
          }
          case 'pow': {
            return Math.pow(mapSDUI(sdui.operands[0], config), mapSDUI(sdui.operands[1], config))
          }
          case 'sqrt': {
            return Math.sqrt(mapSDUI(sdui.operands[0], config))
          }
          default: {
            throw new Error(`Unsupported operation type ${operation as string}`)
          }
        }
      }
      default: {
        const obj: Record<string, unknown> = {}

        for (const [key, value] of Object.entries(sdui)) {
          obj[key] = mapSDUI(value as RJT_ELEMENT, config)
        }

        return obj
      }
    }
  }

  return sdui
}
