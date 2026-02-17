import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'
import path from 'path'

test.describe('CSV Import', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('imports products via CSV upload', async ({ page }) => {
    await page.goto('/products/import')
    await expect(page.getByText('Import\u0103 Produse')).toBeVisible()

    const csvPath = path.resolve(__dirname, 'fixtures/products.csv')
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(csvPath)

    await expect(page.getByText('Previzualizare')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('TEST-001')).toBeVisible()

    await page.getByRole('button', { name: 'Import\u0103' }).click()

    await expect(
      page.getByText(/Import reu\u0219it|importate/).first()
    ).toBeVisible({ timeout: 15000 })
  })

  test('shows CSV uploader component', async ({ page }) => {
    await page.goto('/products/import')
    await expect(page.getByText('\u00cEncarc\u0103 fi\u0219ier CSV').first()).toBeVisible()
  })
})
