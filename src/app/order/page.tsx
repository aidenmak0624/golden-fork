'use client';

/**
 * Customer Ordering Page
 *
 * A beautiful, modern menu browsing and ordering interface.
 * Includes the AI Chat Widget for recommendations.
 */

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ChatWidget from '../../components/chat/ChatWidget';
import {
  ShoppingCart, Plus, Minus, Search, X, Loader2, CreditCard,
  Utensils, Leaf, Flame, ChevronRight, Sparkles
} from 'lucide-react';
import { cn } from '../../lib/utils';

// Menu categories with colors — matches all categories in sample-menu.json
const menuCategories = [
  { id: 'all', name: 'All Items', emoji: '✨', color: 'from-violet-500 to-purple-500' },
  { id: 'appetizers', name: 'Starters', emoji: '🥗', color: 'from-emerald-500 to-teal-500' },
  { id: 'salads', name: 'Salads', emoji: '🥬', color: 'from-lime-500 to-green-500' },
  { id: 'mains', name: 'Mains', emoji: '🍽️', color: 'from-amber-500 to-orange-500' },
  { id: 'steaks', name: 'Steaks', emoji: '🥩', color: 'from-red-600 to-rose-600' },
  { id: 'seafood', name: 'Seafood', emoji: '🦞', color: 'from-blue-500 to-cyan-500' },
  { id: 'vegetarian', name: 'Vegetarian', emoji: '🌱', color: 'from-green-500 to-emerald-500' },
  { id: 'pasta', name: 'Pasta', emoji: '🍝', color: 'from-rose-500 to-pink-500' },
  { id: 'sides', name: 'Sides', emoji: '🍟', color: 'from-yellow-500 to-amber-500' },
  { id: 'desserts', name: 'Desserts', emoji: '🍰', color: 'from-fuchsia-500 to-pink-500' },
  { id: 'wine', name: 'Wine', emoji: '🍷', color: 'from-purple-600 to-indigo-600' },
  { id: 'beverages', name: 'Drinks', emoji: '🥤', color: 'from-sky-500 to-blue-500' },
];

// Customization option types
export interface CustomizationOption {
  label: string;
  choices: string[];
  required?: boolean;
}

export interface MenuItemData {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  tags: string[];
  image: string;
  customizations?: CustomizationOption[];
}

