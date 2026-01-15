import { getEffectiveUser } from '@/lib/get-effective-user'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { ALL_CATEGORIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/lib/constants/budget-categories'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const EXPENSE_NAMES = EXPENSE_CATEGORIES.map(c => c.name).join('|')
const INCOME_NAMES = INCOME_CATEGORIES.map(c => c.name).join('|')

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
  }

  const effectiveUser = await getEffectiveUser()
  if (!effectiveUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (effectiveUser.isReadOnly) {
    return NextResponse.json({ error: 'Read-only access' }, { status: 403 })
  }

  const { input } = await request.json()
  if (!input || typeof input !== 'string') {
    return NextResponse.json({ error: 'Input is required' }, { status: 400 })
  }

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Parse expense/income to JSON. Return ONLY valid JSON. If no date mentioned, use ${today}. Yesterday=${yesterday}.
Expense categories: ${EXPENSE_NAMES}
Income categories: ${INCOME_NAMES}
{"type":"expense"|"income","amount":number,"category":"exact category name from list above","description":"brief","date":"${today}"}`
        },
        { role: 'user', content: input }
      ],
      temperature: 0,
      max_tokens: 100,
    })

    const content = completion.choices[0]?.message?.content?.trim()
    if (!content) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Invalid response format' }, { status: 500 })
    }

    const parsed = JSON.parse(jsonMatch[0])

    const matchedCategory = ALL_CATEGORIES.find(
      c => c.name.toLowerCase() === parsed.category?.toLowerCase() ||
           c.name.toLowerCase().includes(parsed.category?.toLowerCase()) ||
           parsed.category?.toLowerCase().includes(c.name.toLowerCase())
    )

    const finalCategory = matchedCategory?.name || (parsed.type === 'income' ? 'Other' : 'Other')

    return NextResponse.json({
      type: parsed.type || 'expense',
      amount: parsed.amount,
      category: finalCategory,
      description: parsed.description || null,
      date: parsed.date || today,
    })
  } catch (err) {
    console.error('Parse error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
