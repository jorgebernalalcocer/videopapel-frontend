import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Desmonta lo renderizado y limpia el DOM tras cada test
afterEach(() => {
  cleanup()
})
