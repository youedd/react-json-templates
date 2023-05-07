import type { FIXME, RJT_CONSTANT_TYPE, RJT_ACTION, RJT_CONSTANT, RJT_OPERATION, RJT_OPERATION_TYPE, RJT_COMPONENT, RJT_PROPS, RJT_ELEMENT, RJT_FRAGMENT } from './types'

export const Serializable = <T>(_name: string, Comp: T): T => Comp

export const Component = (name: string, props: RJT_PROPS): RJT_COMPONENT => {
  return {
    type: '__RJT_COMPONENT__',
    name,
    props
  }
}

export const Fragment = (children: RJT_ELEMENT[]): RJT_FRAGMENT => {
  return {
    type: '__RJT_FRAGMENT__',
    children
  }
}

export const Action = (name: string, ...params: unknown[]): RJT_ACTION => {
  return {
    type: '__RJT_ACTION__',
    name,
    params
  }
}

export const Constant = <T extends RJT_CONSTANT_TYPE>(name: string, type: T): RJT_CONSTANT<T> => {
  return {
    type: '__RJT_CONSTANT__',
    name,
    kind: type
  }
}

export const Operation = <T extends RJT_OPERATION_TYPE>(
  operation: T,
  ...operands: RJT_OPERATION<T>['operands']
): FIXME => {
  return {
    type: '__RJT_OPERATION__',
    operation,
    operands
  }
}
