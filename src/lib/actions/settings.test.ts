import { describe, it, expect, vi, beforeEach } from 'vitest'
import { validateWeights, DEFAULT_ENGINE_CONFIG } from '@/lib/engine/defaults'
import type { EngineConfig } from '@/lib/engine/types'

describe('validateWeights', () => {
  it('accepts weights that sum to exactly 1.0', () => {
    expect(validateWeights({
      clientFrequency: 0.30,
      globalPopularity: 0.20,
      margin: 0.25,
      recency: 0.15,
      slowMoverPush: 0.10,
    })).toBe(true)
  })

  it('accepts weights within ±0.001 tolerance', () => {
    expect(validateWeights({
      clientFrequency: 0.30,
      globalPopularity: 0.20,
      margin: 0.25,
      recency: 0.15,
      slowMoverPush: 0.1005, // sum = 1.0005
    })).toBe(true)
  })

  it('rejects weights that sum to less than 0.999', () => {
    expect(validateWeights({
      clientFrequency: 0.20,
      globalPopularity: 0.20,
      margin: 0.20,
      recency: 0.10,
      slowMoverPush: 0.10, // sum = 0.80
    })).toBe(false)
  })

  it('rejects weights that sum to more than 1.001', () => {
    expect(validateWeights({
      clientFrequency: 0.30,
      globalPopularity: 0.30,
      margin: 0.25,
      recency: 0.15,
      slowMoverPush: 0.10, // sum = 1.10
    })).toBe(false)
  })
})

const mockPrisma = {
  setting: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'user-1', email: 'admin@test.com', name: 'Admin' } }),
}))

const mockCompare = vi.fn()
const mockHash = vi.fn()

vi.mock('bcryptjs', () => ({
  compare: (...args: unknown[]) => mockCompare(...args),
  hash: (...args: unknown[]) => mockHash(...args),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

const { getEngineConfig, updateEngineConfig, changePassword } = await import('./settings')

describe('getEngineConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns DEFAULT_ENGINE_CONFIG when no setting exists', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue(null)

    const result = await getEngineConfig()

    expect(result).toEqual(DEFAULT_ENGINE_CONFIG)
    expect(mockPrisma.setting.findUnique).toHaveBeenCalledWith({
      where: { key: 'engineConfig' },
    })
  })

  it('returns parsed config from database when setting exists', async () => {
    const customConfig: EngineConfig = {
      ...DEFAULT_ENGINE_CONFIG,
      weights: { ...DEFAULT_ENGINE_CONFIG.weights, clientFrequency: 0.40, slowMoverPush: 0.00 },
    }
    mockPrisma.setting.findUnique.mockResolvedValue({
      id: 'setting-1',
      key: 'engineConfig',
      value: JSON.stringify(customConfig),
      updatedAt: new Date(),
    })

    const result = await getEngineConfig()

    expect(result.weights.clientFrequency).toBe(0.40)
    expect(result.weights.slowMoverPush).toBe(0.00)
  })
})

describe('updateEngineConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('saves valid config to database', async () => {
    mockPrisma.setting.upsert.mockResolvedValue({ id: 'setting-1' })

    const config: EngineConfig = { ...DEFAULT_ENGINE_CONFIG }

    const result = await updateEngineConfig(config)

    expect(result).toEqual({ success: true })
    expect(mockPrisma.setting.upsert).toHaveBeenCalledWith({
      where: { key: 'engineConfig' },
      update: { value: JSON.stringify(config) },
      create: { key: 'engineConfig', value: JSON.stringify(config) },
    })
  })

  it('rejects config with weights not summing to 1.0', async () => {
    const config: EngineConfig = {
      ...DEFAULT_ENGINE_CONFIG,
      weights: {
        clientFrequency: 0.50,
        globalPopularity: 0.50,
        margin: 0.25,
        recency: 0.15,
        slowMoverPush: 0.10, // sum = 1.50
      },
    }

    const result = await updateEngineConfig(config)

    expect(result).toEqual({ success: false, error: 'Ponderile trebuie să totalizeze 1,00' })
    expect(mockPrisma.setting.upsert).not.toHaveBeenCalled()
  })
})

describe('changePassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('changes password when current password is correct', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'admin@test.com',
      passwordHash: 'hashed-old',
    })
    mockCompare.mockResolvedValue(true)
    mockHash.mockResolvedValue('hashed-new')
    mockPrisma.user.update.mockResolvedValue({})

    const result = await changePassword('old-password', 'new-password-123')

    expect(result).toEqual({ success: true })
    expect(mockCompare).toHaveBeenCalledWith('old-password', 'hashed-old')
    expect(mockHash).toHaveBeenCalledWith('new-password-123', 10)
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { passwordHash: 'hashed-new' },
    })
  })

  it('rejects when current password is wrong', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'admin@test.com',
      passwordHash: 'hashed-old',
    })
    mockCompare.mockResolvedValue(false)

    const result = await changePassword('wrong-password', 'new-password-123')

    expect(result).toEqual({ success: false, error: 'Parola curentă este incorectă' })
    expect(mockPrisma.user.update).not.toHaveBeenCalled()
  })

  it('rejects when new password is too short', async () => {
    const result = await changePassword('old-password', 'short')

    expect(result).toEqual({ success: false, error: 'Parola nouă trebuie să aibă cel puțin 6 caractere' })
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled()
  })
})
