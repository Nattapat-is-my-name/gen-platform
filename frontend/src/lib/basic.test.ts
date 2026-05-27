import { describe, it, expect } from 'vitest'

describe('Basic Tests', () => {
  it('should pass basic math', () => {
    expect(1 + 1).toBe(2)
  })

  it('should handle string operations', () => {
    const greeting = 'Hello, World!'
    expect(greeting.length).toBe(13)
    expect(greeting.toUpperCase()).toBe('HELLO, WORLD!')
  })
})