// Full menu — synced with sample-menu.json so chatbot recommendations always match
const menuItems: MenuItemData[] = [
  // Appetizers
  { id: 'app-001', name: 'Crispy Calamari', category: 'appetizers', price: 14.99, description: 'Tender calamari rings lightly breaded and fried to golden perfection, served with house-made marinara and lemon aioli', tags: [], image: '🦑' },
  { id: 'app-002', name: 'Burrata & Heirloom Tomatoes', category: 'appetizers', price: 16.99, description: 'Creamy imported burrata with vine-ripened heirloom tomatoes, fresh basil, and aged balsamic reduction', tags: ['GF', 'V'], image: '🧀' },
  { id: 'app-003', name: 'Thai Chicken Lettuce Wraps', category: 'appetizers', price: 13.99, description: 'Spiced minced chicken with water chestnuts, ginger, and Thai chilies in crisp butter lettuce cups', tags: ['GF', 'Spicy'], image: '🥬' },
  // Salads
  { id: 'app-004', name: 'Roasted Beet & Goat Cheese Salad', category: 'salads', price: 12.99, description: 'Oven-roasted golden and red beets with creamy goat cheese, candied walnuts, arugula, and honey-citrus vinaigrette', tags: ['GF', 'V'], image: '🥗' },
  { id: 'sal-001', name: 'Classic Caesar Salad', category: 'salads', price: 11.99, description: 'Crisp romaine hearts tossed in house-made Caesar dressing with shaved Parmesan and garlic croutons', tags: ['V'], image: '🥗',
    customizations: [{ label: 'Add Protein', choices: ['None', 'Grilled Chicken (+$6)', 'Salmon (+$9)'], required: false }]
  },
  // Mains
  { id: 'main-001', name: 'Pan-Seared Duck Breast', category: 'mains', price: 38.99, description: 'Perfectly rendered duck breast with crispy skin over wild mushroom risotto with cherry port reduction', tags: ['GF'], image: '🦆',
    customizations: [{ label: 'Doneness', choices: ['Medium Rare (Recommended)', 'Medium', 'Medium Well'], required: true }]
  },
  // Steaks
  { id: 'main-002', name: 'Grilled Ribeye Steak', category: 'steaks', price: 52.99, description: '16oz USDA Prime dry-aged 28 days, grilled to your preference with roasted seasonal vegetables', tags: ['GF'], image: '🥩',
    customizations: [
      { label: 'Doneness', choices: ['Rare', 'Medium Rare', 'Medium', 'Medium Well', 'Well Done'], required: true },
      { label: 'Sauce', choices: ['No Sauce', 'Peppercorn Sauce', 'Béarnaise', 'Chimichurri'], required: false },
      { label: 'Side', choices: ['Roasted Vegetables (Included)', 'Truffle Fries (+$4)', 'Grilled Broccolini (+$3)'], required: false },
    ]
  },
  // Seafood
  { id: 'main-003', name: 'Herb-Crusted Salmon', category: 'seafood', price: 34.99, description: 'Atlantic salmon with a Dijon-herb crust, served over lemon quinoa with grilled asparagus and dill cream', tags: ['GF'], image: '🐟',
    customizations: [{ label: 'Doneness', choices: ['Medium (Recommended)', 'Medium Well', 'Well Done'], required: true }]
  },
  { id: 'main-004', name: 'Lobster Risotto', category: 'seafood', price: 44.99, description: 'Creamy Arborio rice with butter-poached Maine lobster tail, mascarpone, and fresh chives', tags: ['GF'], image: '🦞' },
  // Vegetarian
  { id: 'main-005', name: 'Grilled Portobello Stack', category: 'vegetarian', price: 18.99, description: 'Marinated portobello cap stacked with roasted red peppers, caramelized onions, and herbed goat cheese on brioche', tags: ['V'], image: '🍄' },
  { id: 'main-006', name: 'Thai Red Curry Vegetables', category: 'vegetarian', price: 19.99, description: 'Seasonal vegetables simmered in aromatic red curry coconut milk with jasmine rice and crispy shallots', tags: ['GF', 'V', 'VG', 'Spicy'], image: '🍛',
    customizations: [{ label: 'Spice Level', choices: ['Mild', 'Medium', 'Hot', 'Extra Hot'], required: false }]
  },
  // Pasta
  { id: 'main-007', name: 'Spaghetti Carbonara', category: 'pasta', price: 24.99, description: 'House-made spaghetti with crispy guanciale, egg yolk, Pecorino Romano, and fresh cracked black pepper', tags: [], image: '🍝',
    customizations: [{ label: 'Egg Preparation', choices: ['Traditional (Creamy)', 'Extra Runny Yolk', 'Fully Cooked'], required: false }]
  },
  { id: 'main-008', name: 'Wild Mushroom Fettuccine', category: 'pasta', price: 26.99, description: 'Fresh fettuccine with porcini, chanterelles, shiitake, truffle cream, and shaved Parmigiano-Reggiano', tags: ['V'], image: '🍄' },
  // Sides
  { id: 'side-001', name: 'Truffle Parmesan Fries', category: 'sides', price: 9.99, description: 'Crispy hand-cut fries tossed with white truffle oil, grated Parmesan, and fresh herbs', tags: ['GF', 'V'], image: '🍟' },
  { id: 'side-002', name: 'Grilled Broccolini', category: 'sides', price: 8.99, description: 'Tender broccolini charred on the grill with garlic, lemon zest, and chili flakes', tags: ['GF', 'V', 'VG', 'Spicy'], image: '🥦' },
  // Desserts
  { id: 'des-001', name: 'Chocolate Lava Cake', category: 'desserts', price: 12.99, description: 'Warm dark chocolate cake with a molten center, served with vanilla bean ice cream and fresh berries', tags: ['V'], image: '🍫' },
  { id: 'des-002', name: 'Crème Brûlée', category: 'desserts', price: 10.99, description: 'Classic vanilla bean custard with a caramelized sugar crust, served with fresh seasonal berries', tags: ['GF', 'V'], image: '🍮' },
  { id: 'des-003', name: 'Vegan Coconut Panna Cotta', category: 'desserts', price: 9.99, description: 'Silky coconut milk panna cotta topped with mango coulis and toasted coconut flakes', tags: ['GF', 'V', 'VG'], image: '🥥' },
  // Wine
  { id: 'wine-001', name: 'House Cabernet Sauvignon', category: 'wine', price: 12.99, description: 'Full-bodied California Cabernet with notes of black cherry, cassis, and vanilla oak', tags: ['GF', 'V', 'VG'], image: '🍷' },
  { id: 'wine-002', name: 'Sonoma Chardonnay', category: 'wine', price: 13.99, description: 'Elegant Chardonnay with bright citrus, green apple, and subtle oak undertones', tags: ['GF', 'V', 'VG'], image: '🥂' },
  // Beverages
  { id: 'bev-001', name: 'Fresh Squeezed Lemonade', category: 'beverages', price: 4.99, description: 'House-made lemonade with fresh lemons and a hint of mint', tags: ['GF', 'V', 'VG'], image: '🍋' },
  { id: 'bev-002', name: 'Thai Iced Tea', category: 'beverages', price: 5.99, description: 'Traditional Thai black tea with sweetened condensed milk, served over ice', tags: ['V'], image: '🧋' },
];

