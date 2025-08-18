/**
 * Test Script for Delete Functionality
 * Run this in browser console to test document deletion
 */

// Test delete functionality
function testDeleteFunctionality() {
  console.log('🧪 TESTING DELETE FUNCTIONALITY');
  
  // Check if we're on the right page
  if (!window.location.pathname.includes('lead-management')) {
    console.error('❌ Must be on lead management page');
    return;
  }
  
  // Find delete buttons
  const deleteButtons = document.querySelectorAll('[data-testid="delete-document"]');
  console.log(`🔍 Found ${deleteButtons.length} delete buttons`);
  
  if (deleteButtons.length === 0) {
    console.warn('⚠️ No delete buttons found. Upload a document first.');
    return;
  }
  
  // Test clicking first delete button
  const firstButton = deleteButtons[0];
  console.log('🖱️ Clicking first delete button...');
  
  // Monitor network requests
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    if (args[0].includes('documents.delete')) {
      console.log('🌐 DELETE API CALL:', args);
    }
    return originalFetch.apply(this, args);
  };
  
  // Click the button
  firstButton.click();
  
  // Restore fetch after 5 seconds
  setTimeout(() => {
    window.fetch = originalFetch;
    console.log('✅ Test complete');
  }, 5000);
}

// Export for manual testing
window.testDeleteFunctionality = testDeleteFunctionality;

console.log('🔧 Delete test utility loaded. Run testDeleteFunctionality() to test.');