import crypto from 'crypto';

// Test webhook payload
const testPayload = {
  id: 'cs_test_1234567890',
  object: 'checkout.session',
  amount_total: 799,
  currency: 'usd',
  customer_details: {
    email: 'test@example.com',
    name: 'Test User'
  },
  line_items: {
    data: [
      {
        price: {
          id: 'price_1Rk4JDQH2CPu3kDwnWUmRgHb'
        },
        quantity: 1,
        description: '3-Credit Bundle'
      }
    ]
  },
  payment_intent: 'pi_test_1234567890',
  status: 'complete'
};

// Convert to JSON string
const payload = JSON.stringify(testPayload);

// Create a fake signature (this won't work with real Stripe verification)
const timestamp = Math.floor(Date.now() / 1000);
const signedPayload = `${timestamp}.${payload}`;
const signature = crypto
  .createHmac('sha256', 'whsec_test_secret')
  .update(signedPayload, 'utf8')
  .digest('hex');

console.log('Test webhook payload:');
console.log('URL: https://tusdijypopftcmlenahr.supabase.co/functions/v1/stripe-webhook');
console.log('Headers:');
console.log(`  stripe-signature: t=${timestamp},v1=${signature}`);
console.log('Body:', payload);

console.log('\nTo test manually:');
console.log(`curl -X POST "https://tusdijypopftcmlenahr.supabase.co/functions/v1/stripe-webhook" \\`);
console.log(`  -H "Content-Type: application/json" \\`);
console.log(`  -H "stripe-signature: t=${timestamp},v1=${signature}" \\`);
console.log(`  -d '${payload}'`); 