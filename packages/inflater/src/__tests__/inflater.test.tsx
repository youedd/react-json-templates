/**
 * @jest-environment ../../../../node_modules/jest-environment-jsdom
 */

import { render } from '@testing-library/react'
import { Serializable } from '@react-json-templates/core'
import { RJTProvider, type RJT_CONFIG } from '../RJTProvider'
import { Inflater, mapData } from '../Inflater'

const config: RJT_CONFIG = {
  components: {
    Simple: Serializable('Simple', (props: any) => <button {...props} > Simple </button>),
    Complex: Serializable('Complex', (props: any) => <div {...props} />)
  },
  actions: {
    handlePress: jest.fn(),
    renderAction: jest.fn()
  },
  constants: {
    windowWidth: 900,
    windowHeight: 1600
  }
}

describe('Inflater', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('inflates simple Component', () => {
    const { asFragment } = render(
      <RJTProvider config={config} >
        <Inflater
          data={{
            type: '__RJT_COMPONENT__',
            name: 'Simple',
            props: {
              testid: 'test'
            }
          }}
        />
      </RJTProvider>
    )
    expect(asFragment()).toMatchSnapshot()
  })

  it('inflates complex Component', () => {
    const { asFragment } = render(
      <RJTProvider config={config} >
        <Inflater
          data={{
            type: '__RJT_COMPONENT__',
            name: 'Complex',
            props: {
              testid: 'test',
              children: [
                {
                  type: '__RJT_COMPONENT__',
                  name: 'Simple',
                  props: {}
                },
                {
                  type: '__RJT_COMPONENT__',
                  name: 'Simple',
                  props: {}
                }
              ]
            }
          }}
        />
      </RJTProvider>
    )
    expect(asFragment()).toMatchSnapshot()
  })

  it('inflates fragment', () => {
    const { asFragment } = render(
      <RJTProvider config={config} >
        <Inflater
          data={
            {
              type: '__RJT_COMPONENT__',
              name: 'Complex',
              props: {
                children: [
                  {
                    type: '__RJT_COMPONENT__',
                    name: 'Simple',
                    props: {}
                  },
                  {
                    type: '__RJT_FRAGMENT__',
                    children: [
                      {
                        type: '__RJT_COMPONENT__',
                        name: 'Simple',
                        props: {}
                      },
                      {
                        type: '__RJT_COMPONENT__',
                        name: 'Simple',
                        props: {}
                      }
                    ]
                  }
                ]
              }
            }
          }
        />
      </RJTProvider>
    )
    expect(asFragment()).toMatchSnapshot()
  })

  it('inflates props Action', () => {
    const element = mapData(
      {
        type: '__RJT_COMPONENT__',
        name: 'Simple',
        props: {
          onClick: {
            type: '__RJT_ACTION__',
            name: 'handlePress',
            params: ['arg1']
          }
        }
      },
      config
    )
    element.props.onClick()
    expect(config.actions.handlePress).toBeCalledWith('arg1')
    const { asFragment } = render(element)
    expect(asFragment()).toMatchSnapshot()
  })

  it('inflates constants', () => {
    const element = mapData(
      {
        type: '__RJT_COMPONENT__',
        name: 'Complex',
        props: {
          height: {
            type: '__RJT_CONSTANT__',
            name: 'windowHeight'
          },
          children: {
            type: '__RJT_CONSTANT__',
            name: 'windowWidth'
          }
        }
      },
      config
    )
    const { asFragment } = render(element)
    expect(asFragment()).toMatchSnapshot()
  })

  it('inflates front side calculation', () => {
    const element = mapData(
      {
        type: '__RJT_COMPONENT__',
        name: 'Simple',
        props: {
          height: {
            type: '__RJT_OPERATION__',
            operation: '+',
            operands: [
              {
                type: '__RJT_CONSTANT__',
                name: 'windowHeight'
              },
              20
            ]
          }
        }
      },
      config
    )
    const { asFragment } = render(element)

    expect(element.props.height).toBe(config.constants.windowHeight as number + 20)
    expect(asFragment()).toMatchSnapshot()
  })
})
