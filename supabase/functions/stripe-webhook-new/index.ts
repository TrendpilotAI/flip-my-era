// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Import via bare specifier thanks to the import_map.json file.
import Stripe from 'https://esm.sh/stripe@14?target=denonext'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  // This is needed to use the Fetch API rather than relying on the Node http
  // package.
  apiVersion: '2024-11-20'
})

// This is needed in order to use the Web Crypto API in Deno.
const cryptoProvider = Stripe.createSubtleCryptoProvider()

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Stripe product configuration
const STRIPE_PRODUCTS = {
  'price_1Rk4JDQH2CPu3kDwnWUmRgHb': { name: '3-Credit Bundle', amount: 3 },
  'price_1Rk4JDQH2CPu3kDwnWUmRgHc': { name: '5-Credit Bundle', amount: 5 },
  'price_1Rk4JDQH2CPu3kDwnWUmRgHd': { name: '10-Credit Bundle', amount: 10 }
} as const

console.log('🚀 Stripe Webhook Function Started')

Deno.serve(async (request) => {
  // Handle CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature'
      }
    })
  }

  try {
    const signature = request.headers.get('Stripe-Signature')
    
    if (!signature) {
      console.error('❌ No Stripe signature found')
      return new Response('No signature provided', { status: 400 })
    }

    // First step is to verify the event. The .text() method must be used as the
    // verification relies on the raw request body rather than the parsed JSON.
    const body = await request.text()
    let receivedEvent

    try {
      receivedEvent = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
        undefined,
        cryptoProvider
      )
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message)
      return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 })
    }

    console.log(`🔔 Event received: ${receivedEvent.id} (${receivedEvent.type})`)

    // Handle checkout.session.completed events
    if (receivedEvent.type === 'checkout.session.completed') {
      await handleCheckoutSessionCompleted(receivedEvent.data.object as Stripe.Checkout.Session)
    }

    return new Response(JSON.stringify({ 
      received: true,
      eventId: receivedEvent.id,
      eventType: receivedEvent.type 
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Webhook error:', error)
    return new Response(`Webhook error: ${error.message}`, { status: 500 })
  }
})

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log(`💰 Processing checkout session: ${session.id}`)

  try {
    // Get session with line items
    const sessionWithLineItems = await stripe.checkout.sessions.retrieve(
      session.id,
      { expand: ['line_items'] }
    )

    if (!sessionWithLineItems.line_items?.data) {
      console.error('❌ No line items found in session')
      return
    }

    // Get customer email from session
    const customerEmail = session.customer_details?.email
    if (!customerEmail) {
      console.error('❌ No customer email found')
      return
    }

    // Find user by email
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', customerEmail)
      .single()

    if (profileError || !profiles) {
      console.error('❌ User not found for email:', customerEmail)
      return
    }

    const userId = profiles.id
    console.log(`👤 Found user: ${userId}`)

    // Process line items
    for (const item of sessionWithLineItems.line_items.data) {
      const priceId = item.price?.id
      if (!priceId) {
        console.log(`⚠️ No price ID found for item`)
        continue
      }

      const productConfig = STRIPE_PRODUCTS[priceId as keyof typeof STRIPE_PRODUCTS]
      if (!productConfig) {
        console.log(`⚠️ No configuration found for price ID: ${priceId}`)
        continue
      }

      // Get the quantity from the line item (default to 1 if not specified)
      const quantity = item.quantity || 1
      const totalCreditsForThisItem = productConfig.amount * quantity

      console.log(`📦 Processing item: ${productConfig.name} (${quantity} x ${productConfig.amount} credits = ${totalCreditsForThisItem} total)`)

      // Allocate credits to user
      await allocateCredits(userId, totalCreditsForThisItem, session, item)
    }

    console.log(`✅ Successfully processed checkout session: ${session.id}`)

  } catch (error) {
    console.error('❌ Error processing checkout session:', error)
    throw error
  }
}

async function allocateCredits(
  userId: string, 
  creditAmount: number, 
  session: Stripe.Checkout.Session,
  item: Stripe.LineItem
) {
  try {
    // Get current user credits
    const { data: userCredits, error: creditsError } = await supabase
      .from('user_credits')
      .select('balance, total_earned')
      .eq('user_id', userId)
      .single()

    let currentBalance = 0
    let totalEarned = 0

    if (creditsError && creditsError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is expected for new users
      console.error('❌ Error fetching user credits:', creditsError)
      throw creditsError
    }

    if (userCredits) {
      currentBalance = userCredits.balance
      totalEarned = userCredits.total_earned
    }

    // Calculate new balance
    const newBalance = currentBalance + creditAmount
    const newTotalEarned = totalEarned + creditAmount

    // Upsert user credits
    const { error: upsertError } = await supabase
      .from('user_credits')
      .upsert({
        user_id: userId,
        balance: newBalance,
        total_earned: newTotalEarned,
        updated_at: new Date().toISOString()
      })

    if (upsertError) {
      console.error('❌ Error upserting user credits:', upsertError)
      throw upsertError
    }

    // Create credit transaction record
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        type: 'purchase',
        amount: creditAmount,
        description: `Credit purchase: ${item.description || 'Stripe payment'} (${item.quantity || 1} unit${(item.quantity || 1) > 1 ? 's' : ''})`,
        balance_after_transaction: newBalance,
        stripe_session_id: session.id,
        metadata: {
          stripe_payment_intent: session.payment_intent,
          stripe_customer_id: session.customer,
          product_name: item.description,
          amount_paid: session.amount_total,
          price_id: item.price?.id,
          quantity: item.quantity || 1
        }
      })

    if (transactionError) {
      console.error('❌ Error creating credit transaction:', transactionError)
      throw transactionError
    }

    console.log(`✅ Allocated ${creditAmount} credits to user ${userId}. New balance: ${newBalance}`)

  } catch (error) {
    console.error('❌ Error allocating credits:', error)
    throw error
  }
} 