interface CartItem {
  menuItem: MenuItemData;
  quantity: number;
  customizations?: Record<string, string>;
}

const tagConfig: Record<string, { label: string; color: string; icon?: React.ReactNode }> = {
  GF: { label: 'Gluten-Free', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  V: { label: 'Vegetarian', color: 'bg-green-100 text-green-700 border-green-200' },
  VG: { label: 'Vegan', color: 'bg-teal-100 text-teal-700 border-teal-200', icon: <Leaf className="h-3 w-3" /> },
  Spicy: { label: 'Spicy', color: 'bg-red-100 text-red-700 border-red-200', icon: <Flame className="h-3 w-3" /> },
  DF: { label: 'Dairy-Free', color: 'bg-blue-100 text-blue-700 border-blue-200' },
};

function OrderPageContent() {
  const searchParams = useSearchParams();
  const tableParam = searchParams.get('table') || undefined;
  const [selectedTable, setSelectedTable] = useState<string | undefined>(tableParam);
  const tableId = selectedTable;

  const [activeCategory, setActiveCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  // Customization modal state (must be before early return — React hooks rules)
  const [customizingItem, setCustomizingItem] = useState<MenuItemData | null>(null);
  const [customizationSelections, setCustomizationSelections] = useState<Record<string, string>>({});

  // Show table selection if no table ID provided
  if (!tableId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <div className="text-4xl mb-4">🍽️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to The Golden Fork</h1>
          <p className="text-gray-500 mb-6">Please enter your table number to start ordering</p>
          <div className="flex items-center gap-3 mb-6">
            <input
              type="number"
              min="1"
              placeholder="Table #"
              className="flex-1 text-center text-2xl font-bold py-3 px-4 rounded-xl border-2 border-amber-200 focus:border-amber-500 focus:outline-none bg-amber-50 text-amber-700 placeholder-amber-300"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val && Number(val) > 0) setSelectedTable(val);
                }
              }}
              autoFocus
            />
            <button
              onClick={() => {
                const input = document.querySelector('input[type="number"]') as HTMLInputElement;
                const val = input?.value.trim();
                if (val && Number(val) > 0) setSelectedTable(val);
              }}
              className="py-3 px-6 rounded-xl bg-amber-600 text-white font-bold text-lg hover:bg-amber-700 transition-colors"
            >
              Go
            </button>
          </div>
          <p className="text-xs text-gray-400">
            Normally this is set automatically via your table&apos;s QR code
          </p>
        </div>
      </div>
    );
  }

  // Filter menu items
  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Cart functions
  const addToCart = (item: MenuItemData, customizations?: Record<string, string>) => {
    // If item has required customizations and none provided, open customization modal
    if (item.customizations && item.customizations.some(c => c.required) && !customizations) {
      setCustomizingItem(item);
      setCustomizationSelections({});
      return;
    }
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { menuItem: item, quantity: 1, customizations }];
    });
  };

  const confirmCustomization = () => {
    if (customizingItem) {
      setCart((prev) => {
        const existing = prev.find((c) => c.menuItem.id === customizingItem.id);
        if (existing) {
          return prev.map((c) =>
            c.menuItem.id === customizingItem.id ? { ...c, quantity: c.quantity + 1 } : c
          );
        }
        return [...prev, { menuItem: customizingItem, quantity: 1, customizations: customizationSelections }];
      });
      setCustomizingItem(null);
      setCustomizationSelections({});
    }
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map((c) =>
          c.menuItem.id === itemId ? { ...c, quantity: c.quantity - 1 } : c
        );
      }
      return prev.filter((c) => c.menuItem.id !== itemId);
    });
  };

  const getCartTotal = () =>
    cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);

  const getCartCount = () => cart.reduce((sum, item) => sum + item.quantity, 0);

  // Handle Stripe checkout
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setIsCheckingOut(true);
    setCheckoutError(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((item) => ({
            id: item.menuItem.id,
            name: item.menuItem.name,
            price: item.menuItem.price,
            quantity: item.quantity,
            description: item.menuItem.description,
            notes: item.customizations
              ? Object.entries(item.customizations).map(([k, v]) => `${k}: ${v}`).join(', ')
              : undefined,
          })),
          tableId: tableId || 'unknown',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Checkout failed');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setCheckoutError(
        error instanceof Error ? error.message : 'Failed to start checkout'
      );
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Handle AI suggestion add to cart — match by ID first, then by name (fuzzy fallback)
  const handleAISuggestion = (item: { id: string; name: string; price: number }) => {
    let menuItem = menuItems.find((m) => m.id === item.id);
    if (!menuItem) {
      // Fallback: match by name (case-insensitive, partial match)
      menuItem = menuItems.find(
        (m) => m.name.toLowerCase() === item.name.toLowerCase()
      );
    }
    if (!menuItem) {
      // Last resort: partial name match
      menuItem = menuItems.find(
        (m) =>
          m.name.toLowerCase().includes(item.name.toLowerCase()) ||
          item.name.toLowerCase().includes(m.name.toLowerCase())
      );
    }
    if (menuItem) addToCart(menuItem);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-white">
      {/* Hero Header */}
      <header className="relative overflow-hidden bg-gradient-to-r from-amber-600 via-orange-500 to-red-500">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-yellow-300/20 rounded-full blur-2xl" />
        </div>

        <div className="relative px-4 pt-6 pb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">The Golden Fork</h1>
              <p className="text-amber-100 text-sm font-medium">
                {tableId ? `✨ Table ${tableId}` : '✨ Fine Dining Experience'}
              </p>
            </div>
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center justify-center h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all active:scale-95"
            >
              <ShoppingCart className="h-5 w-5" />
              {getCartCount() > 0 && (
                <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-amber-600 text-xs font-bold shadow-lg">
                  {getCartCount()}
                </span>
              )}
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-300" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes, ingredients..."
              className="w-full rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 pl-12 pr-4 py-3.5 text-white placeholder-amber-200 focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="relative px-4 pb-4">
          <div className="flex overflow-x-auto gap-2 scrollbar-hide -mx-4 px-4">
            {menuCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setSearchQuery('');
                }}
                className={cn(
                  'flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95',
                  activeCategory === cat.id
                    ? 'bg-white text-amber-700 shadow-lg'
                    : 'bg-white/20 text-white hover:bg-white/30'
                )}
              >
                <span className="text-lg">{cat.emoji}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Menu Items */}
      <main className="px-4 py-6 pb-32">
        {/* Section header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">
            {activeCategory === 'all'
              ? 'All Dishes'
              : menuCategories.find((c) => c.id === activeCategory)?.name}
          </h2>
          <span className="text-sm text-gray-500">{filteredItems.length} items</span>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500">No items found matching "{searchQuery}"</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const inCart = cart.find((c) => c.menuItem.id === item.id);
              const categoryColor = menuCategories.find((c) => c.id === item.category)?.color || 'from-gray-400 to-gray-500';

              return (
                <div
                  key={item.id}
                  className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                >
                  {/* Image/Emoji placeholder */}
                  <div className={cn(
                    'h-32 bg-gradient-to-br flex items-center justify-center',
                    categoryColor
                  )}>
                    <span className="text-5xl filter drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
                      {item.image}
                    </span>
                  </div>

                  <div className="p-4">
                    {/* Title and price */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-gray-900 leading-tight">{item.name}</h3>
                      <span className="flex-shrink-0 text-lg font-bold text-amber-600">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                      {item.description}
                    </p>

                    {/* Tags */}
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {item.tags.map((tag) => {
                          const config = tagConfig[tag];
                          return (
                            <span
                              key={tag}
                              className={cn(
                                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
                                config?.color
                              )}
                            >
                              {config?.icon}
                              {tag}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Customization tags */}
                    {item.customizations && item.customizations.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {item.customizations.map((c) => (
                          <span key={c.label} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200">
                            ⚙️ {c.label}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Add button */}
                    {inCart ? (
                      <div className="flex items-center justify-between bg-amber-50 rounded-xl p-1">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="h-9 w-9 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors active:scale-95"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="font-bold text-amber-700 text-lg">{inCart.quantity}</span>
                        <button
                          onClick={() => addToCart(item)}
                          className="h-9 w-9 rounded-lg bg-amber-500 shadow-sm flex items-center justify-center text-white hover:bg-amber-600 transition-colors active:scale-95"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          if (item.customizations && item.customizations.length > 0) {
                            setCustomizingItem(item);
                            setCustomizationSelections({});
                          } else {
                            addToCart(item);
                          }
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 hover:scale-[1.02] transition-all active:scale-95"
                      >
                        <Plus className="h-4 w-4" />
                        {item.customizations && item.customizations.length > 0 ? 'Customize & Add' : 'Add to Order'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Customization Modal */}
      {customizingItem && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fadeIn"
            onClick={() => setCustomizingItem(null)}
          />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden animate-slideIn">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">{customizingItem.name}</h3>
                  <p className="text-amber-100 text-sm">${customizingItem.price.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => setCustomizingItem(null)}
                  className="p-2 rounded-xl hover:bg-white/20 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Customization Options */}
            <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
              {customizingItem.customizations?.map((opt) => (
                <div key={opt.label}>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    {opt.label}
                    {opt.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {opt.choices.map((choice) => (
                      <button
                        key={choice}
                        onClick={() =>
                          setCustomizationSelections((prev) => ({
                            ...prev,
                            [opt.label]: choice,
                          }))
                        }
                        className={cn(
                          'px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-all active:scale-95',
                          customizationSelections[opt.label] === choice
                            ? 'border-amber-500 bg-amber-50 text-amber-700'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        )}
                      >
                        {choice}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Add to Order Button */}
            <div className="border-t border-gray-100 p-5 bg-gray-50">
              <button
                onClick={confirmCustomization}
                disabled={
                  customizingItem.customizations?.some(
                    (c) => c.required && !customizationSelections[c.label]
                  ) ?? false
                }
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-lg shadow-amber-500/25 hover:shadow-xl hover:scale-[1.02] transition-all active:scale-95 disabled:from-gray-300 disabled:to-gray-400 disabled:shadow-none disabled:cursor-not-allowed"
              >
                <Plus className="inline h-4 w-4 mr-2" />
                Add to Order
              </button>
            </div>
          </div>
        </>
      )}

      {/* Floating Cart Summary — positioned above the chatbot button */}
      {getCartCount() > 0 && !isCartOpen && (
        <div className="fixed bottom-28 left-4 right-20 z-40 animate-slideIn">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-500 text-white shadow-xl shadow-amber-500/30 hover:shadow-2xl hover:scale-[1.02] transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/20">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-sm text-amber-100">{getCartCount()} items</p>
                <p className="font-bold">${getCartTotal().toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 font-semibold">
              View Cart
              <ChevronRight className="h-5 w-5" />
            </div>
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fadeIn"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl animate-slideIn">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Your Order</h2>
                  <p className="text-sm text-gray-500">{getCartCount()} items</p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto p-5">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
                      <ShoppingCart className="h-10 w-10 text-amber-300" />
                    </div>
                    <p className="text-gray-500 mb-4">Your cart is empty</p>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="px-6 py-2 rounded-xl bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors"
                    >
                      Browse Menu
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div
                        key={item.menuItem.id}
                        className="flex items-center gap-4 p-3 rounded-xl bg-gray-50"
                      >
                        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-2xl">
                          {item.menuItem.image}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{item.menuItem.name}</p>
                          <p className="text-sm text-amber-600 font-medium">
                            ${item.menuItem.price.toFixed(2)}
                          </p>
                          {item.customizations && Object.keys(item.customizations).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Object.entries(item.customizations).map(([key, val]) => (
                                <span key={key} className="text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
                                  {val}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeFromCart(item.menuItem.id)}
                            className="h-8 w-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-100"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => addToCart(item.menuItem)}
                            className="h-8 w-8 rounded-lg bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {cart.length > 0 && (
                <div className="border-t border-gray-100 p-5 space-y-4 bg-gray-50">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Subtotal</span>
                      <span>${getCartTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Tax (8.75%)</span>
                      <span>${(getCartTotal() * 0.0875).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-200">
                      <span>Total</span>
                      <span className="text-amber-600">${(getCartTotal() * 1.0875).toFixed(2)}</span>
                    </div>
                  </div>

                  {checkoutError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                      {checkoutError}
                    </div>
                  )}

                  <button
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-lg shadow-amber-500/25 hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:from-gray-400 disabled:to-gray-500 disabled:shadow-none disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                    {isCheckingOut ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5" />
                        Pay ${(getCartTotal() * 1.0875).toFixed(2)}
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs text-gray-500 flex items-center justify-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Secure payment powered by Stripe
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* AI Chat Widget */}
      <ChatWidget
        tableId={tableId}
        restaurantName="The Golden Fork"
        onAddToCart={handleAISuggestion}
      />
    </div>
  );
}

// Loading fallback component
function OrderPageLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-white flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-amber-500 mx-auto mb-4" />
        <p className="text-gray-600">Loading menu...</p>
      </div>
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function OrderPage() {
  return (
    <Suspense fallback={<OrderPageLoading />}>
      <OrderPageContent />
    </Suspense>
  );
}
