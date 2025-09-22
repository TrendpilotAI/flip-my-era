/**
 * Stripe Products & Prices Setup Script
 *
 * This script creates all the necessary Stripe products and prices
 * for the FlipMyEra new pricing structure.
 *
 * Run with: node scripts/setup-stripe-products.js
 */

import Stripe from 'stripe';
import fs from 'fs';

// Load environment variables from .env.local
function loadEnv() {
  try {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const envLines = envContent.split('\n');
    const envVars = {};

    for (const line of envLines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    }

    // Set environment variables
    Object.keys(envVars).forEach(key => {
      process.env[key] = envVars[key];
    });

    return envVars;
  } catch (error) {
    console.error('Error loading .env.local:', error.message);
    return {};
  }
}

// Load environment variables
loadEnv();

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_...');

// Product configurations
const products = [
  {
    name: 'Free Forever',
    description: '10 credits refreshed monthly - perfect for trying out FlipMyEra',
    metadata: { plan_type: 'free', credits: '10' }
  },
  {
    name: 'Swiftie Starter',
    description: '30 credits/month - perfect for Taylor Swift fans and casual creators',
    metadata: { plan_type: 'starter', credits: '30' }
  },
  {
    name: 'Swiftie Deluxe',
    description: '75 credits/month - professional content creators and social media influencers',
    metadata: { plan_type: 'deluxe', credits: '75' }
  },
  {
    name: 'Opus VIP',
    description: '150 credits/month - professional publishers and monetizing creators',
    metadata: { plan_type: 'vip', credits: '150' }
  },
  {
    name: '$25 Credit Pack',
    description: '25 credits - perfect for a story project',
    metadata: { product_type: 'credits', credits: '25' }
  },
  {
    name: '$50 Credit Pack',
    description: '55 credits (10% bonus) - best value for creators',
    metadata: { product_type: 'credits', credits: '55', bonus: '10%' }
  },
  {
    name: '$100 Credit Pack',
    description: '120 credits (20% bonus) - maximum value pack',
    metadata: { product_type: 'credits', credits: '120', bonus: '20%' }
  }
];

// Price configurations (in cents)
const prices = [
  // Subscription plans
  { productIndex: 0, amount: 0, currency: 'usd', recurring: { interval: 'month' }, metadata: { plan_type: 'free' } },
  { productIndex: 1, amount: 1299, currency: 'usd', recurring: { interval: 'month' }, metadata: { plan_type: 'starter' } },
  { productIndex: 2, amount: 2500, currency: 'usd', recurring: { interval: 'month' }, metadata: { plan_type: 'deluxe' } },
  { productIndex: 3, amount: 4999, currency: 'usd', recurring: { interval: 'month' }, metadata: { plan_type: 'vip' } },

  // One-time credit purchases
  { productIndex: 4, amount: 2500, currency: 'usd', metadata: { product_type: 'credits', credits: '25' } },
  { productIndex: 5, amount: 5000, currency: 'usd', metadata: { product_type: 'credits', credits: '55', bonus: '10%' } },
  { productIndex: 6, amount: 10000, currency: 'usd', metadata: { product_type: 'credits', credits: '120', bonus: '20%' } }
];

async function createProducts() {
  console.log('🚀 Setting up Stripe products and prices...\n');

  try {
    // Create products
    const createdProducts = [];
    for (const productConfig of products) {
      console.log(`📦 Creating product: ${productConfig.name}`);

      const product = await stripe.products.create({
        name: productConfig.name,
        description: productConfig.description,
        metadata: productConfig.metadata
      });

      createdProducts.push(product);
      console.log(`✅ Created product: ${product.id} - ${product.name}\n`);
    }

    // Create prices
    const createdPrices = [];
    for (const priceConfig of prices) {
      const product = createdProducts[priceConfig.productIndex];
      console.log(`💰 Creating price for: ${product.name} (${priceConfig.amount / 100} ${priceConfig.currency.toUpperCase()})`);

      const priceData = {
        product: product.id,
        unit_amount: priceConfig.amount,
        currency: priceConfig.currency,
        metadata: priceConfig.metadata
      };

      // Add recurring for subscription plans
      if (priceConfig.recurring) {
        priceData.recurring = priceConfig.recurring;
      }

      const price = await stripe.prices.create(priceData);

      createdPrices.push(price);
      console.log(`✅ Created price: ${price.id} - $${priceConfig.amount / 100}/${priceConfig.recurring ? 'month' : 'one-time'}\n`);
    }

    // Output summary
    console.log('🎉 Setup complete! Here are your new Stripe IDs:\n');

    console.log('📋 PRODUCTS:');
    createdProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}: ${product.id}`);
    });

    console.log('\n💵 PRICES:');
    createdPrices.forEach((price, index) => {
      const product = createdProducts[prices[index].productIndex];
      const isRecurring = prices[index].recurring;
      console.log(`${index + 1}. ${product.name}: ${price.id} (${isRecurring ? 'monthly' : 'one-time'})`);
    });

    console.log('\n📝 Update your environment variables and code with these IDs:');
    console.log('VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...');
    console.log('STRIPE_SECRET_KEY=sk_test_...');

    console.log('\n🔧 Update your code files:');
    console.log('- src/app/pages/Checkout.tsx (planOptions)');
    console.log('- src/modules/user/components/CreditPurchaseModal.tsx (pricingTiers)');
    console.log('- supabase/functions/create-checkout/index.ts (priceIds)');

  } catch (error) {
    console.error('❌ Error setting up Stripe products:', error);
    process.exit(1);
  }
}

// Run the setup
createProducts();
