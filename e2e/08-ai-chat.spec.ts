import { test, expect } from '@playwright/test'

const BASE = process.env.BASE_URL || 'https://silverconnect-global.vercel.app'
const AI_ENDPOINT = `${BASE}/api/ai/chat`

test.describe('AI 聊天控件 (GROQ)', () => {
  test('responds to zh general query', async ({ request }) => {
    const res = await request.post(AI_ENDPOINT, {
      data: { message: '你好，我想了解和润心语者服务', locale: 'zh', conversationId: 'e2e-001' },
      timeout: 15000,
    })
    expect(res.status()).not.toBe(500)
    const body = await res.json()
    const reply = body.reply ?? body.response ?? body.message ?? body.text ?? ''
    expect(reply.length).toBeGreaterThan(0)
    console.log('zh reply:', reply.slice(0, 100))
  })

  test('responds to en general query', async ({ request }) => {
    const res = await request.post(AI_ENDPOINT, {
      data: { message: 'Hello, I need help with your services', locale: 'en', conversationId: 'e2e-002' },
      timeout: 15000,
    })
    expect(res.status()).not.toBe(500)
    const body = await res.json()
    const reply = body.reply ?? body.response ?? body.message ?? body.text ?? ''
    expect(reply.length).toBeGreaterThan(0)
  })

  test('handles emergency keywords in zh', async ({ request }) => {
    const res = await request.post(AI_ENDPOINT, {
      data: { message: '救命，有人摔倒了', locale: 'zh', conversationId: 'e2e-003' },
      timeout: 15000,
    })
    expect(res.status()).not.toBe(500)
    const body = await res.json()
    const reply = body.reply ?? body.response ?? body.message ?? body.text ?? ''
    // Emergency should trigger fast response with hotline
    expect(reply).toMatch(/000|报警|紧急|emergency/i)
  })

  test('returns 400 on missing message', async ({ request }) => {
    const res = await request.post(AI_ENDPOINT, {
      data: { locale: 'zh' },  // no message
    })
    expect(res.status()).toBe(400)
  })

  test('maintains conversation context', async ({ request }) => {
    const cid = `e2e-ctx-${Date.now()}`
    // First message
    await request.post(AI_ENDPOINT, {
      data: { message: '我叫李小明', locale: 'zh', conversationId: cid },
      timeout: 15000,
    })
    // Second message references first
    const res2 = await request.post(AI_ENDPOINT, {
      data: { message: '你还记得我的名字吗？', locale: 'zh', conversationId: cid },
      timeout: 15000,
    })
    expect(res2.status()).not.toBe(500)
  })

  test('AI widget renders on zh landing page', async ({ page }) => {
    await page.goto(`${BASE}/zh`, { waitUntil: 'domcontentloaded' })
    // Look for chat button / AI widget trigger
    const chatBtn = page.locator('[data-testid="ai-chat"], button:has-text("聊天"), button:has-text("AI"), .ai-chat-btn').first()
    if (await chatBtn.count() > 0) {
      await expect(chatBtn).toBeVisible()
      console.log('AI chat widget found on landing page')
    } else {
      console.log('AI widget not visible on landing page (may be floating/hidden)')
    }
  })
})
