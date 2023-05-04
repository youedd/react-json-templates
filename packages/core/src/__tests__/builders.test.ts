import * as Utils from '../builders'

describe('utils', () => {
  it('should build a component object', () => {
    expect(Utils.Component('S1', {})).toMatchSnapshot()
    expect(Utils.Component('S1', { for: 'bar' })).toMatchSnapshot()
  })

  it('should build a fragment object', () => {
    expect(Utils.Fragment([])).toMatchSnapshot()
    expect(Utils.Fragment([Utils.Component('S1', {})])).toMatchSnapshot()
  })

  it('should build an action object', () => {
    expect(Utils.Action('GO_TO', 'screen1', { foo: 'bar' })).toMatchSnapshot()
  })

  describe(Utils.Constant, () => {
    it('should build a constant number', () => {
      expect(Utils.Constant('WINDOW_WIDTH', 'number')).toMatchSnapshot()
    })

    it('should build a constant string', () => {
      expect(Utils.Constant('TRANSLATION', 'string')).toMatchSnapshot()
    })

    it('should build a constant function', () => {
      expect(Utils.Constant('HELPER', 'function')).toMatchSnapshot()
    })

    it('should build a constant array', () => {
      expect(Utils.Constant('ITEMS', 'array')).toMatchSnapshot()
    })

    it('should build a constant object', () => {
      expect(Utils.Constant('CONFIG', 'object')).toMatchSnapshot()
    })
  })

  describe(Utils.Operation, () => {
    it('should build an addition operation', () => {
      expect(Utils.Operation('+', 2, 5)).toMatchSnapshot()
    })

    it('should build a subtraction operation', () => {
      expect(Utils.Operation('-', 2, 5)).toMatchSnapshot()
    })

    it('should build a division operation', () => {
      expect(Utils.Operation('/', 2, 5)).toMatchSnapshot()
    })

    it('should build a multiplication operation', () => {
      expect(Utils.Operation('*', 2, 5)).toMatchSnapshot()
    })

    it('should build a pow operation', () => {
      expect(Utils.Operation('pow', 2, 5)).toMatchSnapshot()
    })

    it('should build a sqrt operation', () => {
      expect(Utils.Operation('sqrt', 2)).toMatchSnapshot()
    })

    it('should build an operation with constant operand', () => {
      expect(Utils.Operation('*', 2, Utils.Constant('MIN_WIDTH', 'number'))).toMatchSnapshot()
    })

    it('should build nested operations', () => {
      expect(Utils.Operation('*', Utils.Operation('sqrt', 2), Utils.Constant('MIN_WIDTH', 'number'))).toMatchSnapshot()
    })
  })
})
