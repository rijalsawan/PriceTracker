// Test script to check search functionality
// Run this in the browser console or as a Node.js script

const testSearchAPI = async () => {
  try {
    // Test API base URL
    console.log('🔍 Testing search API...');
    
    // Check if backend is running
    const healthCheck = await fetch('http://localhost:5000/api/health');
    if (healthCheck.ok) {
      console.log('✅ Backend is running');
    } else {
      console.log('❌ Backend health check failed');
      return;
    }
    
    // Test authentication (you'll need a valid token)
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.log('❌ No auth token found. Please log in first.');
      return;
    }
    
    console.log('🔑 Using auth token:', token.substring(0, 20) + '...');
    
    // Test search suggestions
    console.log('📝 Testing search suggestions...');
    const suggestionsResponse = await fetch('http://localhost:5000/api/search/suggestions?q=laptop', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (suggestionsResponse.ok) {
      const suggestionsData = await suggestionsResponse.json();
      console.log('✅ Suggestions API working:', suggestionsData);
    } else {
      const error = await suggestionsResponse.text();
      console.log('❌ Suggestions API failed:', error);
    }
    
    // Test product search
    console.log('🔍 Testing product search...');
    const searchResponse = await fetch('http://localhost:5000/api/search/products?q=laptop&page=1', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log('✅ Search API working:', searchData);
    } else {
      const error = await searchResponse.text();
      console.log('❌ Search API failed:', error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Instructions:
console.log('To test the search API:');
console.log('1. Make sure backend is running on port 5000');
console.log('2. Make sure you are logged in');
console.log('3. Run: testSearchAPI()');

// Export for use
if (typeof window !== 'undefined') {
  window.testSearchAPI = testSearchAPI;
}
