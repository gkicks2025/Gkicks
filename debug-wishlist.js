// Debug script to check wishlist localStorage
console.log('=== WISHLIST DEBUG SCRIPT ===');

// Check if we're in browser environment
if (typeof window !== 'undefined' && window.localStorage) {
  const wishlistData = localStorage.getItem('gkicks-wishlist');
  
  if (wishlistData) {
    try {
      const items = JSON.parse(wishlistData);
      console.log('📋 Wishlist items found:', items.length);
      
      items.forEach((item, index) => {
        console.log(`\n🔍 Item ${index + 1}:`);
        console.log('  - ID:', item.id);
        console.log('  - Name:', item.name);
        console.log('  - Image:', item.image);
        console.log('  - Image URL:', item.image_url);
        console.log('  - Has valid image:', item.image && item.image !== '/placeholder.svg' && item.image !== '/placeholder-product.jpg');
      });
    } catch (error) {
      console.error('❌ Error parsing wishlist data:', error);
    }
  } else {
    console.log('📭 No wishlist items found in localStorage');
  }
} else {
  console.log('🌐 Not in browser environment - run this in browser console');
}

console.log('=== END DEBUG ===');