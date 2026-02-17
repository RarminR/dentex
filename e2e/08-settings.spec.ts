import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('navigates to Set\u0103ri and sees config form', async ({ page }) => {
    await page.getByRole('link', { name: /Set\u0103ri/ }).click()
    await expect(page).toHaveURL(/\/settings/)
    await expect(page.getByText('Configurare Motor Oferte')).toBeVisible()
    await expect(page.getByText('Total Ponderi')).toBeVisible()
  })

  test('changing a weight value updates Total Ponderi live', async ({ page }) => {
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')

    const weightInputs = page.locator('input[type="number"][step="0.01"]')
    await expect(weightInputs.first()).toBeVisible({ timeout: 5000 })

    await weightInputs.first().fill('0.50')
    await expect(page.getByText(/Total Ponderi/)).toBeVisible()
  })

  test('saves engine config and verifies persistence', async ({ page }) => {
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')

    const minBundleInput = page.locator('input[type="number"][min="1"][max="50"]')
    await expect(minBundleInput).toBeVisible({ timeout: 5000 })
    await minBundleInput.fill('7')

    const saveButtons = page.getByRole('button', { name: 'Salveaz\u0103' })
    await saveButtons.last().click()

    await expect(page.getByText(/salvat\u0103|succes/i).first()).toBeVisible({ timeout: 10000 })

    await page.reload()
    await page.waitForLoadState('networkidle')

    const savedValue = await minBundleInput.inputValue()
    expect(savedValue).toBe('7')
  })
})
