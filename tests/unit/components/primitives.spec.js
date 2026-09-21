import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppButton from '@/components/common/AppButton.vue'
import AppCard from '@/components/common/AppCard.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppTabs from '@/components/common/AppTabs.vue'
import AppConfirm from '@/components/common/AppConfirm.vue'

const teleportStub = { global: { stubs: { teleport: true } } }

describe('AppButton', () => {
  it('renders slot content and emits click', async () => {
    const wrapper = mount(AppButton, { slots: { default: 'Save' } })
    expect(wrapper.text()).toContain('Save')
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('applies variant and size classes', () => {
    const wrapper = mount(AppButton, { props: { variant: 'outline-danger', size: 'xs' } })
    expect(wrapper.classes()).toContain('border-danger-300')
    expect(wrapper.classes()).toContain('text-xs')
  })

  it('supports block and disables while loading', () => {
    const wrapper = mount(AppButton, { props: { block: true, loading: true } })
    expect(wrapper.classes()).toContain('w-full')
    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(wrapper.find('svg').exists()).toBe(true)
  })
})

describe('AppCard', () => {
  it('renders slot and merges padding', () => {
    const wrapper = mount(AppCard, { props: { padding: 'p-3' }, slots: { default: 'body' } })
    expect(wrapper.text()).toBe('body')
    expect(wrapper.classes()).toContain('p-3')
    expect(wrapper.classes()).toContain('bg-card')
  })

  it('adds hover styles when hover is set', () => {
    const wrapper = mount(AppCard, { props: { hover: true } })
    expect(wrapper.classes()).toContain('hover:shadow-md')
  })
})

describe('AppInput', () => {
  it('emits update:modelValue on input', async () => {
    const wrapper = mount(AppInput, { props: { modelValue: '' } })
    await wrapper.find('input').setValue('hello')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['hello'])
  })

  it('renders a select when as="select" with options', () => {
    const wrapper = mount(AppInput, {
      props: { as: 'select', modelValue: 'a' },
      slots: { default: '<option value="a">A</option>' },
    })
    expect(wrapper.find('select').exists()).toBe(true)
    expect(wrapper.text()).toContain('A')
  })

  it('shows label, error and trailing slot', () => {
    const wrapper = mount(AppInput, {
      props: { label: 'Email', error: 'Required', required: true },
      slots: { trailing: '<button>eye</button>' },
    })
    expect(wrapper.text()).toContain('Email')
    expect(wrapper.text()).toContain('Required')
    expect(wrapper.text()).toContain('eye')
    expect(wrapper.find('input').classes()).toContain('pr-10')
  })

  it('applies extra attributes to the control, not the wrapper', () => {
    const wrapper = mount(AppInput, { attrs: { autocomplete: 'email', 'data-x': '1' } })
    const input = wrapper.find('input')
    expect(input.attributes('autocomplete')).toBe('email')
    expect(wrapper.attributes('data-x')).toBeUndefined()
  })
})

describe('AppTabs', () => {
  it('renders tabs and emits update:modelValue', async () => {
    const wrapper = mount(AppTabs, {
      props: {
        modelValue: 'a',
        tabs: [
          { label: 'Alpha', value: 'a' },
          { label: 'Beta', value: 'b', badge: 3 },
        ],
      },
    })
    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(2)
    expect(buttons[1].text()).toContain('3')
    await buttons[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['b'])
    expect(buttons[0].attributes('aria-selected')).toBe('true')
  })

  it('accepts plain string tabs', () => {
    const wrapper = mount(AppTabs, { props: { modelValue: 'x', tabs: ['x', 'y'] } })
    expect(wrapper.findAll('button')).toHaveLength(2)
  })
})

describe('AppConfirm', () => {
  it('renders message and emits confirm/cancel', async () => {
    const wrapper = mount(AppConfirm, {
      props: { open: true, title: 'Delete', message: 'Are you sure?' },
      ...teleportStub,
    })
    expect(wrapper.text()).toContain('Delete')
    expect(wrapper.text()).toContain('Are you sure?')
    const cancelBtn = wrapper.findAll('button').find((b) => b.text() === 'Cancel')
    const confirmBtn = wrapper.findAll('button').find((b) => b.text() === 'Confirm')
    await cancelBtn.trigger('click')
    await confirmBtn.trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(wrapper.emitted('confirm')).toHaveLength(1)
  })
})
