const fs = require('fs');
const path = require('path');

// Pages that use context and need dynamic rendering
const pagesToFix = [
  'app/page.tsx',
  'app/orders/page.tsx',
  'app/men/page.tsx',
  'app/auth/page.tsx',
  'app/auth/reset-password/page.tsx',
  'app/auth/update-password/page.tsx',
  'app/admin/layout.tsx',
  'app/admin/analytics/page.tsx',
  'app/admin/inventory/page.tsx',
  'app/admin/login/page.tsx',
  'app/kids/page.tsx',
  'app/women/page.tsx',
  'app/admin/page.tsx',
  'app/admin/orders/page.tsx',
  'app/settings/page.tsx',
  'app/cart/page.tsx',
  'app/profile/page.tsx',
  'app/wishlist/page.tsx',
  'app/admin/staff-login/page.tsx',
  'app/sale/page.tsx',
  'app/product/[id]/page.tsx',
  'app/admin/pos/page.tsx',
  'app/admin/users/page.tsx'
];

pagesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Remove any revalidate export lines
    content = content.replace(/export const revalidate = \d+\n?/g, '');
    content = content.replace(/export const revalidate = 0\n?/g, '');
    
    // Ensure dynamic export exists
    if (!content.includes("export const dynamic = 'force-dynamic'")) {
      // Find the first import or the line after "use client"
      const lines = content.split('\n');
      let insertIndex = 0;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('"use client"') || lines[i].includes("'use client'")) {
          insertIndex = i + 1;
          break;
        }
      }
      
      // Insert the dynamic export
      lines.splice(insertIndex, 0, '', "export const dynamic = 'force-dynamic'");
      content = lines.join('\n');
    }
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
  } else {
    console.log(`File not found: ${filePath}`);
  }
});

console.log('Dynamic export fix completed!');