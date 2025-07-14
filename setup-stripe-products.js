import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const products = [
  {
    name: 'Single Credit',
    description: '1 E-book Generation Credit',
    amount: 299, // $2.99 in cents
    currency: 'usd',
    type: 'one_time'
  },
  {
    name: '3-Credit Bundle',
    description: '3 E-book Generation Credits',
    amount: 799, // $7.99 in cents
    currency: 'usd',
    type: 'one_time'
  },
  {
    name: '5-Credit Bundle',
    description: '5 E-book Generation Credits',
    amount: 1199, // $11.99 in cents
    currency: 'usd',
    type: 'one_time'
  }
];

async function createProducts() {
  console.log('Creating Stripe products...\n');
  
  for (const product of products) {
    try {
      // Create the product
      const stripeProduct = await stripe.products.create({
        name: product.name,
        description: product.description,
      });

      // Create the price
      const priceData = {
        product: stripeProduct.id,
        unit_amount: product.amount,
        currency: product.currency,
      };

      if (product.type === 'recurring') {
        priceData.recurring = {
          interval: product.interval
        };
      }

      const stripePrice = await stripe.prices.create(priceData);

      console.log(`✅ Created: ${product.name}`);
      console.log(`   Product ID: ${stripeProduct.id}`);
      console.log(`   Price ID: ${stripePrice.id}`);
      console.log(`   Amount: $${(product.amount / 100).toFixed(2)}`);
      console.log(`   Type: ${product.type}${product.interval ? ` (${product.interval})` : ''}`);
      console.log('');

    } catch (error) {
      console.error(`❌ Error creating ${product.name}:`, error.message);
    }
  }
  
  console.log('🎉 Product creation complete!');
  console.log('Copy the Price IDs above into your code.');
}

// Run the script
createProducts().catch(console.error); 