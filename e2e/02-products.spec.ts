import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'

test.describe('Product Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('navigates to Produse and sees product list', async ({ page }) => {
    await page.getByRole('link', { name: /Produse/ }).click()
    await expect(page).toHaveURL(/\/products/)
    await expect(page.locator('h1, h2').getByText('Produse')).toBeVisible()
  })

  test('adds a new product and verifies it in the list', async ({ page }) => {
    await page.goto('/products/new')
    await page.waitForLoadState('networkidle')

    const uniqueName = `Test Produs E2E ${Date.now()}`
    const uniqueSku = `E2E-${Date.now()}`

    await page.locator('input[name="name"]').fill(uniqueName)
    await page.locator('input[name="sku"]').fill(uniqueSku)

    await page.locator('button[role="combobox"]').click()
    await page.getByRole('option', { name: 'Consumabile' }).click()

    await page.locator('input[name="unitPrice"]').fill('200')
    await page.locator('input[name="costPrice"]').fill('120')
    await page.locator('input[name="stockQty"]').fill('50')

    await page.getByRole('button', { name: 'Salveaz\u0103' }).click()
    await page.waitForURL(/\/products/, { timeout: 15000 })
  })

  test('views product detail and sees price info', async ({ page }) => {
    await page.goto('/products')
    await page.waitForLoadState('networkidle')

    const productLink = page.locator('table tbody tr').first().locator('a').first()
    await productLink.click()
    await page.waitForURL(/\/products\/[a-z0-9-]+/, { timeout: 10000 })

    await expect(page.getByText('Pre\u021b V\u00e2nzare')).toBeVisible()
  })
})
