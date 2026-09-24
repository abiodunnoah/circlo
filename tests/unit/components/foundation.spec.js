import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppPageHeader from '@/components/common/AppPageHeader.vue'
import AppMoney from '@/components/common/AppMoney.vue'
import AppAvatarGroup from '@/components/common/AppAvatarGroup.vue'
import AppProgressRing from '@/components/common/AppProgressRing.vue'
import AppDropdown from '@/components/common/AppDropdown.vue'
import AppTabs from '@/components/common/AppTabs.vue'
import AppErrorState from '@/components/common/AppErrorState.vue'
import AppSelect from '@/components/common/AppSelect.vue'

describe('AppPageHeader', () => {
  it('renders title, subtitle and actions slot', () => {
    const wrapper = mount(AppPageHeader, {
      props: { title: 'Dashboard', subtitle: 'Hello' },
      slots: { actions: '<button>Go</button>' },
    })
    expect(wrapper.text()).toContain('Dashboard')
    expect(wrapper.text()).toContain('Hello')
    expect(wrapper.find('button').text()).toBe('Go')
  })
})

describe('AppMoney', () => {
  it('formats naira with tabular nums', () => {
    const wrapper = mount(AppMoney, { props: { value: 20000 } })
    expect(wrapper.text()).toContain('₦')
    expect(wrapper.text()).toContain('20,000')
    expect(wrapper.classes()).toContain('tabular-nums')
  })

  it('defaults to 0 for invalid input', () => {
    const wrapper = mount(AppMoney, { props: { value: undefined } })
    expect(wrapper.text()).toContain('₦0')
  })
})

describe('AppAvatarGroup', () => {
  it('shows max avatars and a +N overflow', () => {
    const members = Array.from({ length: 6 }, (_, i) => ({ id: String(i), name: `M${i}` }))
    const wrapper = mount(AppAvatarGroup, { props: { members, max: 4 } })
    expect(wrapper.text()).toContain('+2')
  })
})

describe('AppProgressRing', () => {
  it('exposes progressbar aria attributes', () => {
    const wrapper = mount(AppProgressRing, { props: { value: 7, max: 10 } })
    const svg = wrapper.find('[role="progressbar"]')
    expect(svg.attributes('aria-valuenow')).toBe('7')
    expect(svg.attributes('aria-valuemax')).toBe('10')
  })
})

describe('AppDropdown', () => {
  it('toggles menu on trigger click', async () => {
    const wrapper = mount(AppDropdown, {
      slots: {
        trigger: '<button class="trigger">Open</button>',
        default: '<div class="item">Item</div>',
      },
    })
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    await wrapper.find('.trigger').trigger('click')
    expect(wrapper.find('[role="menu"]').exists()).toBe(true)
  })
})

describe('AppTabs variants', () => {
  it('renders underline variant', () => {
    const wrapper = mount(AppTabs, {
      props: { modelValue: 'a', variant: 'underline', tabs: ['a', 'b'] },
    })
    expect(wrapper.find('[role="tablist"]').classes()).toContain('border-b')
  })
})

describe('AppErrorState', () => {
  it('emits retry', async () => {
    const wrapper = mount(AppErrorState, { props: { message: 'Broke' } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })
})

describe('AppSelect', () => {
  it('renders a select with options', () => {
    const wrapper = mount(AppSelect, {
      props: { modelValue: 'a', label: 'Cycle' },
      slots: { default: '<option value="a">A</option>' },
    })
    expect(wrapper.find('select').exists()).toBe(true)
    expect(wrapper.text()).toContain('Cycle')
  })
})
