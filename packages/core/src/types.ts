
export type FIXME = any

export interface RJT_COMPONENT {
  type: '__RJT_COMPONENT__'
  name: string
  props: RJT_PROPS
}

export interface RJT_FRAGMENT {
  type: '__RJT_FRAGMENT__'
  children: RJT_ELEMENT[]
}

export interface RJT_ACTION {
  type: '__RJT_ACTION__'
  name: string
  params: RJT_DATA[]
}
export type RJT_CONSTANT_TYPE =
  | 'number'
  | 'string'
  | 'function'
  | 'object'
  | 'array'

export interface RJT_CONSTANT<T extends RJT_CONSTANT_TYPE = RJT_CONSTANT_TYPE> {
  type: '__RJT_CONSTANT__'
  name: string
  kind: T
}

export type RJT_ELEMENT =
  | undefined
  | null
  | string
  | RJT_COMPONENT
  | RJT_FRAGMENT
  | RJT_ACTION
  | RJT_ELEMENT[]

export type RJT_OPERAND_TYPE = number | RJT_CONSTANT<'number'> | RJT_GENERIC_OPERATION

export type RJT_GENERIC_OPERATION = { type: '__RJT_OPERATION__' } & ({
  operation: '+'
  operands: [RJT_OPERAND_TYPE, RJT_OPERAND_TYPE]
} | {
  operation: '*'
  operands: [RJT_OPERAND_TYPE, RJT_OPERAND_TYPE]
} | {
  operation: '-'
  operands: [RJT_OPERAND_TYPE, RJT_OPERAND_TYPE]
} | {
  operation: '/'
  operands: [RJT_OPERAND_TYPE, RJT_OPERAND_TYPE]
} | {
  operation: 'sqrt'
  operands: [RJT_OPERAND_TYPE]
} | {
  operation: 'pow'
  operands: [RJT_OPERAND_TYPE, RJT_OPERAND_TYPE]
})
export type RJT_OPERATION_TYPE = RJT_GENERIC_OPERATION['operation']

type FindByOperation<Union, Type> = Union extends { operation: Type } ? Union : never
export type RJT_OPERATION<Type extends RJT_OPERATION_TYPE> = FindByOperation<RJT_GENERIC_OPERATION, Type>

export type RJT_DATA =
  | null
  | undefined
  | string
  | number
  | boolean
  | { [x: string]: RJT_DATA }
  | RJT_DATA[]
export type RJT_PROPS = Record<string, RJT_DATA>
