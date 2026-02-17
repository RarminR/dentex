import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'

test.describe('Client Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('navigates to Clien\u021bi and sees client list', async ({ page }) => {
    await page.getByRole('link', { name: /Clien\u021bi/ }).click()
    await expect(page).toHaveURL(/\/clients/)
  })

  test('adds a new client with discount', async ({ page }) => {
    await page.goto('/clients/new')
    await page.waitForLoadState('networkidle')

    const uniqueCompany = `Clinica E2E ${Date.now()}`

    await page.locator('input:visible').nth(0).fill(uniqueCompany)
    await page.locator('input:visible').nth(1).fill('Dr. Test E2E')
    await page.locator('input:visible').nth(2).fill('test-e2e@clinic.ro')
    await page.locator('input:visible').nth(3).fill('0712345678')
    await page.locator('input:visible').nth(4).fill('Str. Test 1')
    await page.locator('input:visible').nth(5).fill('Bucure\u0219ti')
    await page.locator('input[type="number"]').nth(0).fill('25000')
    await page.locator('input[type="number"]').nth(1).fill('30')
    await page.locator('input[type="number"]').nth(2).fill('12')

    await page.getByRole('button', { name: 'Salveaz\u0103' }).click()
    await page.waitForURL(/\/clients\/[a-z0-9-]+/, { timeout: 15000 })
    await expect(page.getByText(uniqueCompany)).toBeVisible()
  })

  test('views client detail and sees Sold Restant', async ({ page }) => {
    await page.goto('/clients')
    await page.waitForLoadState('networkidle')

    const firstClient = page.locator('table tbody tr').first().locator('a').first()
    await firstClient.click()
    await page.waitForURL(/\/clients\/[a-z0-9-]+/, { timeout: 10000 })

    await expect(page.getByText('Sold Restant')).toBeVisible({ timeout: 10000 })
  })
})
