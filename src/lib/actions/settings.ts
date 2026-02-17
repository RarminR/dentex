'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { compare, hash } from 'bcryptjs'
import { DEFAULT_ENGINE_CONFIG, validateWeights } from '@/lib/engine/defaults'
import type { EngineConfig } from '@/lib/engine/types'
import { revalidatePath } from 'next/cache'

export async function getEngineConfig(): Promise<EngineConfig> {
  const setting = await prisma.setting.findUnique({
    where: { key: 'engineConfig' },
  })

  if (!setting) return DEFAULT_ENGINE_CONFIG

  return JSON.parse(setting.value) as EngineConfig
}

export async function updateEngineConfig(
  config: EngineConfig
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: 'Neautorizat' }
  }

  if (!validateWeights({ ...config.weights })) {
    return { success: false, error: 'Ponderile trebuie s\u0103 totalizeze 1,00' }
  }

  await prisma.setting.upsert({
    where: { key: 'engineConfig' },
    update: { value: JSON.stringify(config) },
    create: { key: 'engineConfig', value: JSON.stringify(config) },
  })

  revalidatePath('/settings')
  return { success: true }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: true } | { success: false; error: string }> {
  if (newPassword.length < 6) {
    return { success: false, error: 'Parola nou\u0103 trebuie s\u0103 aib\u0103 cel pu\u021bin 6 caractere' }
  }

  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Neautorizat' }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user) {
    return { success: false, error: 'Utilizator neg\u0103sit' }
  }

  const passwordMatch = await compare(currentPassword, user.passwordHash)
  if (!passwordMatch) {
    return { success: false, error: 'Parola curent\u0103 este incorect\u0103' }
  }

  const newHash = await hash(newPassword, 10)
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  })

  return { success: true }
}
