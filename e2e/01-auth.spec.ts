import { test, expect } from '@playwright/test'
import { login, CREDENTIALS } from './helpers/auth'

test.describe('Auth Flow', () => {
  test('redirects unauthenticated dashboard access to /login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('logs in with valid credentials and sees dashboard', async ({ page }) => {
    await login(page)
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByRole('heading', { name: 'Panou Principal' })).toBeVisible()
  })

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('wrong@email.ro')
    await page.getByLabel('Parol\u0103').fill('wrongpass')
    await page.getByRole('button', { name: 'Intr\u0103 \u00een cont' }).click()
    await expect(page.getByText('Email sau parol\u0103 incorect\u0103')).toBeVisible()
  })

  test('login form has Email and Parol\u0103 fields', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Parol\u0103')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Intr\u0103 \u00een cont' })).toBeVisible()
  })
})
