// FAQ Training Data for GKICKS AI Chatbot

export interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  priority: 'high' | 'medium' | 'low';
}

export const faqData: FAQItem[] = [
  // Store Information
  {
    id: 'store-001',
    category: 'Store Information',
    question: 'What are your store hours?',
    answer: 'Our store is open daily from 10:00 AM to 9:00 PM, including weekends and holidays.',
    keywords: ['hours', 'open', 'close', 'time', 'schedule'],
    priority: 'high'
  },
  {
    id: 'store-002',
    category: 'Store Information',
    question: 'Where is GKicks located?',
    answer: 'GKicks is located in the Philippines. We serve customers nationwide through our online store and have physical locations for in-store shopping.',
    keywords: ['location', 'address', 'where', 'philippines'],
    priority: 'high'
  },
  {
    id: 'store-003',
    category: 'Store Information',
    question: 'How can I contact customer service?',
    answer: 'You can reach our customer service through this chat, call our hotline, or visit our physical store. We\'re here to help with any questions about products, orders, or sizing.',
    keywords: ['contact', 'customer service', 'help', 'support'],
    priority: 'high'
  },

  // Shipping & Delivery
  {
    id: 'shipping-001',
    category: 'Shipping & Delivery',
    question: 'Do you offer free shipping?',
    answer: 'Yes! We offer free shipping for all orders over ₱3,000. For orders below ₱3,000, standard shipping rates apply.',
    keywords: ['free shipping', 'delivery', 'shipping cost', '3000'],
    priority: 'high'
  },
  {
    id: 'shipping-002',
    category: 'Shipping & Delivery',
    question: 'How long does delivery take?',
    answer: 'Standard delivery takes 3-7 business days within Metro Manila, and 5-10 business days for provincial areas. Express delivery options are available for faster shipping.',
    keywords: ['delivery time', 'shipping time', 'how long', 'days'],
    priority: 'high'
  },
  {
    id: 'shipping-003',
    category: 'Shipping & Delivery',
    question: 'Can I track my order?',
    answer: 'Absolutely! Once your order ships, you\'ll receive a tracking number via email or SMS. You can also check your order status in your account dashboard.',
    keywords: ['track', 'tracking', 'order status', 'shipment'],
    priority: 'medium'
  },

  // Payment Methods
  {
    id: 'payment-001',
    category: 'Payment Methods',
    question: 'What payment methods do you accept?',
    answer: 'We accept various payment methods: Cash (for in-store purchases), GCash, Maya (PayMaya), Credit Cards (Visa, Mastercard), and Debit Cards.',
    keywords: ['payment', 'gcash', 'maya', 'credit card', 'cash', 'paymaya'],
    priority: 'high'
  },
  {
    id: 'payment-002',
    category: 'Payment Methods',
    question: 'Is it safe to pay online?',
    answer: 'Yes, all online payments are secured with SSL encryption. We use trusted payment gateways like GCash and Maya to ensure your financial information is protected.',
    keywords: ['safe', 'secure', 'online payment', 'ssl', 'security'],
    priority: 'medium'
  },
  {
    id: 'payment-003',
    category: 'Payment Methods',
    question: 'Can I pay cash on delivery?',
    answer: 'Cash on delivery (COD) is available for select areas. Please check during checkout if COD is available in your location.',
    keywords: ['cod', 'cash on delivery', 'pay on delivery'],
    priority: 'medium'
  },

  // Returns & Exchanges
  {
    id: 'returns-001',
    category: 'Returns & Exchanges',
    question: 'What is your return policy?',
    answer: 'We offer a 30-day return policy for unworn shoes in original condition with tags and packaging. Items must be returned within 30 days of purchase.',
    keywords: ['return', 'return policy', '30 days', 'refund'],
    priority: 'high'
  },
  {
    id: 'returns-002',
    category: 'Returns & Exchanges',
    question: 'Can I exchange for a different size?',
    answer: 'Yes! Size exchanges are allowed within 14 days of purchase. The shoes must be unworn and in original condition. Size exchanges are free of charge.',
    keywords: ['exchange', 'size exchange', 'different size', '14 days'],
    priority: 'high'
  },
  {
    id: 'returns-003',
    category: 'Returns & Exchanges',
    question: 'How do I return an item?',
    answer: 'To return an item, contact our customer service to initiate the return process. We\'ll provide you with return instructions and a return shipping label if applicable.',
    keywords: ['how to return', 'return process', 'return instructions'],
    priority: 'medium'
  },

  // Sizing & Fit
  {
    id: 'sizing-001',
    category: 'Sizing & Fit',
    question: 'How do I know my shoe size?',
    answer: 'We provide size conversion charts for US, UK, and EU sizes. Measure your foot length and refer to our sizing guide. When in doubt, we recommend going up half a size for comfort.',
    keywords: ['shoe size', 'sizing', 'size chart', 'measure', 'fit'],
    priority: 'high'
  },
  {
    id: 'sizing-002',
    category: 'Sizing & Fit',
    question: 'Do you have half sizes?',
    answer: 'Yes, we carry half sizes for most shoe models. Half sizes provide a better fit, especially for those between whole sizes.',
    keywords: ['half size', 'half sizes', '0.5', 'better fit'],
    priority: 'medium'
  },
  {
    id: 'sizing-003',
    category: 'Sizing & Fit',
    question: 'Do you have wide or narrow fits?',
    answer: 'Select brands offer wide and narrow fits. Brands like New Balance and Asics have various width options. Check the product description or ask our staff for availability.',
    keywords: ['wide', 'narrow', 'width', 'fit', 'new balance', 'asics'],
    priority: 'medium'
  },

  // Product Information
  {
    id: 'product-001',
    category: 'Product Information',
    question: 'What brands do you carry?',
    answer: 'We carry premium brands including Nike, Adidas, Jordan, New Balance, Asics, Reebok, Converse, and Vans. Each brand offers different styles and price ranges.',
    keywords: ['brands', 'nike', 'adidas', 'jordan', 'new balance', 'asics', 'reebok', 'converse', 'vans'],
    priority: 'high'
  },
  {
    id: 'product-002',
    category: 'Product Information',
    question: 'What are your price ranges?',
    answer: 'Our prices vary by brand: Nike (₱3,500-₱12,000), Adidas (₱3,200-₱10,500), Jordan (₱8,000-₱15,000), New Balance (₱4,000-₱9,500), Asics (₱3,800-₱8,500), Reebok (₱2,800-₱7,000), Converse (₱2,500-₱5,500), Vans (₱2,800-₱6,000).',
    keywords: ['price', 'cost', 'how much', 'peso', 'expensive', 'cheap'],
    priority: 'high'
  },
  {
    id: 'product-003',
    category: 'Product Information',
    question: 'Do you have shoes for kids?',
    answer: 'Yes! We have a dedicated kids\' section with shoes for children in all categories - running, basketball, casual, and school shoes. All major brands offer kids\' sizes.',
    keywords: ['kids', 'children', 'kids shoes', 'children shoes', 'small sizes'],
    priority: 'medium'
  },
  {
    id: 'product-004',
    category: 'Product Information',
    question: 'Do you sell authentic shoes?',
    answer: 'Absolutely! All our shoes are 100% authentic and sourced directly from authorized distributors. We guarantee the authenticity of every product we sell.',
    keywords: ['authentic', 'genuine', 'real', 'original', 'fake'],
    priority: 'high'
  },

  // Account & Orders
  {
    id: 'account-001',
    category: 'Account & Orders',
    question: 'Do I need to create an account to order?',
    answer: 'While you can browse without an account, creating one allows you to track orders, save favorites, manage addresses, and get personalized recommendations.',
    keywords: ['account', 'register', 'sign up', 'create account'],
    priority: 'medium'
  },
  {
    id: 'account-002',
    category: 'Account & Orders',
    question: 'How can I track my order?',
    answer: 'Log into your account and go to "My Orders" to see real-time order status. You\'ll also receive email/SMS updates with tracking information.',
    keywords: ['track order', 'order status', 'my orders', 'tracking'],
    priority: 'medium'
  },
  {
    id: 'account-003',
    category: 'Account & Orders',
    question: 'Can I cancel my order?',
    answer: 'Orders can be cancelled within 2 hours of placement if they haven\'t been processed yet. Contact customer service immediately for cancellation requests.',
    keywords: ['cancel', 'cancel order', 'cancellation', '2 hours'],
    priority: 'medium'
  },

  // Special Services
  {
    id: 'service-001',
    category: 'Special Services',
    question: 'Do you offer gift wrapping?',
    answer: 'Yes, we offer complimentary gift wrapping for special occasions. Select the gift wrap option during checkout or mention it in your order notes.',
    keywords: ['gift wrap', 'gift wrapping', 'present', 'special occasion'],
    priority: 'low'
  },
  {
    id: 'service-002',
    category: 'Special Services',
    question: 'Do you have a loyalty program?',
    answer: 'Yes! Join our GKicks Rewards program to earn points on every purchase, get exclusive discounts, early access to sales, and birthday specials.',
    keywords: ['loyalty', 'rewards', 'points', 'program', 'discounts'],
    priority: 'medium'
  },
  {
    id: 'service-003',
    category: 'Special Services',
    question: 'Do you offer shoe cleaning services?',
    answer: 'We offer professional shoe cleaning and restoration services for premium sneakers. Bring your shoes to our store for assessment and pricing.',
    keywords: ['cleaning', 'shoe cleaning', 'restoration', 'professional cleaning'],
    priority: 'low'
  }
];

// Helper function to search FAQ by keywords
export function searchFAQ(query: string): FAQItem[] {
  const searchTerms = query.toLowerCase().split(' ');
  
  return faqData.filter(faq => {
    const searchableText = `${faq.question} ${faq.answer} ${faq.keywords.join(' ')}`.toLowerCase();
    return searchTerms.some(term => searchableText.includes(term));
  }).sort((a, b) => {
    // Sort by priority: high > medium > low
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

// Get FAQ by category
export function getFAQByCategory(category: string): FAQItem[] {
  return faqData.filter(faq => faq.category === category);
}

// Get all FAQ categories
export function getFAQCategories(): string[] {
  return [...new Set(faqData.map(faq => faq.category))];
}