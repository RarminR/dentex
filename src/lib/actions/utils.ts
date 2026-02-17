'use server'

import { auth } from '@/lib/auth'
import { z } from 'zod'
import type { Session } from 'next-auth'

export interface ActionError {
  success: false
  error: string
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export async function withAuth<T>(
  action: (session: Session) => Promise<T>
): Promise<T> {
  const session = await auth()
  if (!session?.user) {
    throw new Error('Neautorizat. Vă rugăm să vă autentificați.')
  }
  return action(session)
}

export async function withValidation<TSchema extends z.ZodTypeAny, TResult>(
  schema: TSchema,
  data: unknown,
  action: (validated: z.infer<TSchema>) => Promise<TResult>
): Promise<TResult | ActionError> {
  const result = schema.safeParse(data)
  if (!result.success) {
    const firstError = result.error.issues[0]?.message ?? 'Date invalide'
    return { success: false, error: firstError }
  }
  return action(result.data)
}

export async function paginatedQuery<T>(
  queryFn: (skip: number, take: number) => Promise<T[]>,
  countFn: () => Promise<number>,
  page: number,
  pageSize: number
): Promise<PaginatedResult<T>> {
  const skip = (page - 1) * pageSize
  const [data, total] = await Promise.all([queryFn(skip, pageSize), countFn()])
  return { data, total, page, pageSize }
}

export async function handleActionError(error: unknown): Promise<ActionError> {
  if (error instanceof Error) {
    if (error.message.includes('Neautorizat')) {
      return { success: false, error: 'Neautorizat. Vă rugăm să vă autentificați.' }
    }
    if (error.message.includes('Unique constraint')) {
      return { success: false, error: 'Înregistrarea există deja.' }
    }
    if (error.message.includes('Record to update not found')) {
      return { success: false, error: 'Înregistrarea nu a fost găsită.' }
    }
    return { success: false, error: error.message }
  }
  return { success: false, error: 'A apărut o eroare neașteptată.' }
}
