import { type Page, expect } from '@playwright/test'

export const CREDENTIALS = {
  email: 'admin@dentex.ro',
  password: 'admin123',
}

export async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(CREDENTIALS.email)
  await page.getByLabel('Parol\u0103').fill(CREDENTIALS.password)
  await page.getByRole('button', { name: 'Intr\u0103 \u00een cont' }).click()
  await page.waitForURL('**/dashboard', { timeout: 15000 })
  await expect(page.getByRole('heading', { name: 'Panou Principal' })).toBeVisible({ timeout: 10000 })
}
