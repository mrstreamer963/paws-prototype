export function createRng(seed: number) {
  let s = seed >>> 0
  return {
    next(): number {
      s = (s * 1664525 + 1013904223) >>> 0
      return s / 0x100000000
    },
    int(min: number, max: number): number {
      return Math.floor(this.next() * (max - min + 1)) + min
    },
  }
}

export type Rng = ReturnType<typeof createRng>
