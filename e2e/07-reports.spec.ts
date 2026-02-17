import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'

test.describe('Reports', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('navigates to Rapoarte hub and sees report links', async ({ page }) => {
    await page.getByRole('link', { name: /Rapoarte/ }).click()
    await expect(page).toHaveURL(/\/reports/)
    await expect(page.getByText('Profitabilitate Clien\u021bi')).toBeVisible()
    await expect(page.getByText('Performan\u021b\u0103 Produse')).toBeVisible()
  })

  test('views Profitabilitate Clien\u021bi report with table rows', async ({ page }) => {
    await page.goto('/reports/profitability')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('Profitabilitate Clien\u021bi')).toBeVisible()

    const rows = page.locator('table tbody tr')
    await expect(rows.first()).toBeVisible({ timeout: 10000 })
    const rowCount = await rows.count()
    expect(rowCount).toBeGreaterThan(0)
  })

  test('views Performan\u021b\u0103 Produse report with tabs', async ({ page }) => {
    await page.goto('/reports/products')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('Performan\u021b\u0103 Produse')).toBeVisible()

    await expect(page.getByText('Top V\u00e2nz\u0103ri')).toBeVisible()
    await expect(page.getByText('Mi\u0219care Lent\u0103')).toBeVisible()

    const rows = page.locator('table tbody tr')
    await expect(rows.first()).toBeVisible({ timeout: 10000 })

    await page.getByText('Mi\u0219care Lent\u0103').click()
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 10000 })
  })
})
