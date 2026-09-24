import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'circlo-theme'
const MODES = ['light', 'dark', 'system']

const mq =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null
const systemDark = ref(mq ? mq.matches : false)
const mode = ref('system')

if (mq) {
  mq.addEventListener('change', (e) => {
    systemDark.value = e.matches
  })
}

const theme = computed(() =>
  mode.value === 'system' ? (systemDark.value ? 'dark' : 'light') : mode.value,
)

function applyTheme() {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', theme.value === 'dark')
}

watch(theme, applyTheme)

function readStored() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return MODES.includes(stored) ? stored : 'system'
  } catch {
    return 'system'
  }
}

function setMode(value) {
  if (!MODES.includes(value)) return
  mode.value = value
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // ignore storage failures (private mode)
  }
  applyTheme()
}

function cycleMode() {
  setMode(MODES[(MODES.indexOf(mode.value) + 1) % MODES.length])
}

mode.value = readStored()
applyTheme()

export function useTheme() {
  return { mode, theme, setMode, cycleMode }
}
