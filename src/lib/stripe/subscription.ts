import Stripe from 'stripe'
import { getStripe } from '.'
import { supabaseAdmin } from '@/lib/supabase/admin'

type SubscriptionStatus = 'trialing' | 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'unpaid' | 'paused'

interface StripeSubscriptionWithPeriod extends Stripe.Subscription {
  current_period_start: number
  current_period_end: number
}

export async function getOrCreateCustomer(userId: string, email: string): Promise<string> {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single()

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id
  }

  const customer = await getStripe().customers.create({
    email,
    metadata: { supabase_user_id: userId },
  })

  await supabaseAdmin
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId)

  return customer.id
}

export async function manageSubscriptionStatusChange(
  subscriptionId: string,
  customerId: string,
  isNewSubscription: boolean
) {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!profile?.id) {
    throw new Error(`Profile not found for customer: ${customerId}`)
  }

  const subscription = await getStripe().subscriptions.retrieve(subscriptionId, {
    expand: ['default_payment_method'],
  }) as unknown as StripeSubscriptionWithPeriod

  const subscriptionData = {
    user_id: profile.id,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer as string,
    stripe_price_id: subscription.items.data[0].price.id,
    status: subscription.status as SubscriptionStatus,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    trial_end: subscription.trial_end 
      ? new Date(subscription.trial_end * 1000).toISOString() 
      : null,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .upsert(subscriptionData, { onConflict: 'user_id' })

  if (error) {
    console.error('Subscription upsert failed:', error)
    throw new Error(`Subscription upsert failed: ${error.message}`)
  }

  console.log(
    `Subscription ${isNewSubscription ? 'created' : 'updated'} for user ${profile.id}: ${subscription.status}`
  )
}

export async function handleInvoice(invoice: Stripe.Invoice) {
  const subscriptionRef = (invoice as unknown as { subscription?: string | { id: string } }).subscription
  const subscriptionId = typeof subscriptionRef === 'string' 
    ? subscriptionRef 
    : subscriptionRef?.id
    
  if (subscriptionId) {
    const subscription = await getStripe().subscriptions.retrieve(subscriptionId)
    await manageSubscriptionStatusChange(
      subscriptionId,
      subscription.customer as string,
      false
    )
  }
}

export async function getUserSubscription(userId: string) {
  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()

  return subscription as {
    id: string
    user_id: string
    stripe_subscription_id: string
    status: SubscriptionStatus
    current_period_start: string
    current_period_end: string
    cancel_at_period_end: boolean
    trial_end: string | null
  } | null
}

export function hasActiveSubscription(subscription: { status: string; current_period_end: string } | null): boolean {
  if (!subscription) return false
  
  const validStatuses = ['active', 'trialing']
  return validStatuses.includes(subscription.status) && new Date(subscription.current_period_end) > new Date()
}
