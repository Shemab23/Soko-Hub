import { 
  Shop, 
  Product, 
  Order, 
  Payout, 
  QuotationRequest, 
  PurchaseRequest 
} from '../types';
import { mockHashPassword } from './crypto';

export function getInitialSeedData(): {
  shops: Shop[];
  products: Product[];
  orders: Order[];
  payouts: Payout[];
  quotations: QuotationRequest[];
  purchaseRequests: PurchaseRequest[];
} {
  const defaultPasswordHash = mockHashPassword('Demo1234!');

  const shops: Shop[] = [
    {
      id: 'shop_kigali_fresh',
      name: 'Kigali Fresh',
      slug: 'kigali-fresh',
      description: 'Finest organic produce, dairy, artisanal coffee and spices straight from local Rwandan farms.',
      category: 'Groceries',
      location: 'Kimironko Market, Kigali',
      phone: '+250 788 123 456',
      email: 'admin@kigalifresh.demo',
      passwordHash: defaultPasswordHash,
      enabledModules: ['orders', 'analytics', 'deliveries', 'quotations', 'purchase_requests'],
      enabledGateways: ['stripe', 'paypal', 'flutterwave'],
      isSuspended: false,
      createdAt: '2026-09-01T08:00:00Z',
      balance: 184500,
    },
    {
      id: 'shop_umuco_electronics',
      name: 'Umuco Electronics',
      slug: 'umuco-electronics',
      description: 'Reliable solar tech, electronics, power backups, and everyday gadgets in central Kigali.',
      category: 'Electronics',
      location: 'UTC Mall, Nyarugenge, Kigali',
      phone: '+250 788 234 567',
      email: 'admin@umuco.demo',
      passwordHash: defaultPasswordHash,
      enabledModules: ['orders'], // ONLY order history!
      enabledGateways: ['stripe', 'paypal'], // NO Flutterwave!
      isSuspended: false,
      createdAt: '2026-09-05T09:30:00Z',
      balance: 342000,
    },
    {
      id: 'shop_gisenyi_books',
      name: 'Gisenyi Books & Stationery',
      slug: 'gisenyi-books',
      description: 'Curated East African literature, educational materials, artisanal Imigongo journals and gifts.',
      category: 'Books',
      location: 'Rubavu Waterfront, Gisenyi',
      phone: '+250 788 345 678',
      email: 'admin@gisenyibooks.demo',
      passwordHash: defaultPasswordHash,
      enabledModules: ['orders', 'analytics', 'deliveries'], // Customer tracking + Delivery
      enabledGateways: ['flutterwave'], // ONLY Flutterwave (mobile money)!
      isSuspended: false,
      createdAt: '2026-09-10T11:00:00Z',
      balance: 98000,
    },
  ];

  const products: Product[] = [
    // --- Kigali Fresh Products ---
    {
      id: 'prod_kf_coffee',
      shopId: 'shop_kigali_fresh',
      name: 'Gorilla Mountain Coffee (500g)',
      description: 'Single-origin washed Bourbon Arabica beans roasted in Musanze. Notes of blackcurrant, dark chocolate, and orange zest.',
      category: 'Coffee & Tea',
      price: 7900,
      stock: 42,
      isActive: true,
      unit: '500g bag',
      badge: 'Bestseller',
      sku: 'KF-COF-500',
      createdAt: '2026-09-02T10:00:00Z',
    },
    {
      id: 'prod_kf_akabanga',
      shopId: 'shop_kigali_fresh',
      name: 'Nyirangarama Akabanga Chilli Sauce (100ml)',
      description: 'The iconic Rwandan yellow habanero chili oil with eyedropper cap. Extremely hot, smoky, and authentic.',
      category: 'Condiments',
      price: 2500,
      stock: 65,
      isActive: true,
      unit: '100ml bottle',
      badge: 'Popular',
      sku: 'KF-AKB-100',
      createdAt: '2026-09-02T10:15:00Z',
    },
    {
      id: 'prod_kf_honey',
      shopId: 'shop_kigali_fresh',
      name: 'Pure Nyungwe Forest Forest Honey (500g)',
      description: 'Raw, unpasteurized amber honey harvested ethically by cooperatives bordering Nyungwe National Park.',
      category: 'Pantry',
      price: 6500,
      stock: 18,
      isActive: true,
      unit: '500g jar',
      badge: 'Organic',
      sku: 'KF-HNY-500',
      createdAt: '2026-09-02T10:30:00Z',
    },
    {
      id: 'prod_kf_milk',
      shopId: 'shop_kigali_fresh',
      name: 'Inyange Whole Milk UHT (1L)',
      description: 'Pasteurized long-life whole cow milk sourced from Gicumbi dairy farmers.',
      category: 'Dairy',
      price: 1400,
      stock: 80,
      isActive: true,
      unit: '1L carton',
      sku: 'KF-MLK-1L',
      createdAt: '2026-09-02T10:45:00Z',
    },
    {
      id: 'prod_kf_sambaza',
      shopId: 'shop_kigali_fresh',
      name: 'Lake Kivu Dried Sambaza (500g)',
      description: 'Crispy sun-dried silver fish from Lake Kivu. Rich in minerals, perfect for hearty groundnut stew.',
      category: 'Seafood',
      price: 5200,
      stock: 4, // LOW STOCK TRIGGER (<= 5)
      isActive: true,
      unit: '500g pack',
      badge: 'Low Stock',
      sku: 'KF-SMB-500',
      createdAt: '2026-09-02T11:00:00Z',
    },
    {
      id: 'prod_kf_tea',
      shopId: 'shop_kigali_fresh',
      name: 'Sorwathe Premium Silver Needle Tea (150g)',
      description: 'Award-winning high-altitude artisan whole leaf white tea from Rulindo highlands.',
      category: 'Coffee & Tea',
      price: 9500,
      stock: 12,
      isActive: true,
      unit: '150g tin',
      sku: 'KF-TEA-150',
      createdAt: '2026-09-02T11:15:00Z',
    },
    {
      id: 'prod_kf_avocados',
      shopId: 'shop_kigali_fresh',
      name: 'Organic Hass Avocados (2kg Basket)',
      description: 'Jumbo creamy Hass avocados hand-picked in Rubavu. Peak ripeness and butter texture.',
      category: 'Fresh Produce',
      price: 3600,
      stock: 24,
      isActive: true,
      unit: '2kg basket',
      sku: 'KF-AVO-2KG',
      createdAt: '2026-09-02T11:30:00Z',
    },
    {
      id: 'prod_kf_potatoes',
      shopId: 'shop_kigali_fresh',
      name: 'Kinigi Red Volcano Potatoes (10kg Sack)',
      description: 'Famous Musanze volcanic soil Kinigi variety, naturally floury and ideal for baking or chips.',
      category: 'Fresh Produce',
      price: 7500,
      stock: 3, // LOW STOCK TRIGGER (<= 5)
      isActive: true,
      unit: '10kg sack',
      badge: 'Low Stock',
      sku: 'KF-POT-10KG',
      createdAt: '2026-09-02T11:45:00Z',
    },

    // --- Umuco Electronics Products ---
    {
      id: 'prod_ue_solar',
      shopId: 'shop_umuco_electronics',
      name: 'Solar Lantern with FM Radio & USB',
      description: 'High-efficiency polycrystalline solar panel, built-in bright LED floodlight, USB phone charger, and crisp FM radio.',
      category: 'Solar & Power',
      price: 24500,
      stock: 22,
      isActive: true,
      unit: 'unit',
      badge: 'Solar Ready',
      sku: 'UE-SOL-RAD',
      createdAt: '2026-09-06T10:00:00Z',
    },
    {
      id: 'prod_ue_coffee',
      shopId: 'shop_umuco_electronics',
      // Multi-shop overlap #1: Gorilla Mountain Coffee!
      name: 'Gorilla Mountain Coffee (500g)',
      description: 'Fresh batch of Musanze Bourbon Arabica kept sealed in our UTC tech lounge shop pantry.',
      category: 'Coffee & Snacks',
      price: 8500, // Umuco sells it at 8,500 RWF (vs Kigali Fresh 7,900)
      stock: 14,
      isActive: true,
      unit: '500g bag',
      sku: 'UE-COF-500',
      createdAt: '2026-09-06T10:30:00Z',
    },
    {
      id: 'prod_ue_phone',
      shopId: 'shop_umuco_electronics',
      name: 'Kazi 4G Dual SIM Rugged Phone',
      description: 'Long battery life (3500mAh, 12 days standby), loud speaker, powerful dual LED flashlight, wireless FM radio.',
      category: 'Mobile & Accessories',
      price: 28000,
      stock: 19,
      isActive: true,
      unit: 'unit',
      badge: 'Durable',
      sku: 'UE-MOB-4G',
      createdAt: '2026-09-06T11:00:00Z',
    },
    {
      id: 'prod_ue_powerbank',
      shopId: 'shop_umuco_electronics',
      name: 'Heavy-Duty 20,000mAh Power Bank',
      description: '22.5W Fast Charging with digital battery indicator, Type-C Power Delivery and dual USB outputs.',
      category: 'Solar & Power',
      price: 32000,
      stock: 5, // LOW STOCK TRIGGER (<= 5)
      isActive: true,
      unit: 'unit',
      badge: 'Low Stock',
      sku: 'UE-PB-20K',
      createdAt: '2026-09-06T11:30:00Z',
    },
    {
      id: 'prod_ue_cable',
      shopId: 'shop_umuco_electronics',
      name: 'Nylon Braided USB-C Fast Cable (2M)',
      description: 'Heavy duty reinforced aramid fiber cable supporting 60W fast charging and high speed data transfer.',
      category: 'Cables & Hubs',
      price: 4500,
      stock: 45,
      isActive: true,
      unit: 'piece',
      sku: 'UE-CAB-USBC',
      createdAt: '2026-09-06T12:00:00Z',
    },
    {
      id: 'prod_ue_fan',
      shopId: 'shop_umuco_electronics',
      name: 'Rechargeable Desk Emergency Fan',
      description: 'Whisper-quiet brushless motor, 3-speed adjustment with integrated night lamp and 8 hours runtime.',
      category: 'Appliances',
      price: 18500,
      stock: 9,
      isActive: true,
      unit: 'unit',
      sku: 'UE-FAN-RC',
      createdAt: '2026-09-06T12:30:00Z',
    },
    {
      id: 'prod_ue_surge',
      shopId: 'shop_umuco_electronics',
      name: 'Universal 4-Way Power Surge Protector',
      description: 'Flame retardant shell, independent switches for each socket, and integrated child safety shutters.',
      category: 'Solar & Power',
      price: 11000,
      stock: 16,
      isActive: true,
      unit: 'unit',
      sku: 'UE-SRG-4W',
      createdAt: '2026-09-06T13:00:00Z',
    },
    {
      id: 'prod_ue_earbuds',
      shopId: 'shop_umuco_electronics',
      name: 'Wireless Bluetooth Earbuds Pro ANC',
      description: 'Active noise cancellation, IPX5 sweat resistance, touch controls and USB-C wireless charging case.',
      category: 'Audio',
      price: 22000,
      stock: 11,
      isActive: true,
      unit: 'pair',
      sku: 'UE-AUD-EAR',
      createdAt: '2026-09-06T13:30:00Z',
    },

    // --- Gisenyi Books & Stationery Products ---
    {
      id: 'prod_gb_photobook',
      shopId: 'shop_gisenyi_books',
      name: 'Rwanda: Land of a Thousand Hills (Hardcover)',
      description: 'Collector coffee table art edition with 240 full-colour aerial and cultural photographs across all five provinces.',
      category: 'Art & Photography',
      price: 38000,
      stock: 14,
      isActive: true,
      unit: 'book',
      badge: 'Collector Item',
      sku: 'GB-BOK-LOTH',
      createdAt: '2026-09-11T09:00:00Z',
    },
    {
      id: 'prod_gb_solar',
      shopId: 'shop_gisenyi_books',
      // Multi-shop overlap #2: Solar Lantern with FM Radio & USB!
      name: 'Solar Lantern with FM Radio & USB',
      description: 'Portable solar study lamp and FM radio, perfect for evening reading and lake house verandahs.',
      category: 'Study Lights',
      price: 26000, // Gisenyi Books sells it at 26,000 RWF (vs Umuco 24,500)
      stock: 8,
      isActive: true,
      unit: 'unit',
      sku: 'GB-SOL-LMP',
      createdAt: '2026-09-11T09:30:00Z',
    },
    {
      id: 'prod_gb_akabanga',
      shopId: 'shop_gisenyi_books',
      // Multi-shop overlap #3: Nyirangarama Akabanga Chilli Sauce!
      name: 'Nyirangarama Akabanga Chilli Sauce (100ml)',
      description: 'The genuine Sina Gerard Akabanga condiment stocked at our lakeside souvenir corner.',
      category: 'Souvenirs',
      price: 28000 / 10, // 2,800 RWF (vs Kigali Fresh 2,500)
      stock: 25,
      isActive: true,
      unit: '100ml bottle',
      sku: 'GB-AKB-100',
      createdAt: '2026-09-11T10:00:00Z',
    },
    {
      id: 'prod_gb_dict',
      shopId: 'shop_gisenyi_books',
      name: 'Kinyarwanda-English Comprehensive Dictionary',
      description: 'Authoritative 680-page linguistic reference with grammatical notes, idioms, and cultural etymology.',
      category: 'Reference',
      price: 19500,
      stock: 15,
      isActive: true,
      unit: 'book',
      badge: 'Essential',
      sku: 'GB-BOK-KEDIC',
      createdAt: '2026-09-11T10:30:00Z',
    },
    {
      id: 'prod_gb_journal',
      shopId: 'shop_gisenyi_books',
      name: 'Handcrafted Imigongo Geometric Journal',
      description: 'Handmade Rwandan calfskin-bound notebook featuring traditional geometric Imigongo embossed patterns with 160 archival pages.',
      category: 'Stationery',
      price: 12500,
      stock: 2, // LOW STOCK TRIGGER (<= 5)
      isActive: true,
      unit: 'piece',
      badge: 'Low Stock',
      sku: 'GB-JRN-IMG',
      createdAt: '2026-09-11T11:00:00Z',
    },
    {
      id: 'prod_gb_tales',
      shopId: 'shop_gisenyi_books',
      name: 'Rwandan Folk Tales & Proverbs Illustrated',
      description: 'Traditional oral stories of Ryangombe and historical fables compiled with dual Kinyarwanda and English text.',
      category: 'Literature',
      price: 14000,
      stock: 20,
      isActive: true,
      unit: 'book',
      sku: 'GB-BOK-TALE',
      createdAt: '2026-09-11T11:30:00Z',
    },
    {
      id: 'prod_gb_mathset',
      shopId: 'shop_gisenyi_books',
      name: 'Oxford Oxford Precision Geometry Math Set',
      description: 'Metal tin complete with brass compass, divider, 180-degree protractor, set squares, and engraved wooden ruler.',
      category: 'Stationery',
      price: 4500,
      stock: 35,
      isActive: true,
      unit: 'set',
      sku: 'GB-STA-MSET',
      createdAt: '2026-09-11T12:00:00Z',
    },
    {
      id: 'prod_gb_novel',
      shopId: 'shop_gisenyi_books',
      name: 'A Thousand Hills to Heaven: Hope in Rwanda',
      description: 'Gripping memoir of community culinary entrepreneurship and cultural revitalization in modern Kigali.',
      category: 'Literature',
      price: 16500,
      stock: 17,
      isActive: true,
      unit: 'book',
      sku: 'GB-BOK-MEM',
      createdAt: '2026-09-11T12:30:00Z',
    },
  ];

  // 40 historical paid orders spanning the last 30 days
  const orders: Order[] = [];
  const payouts: Payout[] = [];

  const customerPool = [
    { name: 'Jean-Paul Mugisha', email: 'jp.mugisha@gmail.com', phone: '+250 788 111 222', city: 'Kigali - Gasabo' },
    { name: 'Claire Uwera', email: 'claire.u@rwandaonline.rw', phone: '+250 788 333 444', city: 'Kigali - Kicukiro' },
    { name: 'David Habimana', email: 'habimana.d@alumni.ur.ac.rw', phone: '+250 788 555 666', city: 'Rubavu / Gisenyi' },
    { name: 'Aline Ingabire', email: 'ingabire.aline@techhub.rw', phone: '+250 788 777 888', city: 'Kigali - Nyarugenge' },
    { name: 'Emmanuel Gasana', email: 'e.gasana@kigalifinance.com', phone: '+250 788 999 000', city: 'Musanze' },
    { name: 'Grace Mukamana', email: 'grace.mukamana@mtn.co.rw', phone: '+250 788 222 333', city: 'Kigali - Kimironko' },
    { name: 'Patrick Nshimiyimana', email: 'p.nshimiye@coffee.rw', phone: '+250 788 444 555', city: 'Huye' },
  ];

  // Generate 40 deterministic historical orders over past 30 days
  const now = new Date('2026-10-12T12:00:00Z').getTime();

  for (let i = 1; i <= 40; i++) {
    const daysAgo = Math.floor((40 - i) * 0.7);
    const orderDate = new Date(now - daysAgo * 86400000 - (i % 8) * 3600000).toISOString();
    const cust = customerPool[i % customerPool.length];
    const orderId = `ORD-${1000 + i}`;
    const guestSessionId = `guest_hist_${i}`;

    // Cycle combinations of items to simulate single and multi-shop purchases
    const pattern = i % 4;
    let selectedProducts: { product: Product; qty: number }[] = [];

    if (pattern === 0) {
      // Kigali Fresh only
      selectedProducts = [
        { product: products[0], qty: (i % 2) + 1 }, // Coffee
        { product: products[1], qty: (i % 3) + 1 }, // Akabanga
      ];
    } else if (pattern === 1) {
      // Umuco Electronics only
      selectedProducts = [
        { product: products[8], qty: 1 }, // Solar
        { product: products[12], qty: 2 }, // Cable
      ];
    } else if (pattern === 2) {
      // Mixed: Kigali Fresh + Gisenyi Books
      selectedProducts = [
        { product: products[2], qty: 1 }, // Nyungwe Honey (KF)
        { product: products[18], qty: 1 }, // Imigongo Journal (GB)
      ];
    } else {
      // Mixed: Kigali Fresh + Umuco Electronics
      selectedProducts = [
        { product: products[0], qty: 1 }, // Coffee (KF)
        { product: products[11], qty: 1 }, // Power Bank (UE)
      ];
    }

    const items = selectedProducts.map((p, idx) => {
      const subtotal = p.product.price * p.qty;
      const shop = shops.find((s) => s.id === p.product.shopId)!;
      return {
        id: `item_${orderId}_${idx + 1}`,
        orderId,
        productId: p.product.id,
        productName: p.product.name,
        shopId: p.product.shopId,
        shopName: shop.name,
        unitPrice: p.product.price,
        quantity: p.qty,
        subtotal,
        deliveryStatus: (i > 35 ? 'pending_dispatch' : i > 20 ? 'shipped' : 'delivered') as 'pending_dispatch' | 'shipped' | 'delivered',
        deliveredAt: i <= 20 ? orderDate : undefined,
      };
    });

    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

    const shopSubtotals: Record<string, number> = {};
    for (const item of items) {
      shopSubtotals[item.shopId] = (shopSubtotals[item.shopId] || 0) + item.subtotal;
    }

    const gateways: ('stripe' | 'paypal' | 'flutterwave')[] = ['stripe', 'paypal', 'flutterwave'];
    const gateway = gateways[i % gateways.length];

    const order: Order = {
      id: orderId,
      guestSessionId,
      customerName: cust.name,
      customerEmail: cust.email,
      customerPhone: cust.phone,
      shippingAddress: `Plot ${12 + (i % 50)}, KG ${(i * 3) % 200} St`,
      city: cust.city,
      status: 'paid',
      totalAmount,
      gateway,
      paymentReference: `SIM_TXN_${gateway.toUpperCase()}_${84000 + i}`,
      webhookReceivedAt: orderDate,
      paidAt: orderDate,
      createdAt: orderDate,
      items,
      shopSubtotals,
    };

    orders.push(order);

    // Create payouts per shop: 95% net, 5% platform fee
    for (const [shopId, shopSubtotal] of Object.entries(shopSubtotals)) {
      const platformFee = Math.round(shopSubtotal * 0.05);
      const netAmount = shopSubtotal - platformFee;

      payouts.push({
        id: `pay_${orderId}_${shopId.replace('shop_', '')}`,
        orderId,
        shopId,
        grossAmount: shopSubtotal,
        platformFeeRate: 0.05,
        platformFeeAmount: platformFee,
        netAmount,
        status: 'processed',
        createdAt: orderDate,
      });
    }
  }

  const quotations: QuotationRequest[] = [
    {
      id: 'quote_101',
      shopId: 'shop_kigali_fresh',
      productId: 'prod_kf_coffee',
      productName: 'Gorilla Mountain Coffee (500g)',
      customerName: 'Kigali Marriott Hotel F&B',
      customerEmail: 'purchasing@kigalimarriott.demo',
      customerPhone: '+250 788 123 999',
      requestedQuantity: 150,
      notes: 'Need weekly supply of fresh Arabica beans for breakfast buffet and executive lounge.',
      status: 'quoted',
      offeredPrice: 7000, // discount from 7,900
      respondedAt: '2026-10-09T14:20:00Z',
      createdAt: '2026-10-08T10:00:00Z',
    },
    {
      id: 'quote_102',
      shopId: 'shop_kigali_fresh',
      productId: 'prod_kf_honey',
      productName: 'Pure Nyungwe Forest Forest Honey (500g)',
      customerName: 'Serena Wellness Spa',
      customerEmail: 'wellness@serenakigali.demo',
      customerPhone: '+250 788 444 888',
      requestedQuantity: 50,
      notes: 'Natural unpasteurized honey required for organic spa treatments and tea service.',
      status: 'pending',
      createdAt: '2026-10-11T16:45:00Z',
    },
  ];

  const purchaseRequests: PurchaseRequest[] = [
    {
      id: 'pr_201',
      shopId: 'shop_kigali_fresh',
      supplierName: 'Musanze Highlands Coffee Cooperative',
      itemName: 'Raw Green Bourbon Arabica Grade A',
      quantity: 500,
      estimatedCost: 2800000,
      status: 'approved',
      notes: 'Procure before end of Q3 crop season for dry milling in Gikondo.',
      createdAt: '2026-10-05T09:00:00Z',
    },
    {
      id: 'pr_202',
      shopId: 'shop_kigali_fresh',
      supplierName: 'Sina Gerard Urwibutso Ltd',
      itemName: 'Akabanga Yellow Habanero 100ml Cartons',
      quantity: 200,
      estimatedCost: 380000,
      status: 'submitted',
      notes: 'Restock Kimironko warehouse ahead of weekend demand.',
      createdAt: '2026-10-10T11:15:00Z',
    },
  ];

  return {
    shops,
    products,
    orders,
    payouts,
    quotations,
    purchaseRequests,
  };
}
