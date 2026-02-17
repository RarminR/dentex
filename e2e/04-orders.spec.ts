import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'

test.describe('Order Creation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('navigates to Comenzi and sees order list', async ({ page }) => {
    await page.getByRole('link', { name: /Comenzi/ }).click()
    await expect(page).toHaveURL(/\/orders/)
  })

  test('opens new order form and selects a client', async ({ page }) => {
    await page.goto('/orders/new')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('Selecteaz\u0103 Client')).toBeVisible()

    await page.getByText('Clinica Dr. Popescu').click()

    await expect(page.getByText('Adaug\u0103 Produse')).toBeVisible({ timeout: 10000 })
  })

  test('order list shows existing orders from seed data', async ({ page }) => {
    await page.goto('/orders')
    await page.waitForLoadState('networkidle')
    const rows = page.locator('table tbody tr')
    await expect(rows.first()).toBeVisible({ timeout: 10000 })
    const rowCount = await rows.count()
    expect(rowCount).toBeGreaterThan(0)
  })
})
