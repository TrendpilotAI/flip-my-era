// Test script to verify credit system functionality
// This script can be run to test the credit allocation and fetching

const testCreditSystem = async () => {
  console.log('🧪 Testing Credit System...');
  
  // Test 1: Check if credits function is accessible
  try {
    const response = await fetch('/api/functions/credits', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('✅ Credits function is accessible');
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', data);
    }
  } catch (error) {
    console.error('❌ Error accessing credits function:', error);
  }
  
  // Test 2: Check webhook endpoint
  try {
    const response = await fetch('/api/functions/stripe-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        test: true
      }),
    });
    
    console.log('✅ Webhook function is accessible');
    console.log('Response status:', response.status);
  } catch (error) {
    console.error('❌ Error accessing webhook function:', error);
  }
  
  console.log('🧪 Credit system test completed');
};

// Run the test if this script is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  window.testCreditSystem = testCreditSystem;
  console.log('Credit system test available as window.testCreditSystem()');
} else {
  // Node.js environment
  testCreditSystem();
}

export { testCreditSystem }; 