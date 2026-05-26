import { describe, it, expect } from 'vitest'
import { formatSimTime, formatDay, TIME_SCALE, SIM_DAY_MS } from './format'

describe('TIME_SCALE', () => {
  it('равен 60 — 1 реальная секунда = 60 виртуальных', () => {
    expect(TIME_SCALE).toBe(60)
  })
})

describe('SIM_DAY_MS', () => {
  it('1440000 мс — виртуальные сутки с учётом timeScale', () => {
    expect(SIM_DAY_MS).toBe(1440000)
  })
})

describe('formatSimTime', () => {
  it('0 мс → 00:00:00', () => {
    expect(formatSimTime(0)).toBe('00:00:00')
  })

  it('1 мс → 00:00:00 (60 мс вирт < 1 сек)', () => {
    expect(formatSimTime(1)).toBe('00:00:00')
  })

  it('1000 мс → 00:01:00 (1 сек × 60 = 60 сек)', () => {
    expect(formatSimTime(1000)).toBe('00:01:00')
  })

  it('1001 мс → 00:01:00 (floor отбрасывает дробную секунду)', () => {
    expect(formatSimTime(1001)).toBe('00:01:00')
  })

  it('1000000 мс → 04:26:40 (1000 сек × 60 = 60000 сек = 16ч40м)', () => {
    expect(formatSimTime(1000000)).toBe('16:40:00')
  })

  it('3600000 мс → 12:00:00 (3600 сек × 60 = 216000 сек = 60ч ≡ 12ч)', () => {
    expect(formatSimTime(3600000)).toBe('12:00:00')
  })

  it('86399000 мс → 23:59:00 (последняя минута суток)', () => {
    expect(formatSimTime(86399000)).toBe('23:59:00')
  })

  it('86400000 мс → 00:00:00 (полные виртуальные сутки)', () => {
    expect(formatSimTime(86400000)).toBe('00:00:00')
  })

  it('3661000 мс → 13:01:00 (61ч01м ≡ 13:01:00)', () => {
    expect(formatSimTime(3661000)).toBe('13:01:00')
  })

  it('90061000 мс → 13:01:00 (1501ч01м ≡ 13:01:00)', () => {
    expect(formatSimTime(90061000)).toBe('13:01:00')
  })
})

describe('formatDay', () => {
  it('0 мс → день 1', () => {
    expect(formatDay(0)).toBe(1)
  })

  it('720000 мс (половина вирт суток) → день 1', () => {
    expect(formatDay(720000)).toBe(1)
  })

  it('1439999 мс (последний мс первых суток) → день 1', () => {
    expect(formatDay(1439999)).toBe(1)
  })

  it('1440000 мс (начало 2-х суток) → день 2', () => {
    expect(formatDay(1440000)).toBe(2)
  })

  it('2880000 мс (начало 3-х суток) → день 3', () => {
    expect(formatDay(2880000)).toBe(3)
  })
})
