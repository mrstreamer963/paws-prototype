import { cleanup, render, screen } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import App from './App'

describe('App', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('renders NINE LIVES CORP header', async () => {
    const raf = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation(() => 0)
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})

    render(<App />)
    expect(await screen.findByText(/NINE LIVES CORP/i)).toBeDefined()

    raf.mockRestore()
  })
})
