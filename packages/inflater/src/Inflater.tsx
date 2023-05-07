import { Fragment, useMemo } from 'react'
import type { FIXME, RJT_CONSTANT, RJT_ELEMENT, RJT_GENERIC_OPERATION, RJT_OPERAND_TYPE } from '@react-json-templates/core'
import { type RJT_CONFIG, useRJTConfig } from './RJTProvider'

export const Inflater = ({ data }: { data: RJT_ELEMENT }): FIXME => {
  const config = useRJTConfig()

  return useMemo(() => mapData(data, config), [config, data])
}

export const mapData = (
  data: RJT_ELEMENT | RJT_CONSTANT | RJT_GENERIC_OPERATION | RJT_OPERAND_TYPE,
  config: RJT_CONFIG,
  key?: number
): FIXME => {
  if (Array.isArray(data)) {
    return data.map((item, index) => mapData(item, config, index))
  }

  if (typeof data === 'object' && data !== null) {
    switch (data.type) {
      case '__RJT_FRAGMENT__': {
        return (
          <Fragment key={key}>
            {mapData(data.children, config, key)}
          </Fragment>
        )
      }
      case '__RJT_COMPONENT__': {
        const Comp = config.components[data.name]
        if (Comp == null) {
          throw new Error(`Component ${data.name} not found in config !`)
        }
        const props = mapData(data.props as FIXME, config)
        return <Comp key={key} {...props} />
      }
      case '__RJT_ACTION__': {
        const action = config.actions[data.name]
        if (action == null) {
          throw new Error(`Action ${data.name} not found in config !`)
        }
        return () => { action(...data.params) }
      }
      case '__RJT_CONSTANT__': {
        const value = config.constants[data.name]
        return value
      }
      case '__RJT_OPERATION__': {
        const operation = data.operation
        switch (operation) {
          case '+': {
            const a = mapData(data.operands[0], config) as number
            const b = mapData(data.operands[1], config) as number
            return a + b
          }
          case '*': {
            return mapData(data.operands[0], config) * mapData(data.operands[1], config)
          }
          case '-': {
            return mapData(data.operands[0], config) - mapData(data.operands[1], config)
          }
          case '/': {
            return mapData(data.operands[0], config) / mapData(data.operands[1], config)
          }
          case 'pow': {
            return Math.pow(mapData(data.operands[0], config), mapData(data.operands[1], config))
          }
          case 'sqrt': {
            return Math.sqrt(mapData(data.operands[0], config))
          }
          default: {
            throw new Error(`Unsupported operation${operation as string}`)
          }
        }
      }
      default: {
        const obj: Record<string, unknown> = {}

        for (const [key, value] of Object.entries(data)) {
          obj[key] = mapData(value as RJT_ELEMENT, config)
        }

        return obj
      }
    }
  }

  return data
}
