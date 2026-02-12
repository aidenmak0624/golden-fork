/**
 * Type definitions for the Restaurant Menu System
 */

// ============================================
// MENU ITEM TYPES
// ============================================

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  ingredients: string[];
  allergens: string[];

  // Dietary flags
  isGlutenFree?: boolean;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isDairyFree?: boolean;
  isSpicy?: boolean;
  containsNuts?: boolean;

  // Optional enrichment
  pairings?: string[]; // Wine, sides, etc.
  chefNote?: string;
  imageUrl?: string;
  preparationTime?: number; // in minutes
  calories?: number;
  isAvailable?: boolean;

  // Metadata
  createdAt?: Date;
  updatedAt?: Date;
}

export type MenuCategory =
  | 'appetizers'
  | 'salads'
  | 'soups'
  | 'mains'
  | 'seafood'
  | 'steaks'
  | 'pasta'
  | 'vegetarian'
  | 'sides'
  | 'desserts'
  | 'beverages'
  | 'wine'
  | 'cocktails'
  | 'kids';

// ============================================
// RAG / EMBEDDING TYPES
// ============================================

export interface MenuChunk {
  id: string;
  text: string;
  metadata: MenuChunkMetadata;
}

export interface MenuChunkMetadata {
  [key: string]: string | number | boolean | string[] | null | undefined; // Index signature for Pinecone RecordMetadata compatibility
  itemId: string;
  name: string;
  category: string;
  price: number;
  isGlutenFree: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  isDairyFree: boolean;
  isSpicy: boolean;
  containsNuts: boolean;
  allergens: string[];
  fullItem: string; // JSON stringified MenuItem
}

export interface RetrievedContext {
  item: MenuItem;
  score: number; // Similarity score from vector search
}

// ============================================
// CHATBOT TYPES
// ============================================

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface ChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
  tableId?: string;
  sessionId?: string;

  // Optional filters for retrieval
  dietaryFilters?: {
    glutenFree?: boolean;
    vegetarian?: boolean;
    vegan?: boolean;
    dairyFree?: boolean;
    noNuts?: boolean;
  };
}

export interface ChatResponse {
  message: string;
  retrievedItems?: MenuItem[]; // Items used for context
  suggestedItems?: MenuItem[]; // Explicit recommendations
  processingTimeMs?: number;
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface ChatAnalytics {
  id: string;
  sessionId: string;
  tableId?: string;
  userMessage: string;
  assistantResponse: string;
  retrievedItemIds: string[];
  responseTimeMs: number;
  timestamp: Date;

  // For trend analysis
  detectedIntent?: ChatIntent;
  mentionedDietaryNeeds?: string[];
  requestedCategory?: string;
}

export type ChatIntent =
  | 'recommendation' // "What should I get?"
  | 'dietary_inquiry' // "What's gluten-free?"
  | 'item_details' // "Tell me about the steak"
  | 'price_inquiry' // "How much is..."
  | 'pairing_request' // "What wine goes with..."
  | 'availability' // "Do you have..."
  | 'general_question' // Everything else
  | 'off_topic'; // Not food related

// ============================================
// ORDER TYPES (for context)
// ============================================

export interface OrderItem {
  menuItemId: string;
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
  addOns?: string[];
}

export interface Order {
  id: string;
  tableId: string;
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number;
  tax: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'paid'
  | 'cancelled';
