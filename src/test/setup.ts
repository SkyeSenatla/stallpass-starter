import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Runs before every test file: toBeInTheDocument(), toHaveAccessibleName()
// and friends, and an empty page for each test.
afterEach(() => cleanup())
