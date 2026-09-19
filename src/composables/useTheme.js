import { ref, watch, onMounted } from 'vue'

const STORAGE_KEY = 'circlo-theme'

const theme = ref('light')

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(value) {
  document.documentElement.classList.toggle('dark', value === 'dark')
}

export function useTheme() {
  function setTheme(value) {
    theme.value = value
    localStorage.setItem(STORAGE_KEY, value)
    applyTheme(value)
  }

  function toggleTheme() {
    setTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  watch(theme, applyTheme)

  onMounted(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    theme.value = stored || getSystemTheme()
    applyTheme(theme.value)

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', (e) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        theme.value = e.matches ? 'dark' : 'light'
        applyTheme(theme.value)
      }
    })
  })

  return { theme, setTheme, toggleTheme }
}
