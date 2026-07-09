import { test, expect } from '@playwright/test'

const BASE = process.env.BASE_URL || 'https://silverconnect-global.vercel.app'

const TEST_PROVIDER = {
  fullName:       '测试心语者',
  email:          `e2e-provider-${Date.now()}@test.silverconnect.app`,
  phone:          '13800138000',
  city:           '北京',
  education:      '本科',
  major:          '心理学',
  university:     '测试大学',
  licenseType:    '心理和读证书',
  licenseNumber:  'TEST-001',
  yearsExperience: 2,
  serviceTypes:   ['ai_companion'],
  bio:            'E2E 测试账号',
  agreeTerms:     true,
  agreeBackground: true,
}

test.describe('心语者注册流程', () => {
  test('registration API accepts valid payload', async ({ request }) => {
    const res = await request.post(`${BASE}/api/xinyuzhe/registration`, {
      data: {
        name:            TEST_PROVIDER.fullName,
        email:           TEST_PROVIDER.email,
        phone:           TEST_PROVIDER.phone,
        city:            TEST_PROVIDER.city,
        education:       TEST_PROVIDER.education,
        major:           TEST_PROVIDER.major,
        university:      TEST_PROVIDER.university,
        licenseType:     TEST_PROVIDER.licenseType,
        licenseNumber:   TEST_PROVIDER.licenseNumber,
        yearsExperience: TEST_PROVIDER.yearsExperience,
        serviceTypes:    TEST_PROVIDER.serviceTypes,
        bio:             TEST_PROVIDER.bio,
        agreeTerms:      TEST_PROVIDER.agreeTerms,
        agreeBackground: TEST_PROVIDER.agreeBackground,
      }
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.refId).toBeTruthy()
    expect(body.message).toContain('审核')
    console.log('refId:', body.refId)
  })

  test('registration page renders in zh locale', async ({ page }) => {
    await page.goto(`${BASE}/zh/xinyuzhe/registration`)
    await expect(page).toHaveTitle(/和润|心语者|SilverConnect/)
    // Step 1 inputs visible
    await expect(page.locator('input[type="text"], input[type="email"]').first()).toBeVisible()
  })

  test('hub page redirects unauthenticated users', async ({ page }) => {
    await page.goto(`${BASE}/zh/xinyuzhe/hub`)
    // Should redirect to login (not 500 or show hub content)
    await expect(page).not.toHaveURL(/\/hub/)
  })

  test('booking intake API creates request', async ({ request }) => {
    const res = await request.post(`${BASE}/api/bookings`, {
      data: {
        name:    'E2E Test User',
        email:   `e2e-book-${Date.now()}@test.silverconnect.app`,
        phone:   '13800138001',
        date:    '2026-08-01',
        message: 'E2E 测试预约',
        service: 'xinyuzhe',
      }
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.ref).toMatch(/^BK-/)
    console.log('booking ref:', body.ref)
  })

  test('christian community page renders', async ({ page }) => {
    await page.goto(`${BASE}/zh/christian`)
    await expect(page.getByRole('heading', { name: /基督徒/ })).toBeVisible()
    await expect(page.locator('text=免费查经')).toBeVisible()
  })
})
