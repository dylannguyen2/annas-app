import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { manageSubscriptionStatusChange, handleInvoice } from '@/lib/stripe/subscription'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
])

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const sig = headersList.get('stripe-signature')

  let event: Stripe.Event

  try {
    if (!sig || !webhookSecret) {
      console.error('Missing signature or webhook secret')
      return new NextResponse('Webhook secret not found.', { status: 400 })
    }

    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret)
    console.log(`Webhook received: ${event.type}`)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Webhook signature verification failed: ${message}`)
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 })
  }

  if (relevantEvents.has(event.type)) {
    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          const subscription = event.data.object as Stripe.Subscription
          await manageSubscriptionStatusChange(
            subscription.id,
            subscription.customer as string,
            event.type === 'customer.subscription.created'
          )
          break

        case 'checkout.session.completed':
          const checkoutSession = event.data.object as Stripe.Checkout.Session
          if (checkoutSession.mode === 'subscription' && checkoutSession.subscription) {
            await manageSubscriptionStatusChange(
              checkoutSession.subscription as string,
              checkoutSession.customer as string,
              true
            )
          }
          break

        case 'invoice.payment_succeeded':
        case 'invoice.payment_failed':
          const invoice = event.data.object as Stripe.Invoice
          await handleInvoice(invoice)
          break

        default:
          console.log(`Unhandled event type: ${event.type}`)
      }
    } catch (error) {
      console.error('Webhook handler failed:', error)
      return new NextResponse(
        'Webhook handler failed. Check logs.',
        { status: 400 }
      )
    }
  }

  return NextResponse.json({ received: true })
}
