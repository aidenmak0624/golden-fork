'use client';

/**
 * Customer Chat Widget
 *
 * A vibrant, colorful floating chat interface for the AI menu assistant.
 * Features built-in cart functionality and smooth animations.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Send, X, Sparkles, Loader2, ChefHat, User, Plus,
  Utensils, ShoppingBag, Check, Trash2, Minus,
  Bell, Star, MessageCircle
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestedItems?: SuggestedItem[];
}

interface SuggestedItem {
  id: string;
  name: string;
  price: number;
  description: string;
}

interface CartItem extends SuggestedItem {
  quantity: number;
}

interface ChatWidgetProps {
  tableId?: string;
  restaurantName?: string;
  onAddToCart?: (item: SuggestedItem) => void;
  onCheckout?: (items: CartItem[]) => void;
}

export default function ChatWidget({
  tableId,
  restaurantName = 'our restaurant',
  onAddToCart,
  onCheckout,
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const [isClosing, setIsClosing] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [addedItemId, setAddedItemId] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [serverCalled, setServerCalled] = useState(false);
  const [serverCallLoading, setServerCallLoading] = useState(false);
  const [rateLimitRemaining, setRateLimitRemaining] = useState<number | null>(null);
  const [rateLimitTotal, setRateLimitTotal] = useState<number>(50);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !showCart) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, showCart]);

  // Add welcome message when first opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `Welcome! 🍽️ I'm your personal menu guide. Whether you're craving something specific or need inspiration, I'm here to help you discover dishes you'll love. What sounds good today?`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, messages.length]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      setShowCart(false);
    }, 200);
  };

  const addToCart = (item: SuggestedItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });

    // Show checkmark animation
    setAddedItemId(item.id);
    setTimeout(() => setAddedItemId(null), 1500);

    // Call external handler if provided
    if (onAddToCart) {
      onAddToCart(item);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          tableId,
          sessionId,
          conversationHistory: messages
            .filter((m) => m.id !== 'welcome')
            .map((m) => ({
              role: m.role,
              content: m.content,
            })),
        }),
      });

      const data = await response.json();

      // Handle rate limiting
      if (response.status === 429) {
        const minutes = Math.ceil((data.resetInSeconds || 60) / 60);
        setRateLimitRemaining(0);
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: `⏳ You've reached the message limit (${data.limit || 50} per hour). Your quota resets in about ${minutes} minute${minutes !== 1 ? 's' : ''}. In the meantime, feel free to browse the menu or ask your server!`,
            timestamp: new Date(),
          },
        ]);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      // Track remaining messages
      if (data.remaining !== undefined) {
        setRateLimitRemaining(data.remaining);
        setRateLimitTotal(data.limit || 50);
      }

      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        suggestedItems: data.suggestedItems,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: "Oops! I'm having a moment — let me try that again. Could you repeat your question?",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Call Server
  const callServer = async () => {
    if (serverCallLoading) return;
    setServerCallLoading(true);

    try {
      await fetch('/api/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: tableId || 'unknown',
          type: 'call_server',
          message: 'Customer is requesting server assistance',
        }),
      });

      setServerCalled(true);
      setTimeout(() => setServerCalled(false), 5000);

      // Add a system message to chat
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: '🔔 Your server has been notified and will be with you shortly! Is there anything else I can help you with in the meantime?',
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error('Failed to call server:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: "I couldn't reach the server system right now. Please try again or flag down a staff member directly.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setServerCallLoading(false);
    }
  };

  // Submit Feedback
  const submitFeedback = async () => {
    if (feedbackRating === 0) return;

    try {
      await fetch('/api/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: tableId || 'unknown',
          rating: feedbackRating,
          comment: feedbackComment || undefined,
        }),
      });

      setFeedbackSubmitted(true);
      setTimeout(() => {
        setShowFeedback(false);
        setFeedbackSubmitted(false);
        setFeedbackRating(0);
        setFeedbackComment('');
      }, 2500);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const quickPrompts = [
    { icon: '🌾', label: "Gluten-free", color: 'from-emerald-400 to-teal-500' },
    { icon: '👨‍🍳', label: "Chef's picks", color: 'from-purple-400 to-indigo-500' },
    { icon: '🍷', label: "Wine pairings", color: 'from-rose-400 to-pink-500' },
    { icon: '🌱', label: "Vegetarian", color: 'from-lime-400 to-green-500' },
  ];

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 group"
          aria-label="Open menu assistant"
        >
          {/* Animated gradient ring */}
          <span className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-500 animate-spin-slow opacity-70 blur-md" />
          <span className="absolute inset-1 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-500 animate-ping opacity-30" />

          {/* Button */}
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 via-fuchsia-600 to-orange-500 text-white shadow-xl shadow-fuchsia-500/40 transition-all duration-300 group-hover:scale-110 group-active:scale-95">
            <ChefHat className="h-7 w-7" />
          </span>

          {/* Cart badge */}
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-emerald-400 to-cyan-500 text-xs font-bold text-white shadow-lg animate-bounce">
              {cartCount}
            </span>
          )}

          {/* Tooltip */}
          <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-medium text-white opacity-0 shadow-xl transition-all group-hover:opacity-100 group-hover:mr-5">
            🍽️ Need help with the menu?
            <span className="absolute left-full top-1/2 -translate-y-1/2 border-8 border-transparent border-l-fuchsia-600" />
          </span>
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div
          className={`fixed inset-0 z-50 flex flex-col sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[680px] sm:w-[440px] overflow-hidden transition-all duration-300 ${
            isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
        >
          {/* Colorful Frame */}
          <div className="absolute inset-0 rounded-none sm:rounded-[28px] bg-gradient-to-br from-violet-500 via-fuchsia-500 via-50% to-orange-400 p-[3px] shadow-2xl shadow-fuchsia-500/30">
            <div className="h-full w-full rounded-none sm:rounded-[25px] bg-white overflow-hidden flex flex-col">

              {/* Header */}
              <div className="relative overflow-hidden">
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-orange-500 animate-gradient-x" />

                {/* Decorative blobs */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                  <div className="absolute -left-10 top-0 h-32 w-32 rounded-full bg-cyan-400/20 blur-xl" />
                  <div className="absolute right-20 bottom-0 h-20 w-20 rounded-full bg-yellow-400/20 blur-lg" />
                </div>

                {/* Header content */}
                <div className="relative flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm ring-2 ring-white/30">
                        <Utensils className="h-6 w-6 text-white" />
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 ring-2 ring-white">
                        <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white tracking-tight">Menu Assistant</h3>
                      <p className="text-sm text-white/80 font-medium">
                        {tableId ? `✨ Table ${tableId}` : '✨ Online & ready to help'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Call Server button */}
                    <button
                      onClick={callServer}
                      disabled={serverCallLoading || serverCalled}
                      className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                        serverCalled
                          ? 'bg-emerald-400 text-white'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                      title="Call Server"
                    >
                      {serverCallLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : serverCalled ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Bell className="h-5 w-5" />
                      )}
                    </button>
                    {/* Feedback button */}
                    <button
                      onClick={() => { setShowFeedback(!showFeedback); setShowCart(false); }}
                      className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                        showFeedback
                          ? 'bg-white text-fuchsia-600'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                      title="Leave Feedback"
                    >
                      <Star className="h-5 w-5" />
                    </button>
                    {/* Cart button */}
                    <button
                      onClick={() => { setShowCart(!showCart); setShowFeedback(false); }}
                      className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                        showCart
                          ? 'bg-white text-fuchsia-600'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      <ShoppingBag className="h-5 w-5" />
                      {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-emerald-400 to-cyan-500 text-[10px] font-bold text-white">
                          {cartCount}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={handleClose}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white transition-all hover:bg-white/30 active:scale-95"
                      aria-label="Close chat"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Cart Panel */}
              {showCart && (
                <div className="flex-1 flex flex-col bg-gradient-to-b from-slate-50 to-white overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-5">
                    {cart.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-10">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center mb-4">
                          <ShoppingBag className="h-10 w-10 text-fuchsia-400" />
                        </div>
                        <h4 className="text-lg font-semibold text-slate-700 mb-2">Your cart is empty</h4>
                        <p className="text-slate-500 text-sm max-w-[200px]">
                          Ask me for recommendations and add dishes you love!
                        </p>
                        <button
                          onClick={() => setShowCart(false)}
                          className="mt-6 px-6 py-2.5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-medium text-sm shadow-lg shadow-fuchsia-500/30 hover:shadow-xl transition-all"
                        >
                          Browse Menu
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                          Your Order ({cartCount} {cartCount === 1 ? 'item' : 'items'})
                        </h4>
                        {cart.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                              <p className="text-sm text-fuchsia-600 font-medium">${item.price.toFixed(2)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(item.id, -1)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-600 transition-colors"
                              >
                                {item.quantity === 1 ? <Trash2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                              </button>
                              <span className="w-8 text-center font-semibold text-slate-700">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, 1)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:from-violet-600 hover:to-fuchsia-600 transition-colors"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {cart.length > 0 && (
                    <div className="border-t border-slate-100 p-5 bg-white">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-slate-600 font-medium">Total</span>
                        <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                          ${cartTotal.toFixed(2)}
                        </span>
                      </div>
                      <button
                        onClick={() => onCheckout?.(cart)}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-500 text-white font-semibold shadow-lg shadow-fuchsia-500/30 hover:shadow-xl hover:scale-[1.02] transition-all active:scale-[0.98]"
                      >
                        Proceed to Checkout ✨
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Feedback Panel */}
              {showFeedback && (
                <div className="flex-1 flex flex-col bg-gradient-to-b from-slate-50 to-white overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-5">
                    {feedbackSubmitted ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-10">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center mb-4">
                          <Check className="h-10 w-10 text-emerald-500" />
                        </div>
                        <h4 className="text-lg font-semibold text-slate-700 mb-2">Thank You!</h4>
                        <p className="text-slate-500 text-sm max-w-[240px]">
                          Your feedback helps us improve. We appreciate you dining with us!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="text-center">
                          <h4 className="text-lg font-semibold text-slate-800 mb-2">
                            How was your experience?
                          </h4>
                          <p className="text-sm text-slate-500">
                            We'd love to hear your thoughts
                          </p>
                        </div>

                        {/* Star Rating */}
                        <div className="flex items-center justify-center gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setFeedbackRating(star)}
                              className={`text-3xl transition-all hover:scale-125 active:scale-95 ${
                                star <= feedbackRating
                                  ? 'text-amber-400 drop-shadow-md'
                                  : 'text-slate-200 hover:text-amber-300'
                              }`}
                            >
                              ★
                            </button>
                          ))}
                        </div>

                        {feedbackRating > 0 && (
                          <p className="text-center text-sm font-medium text-slate-600">
                            {feedbackRating === 1 && '😞 Sorry to hear that'}
                            {feedbackRating === 2 && '😐 We can do better'}
                            {feedbackRating === 3 && '🙂 Not bad!'}
                            {feedbackRating === 4 && '😊 Great!'}
                            {feedbackRating === 5 && '🤩 Amazing!'}
                          </p>
                        )}

                        {/* Comment */}
                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-2">
                            Any comments? (Optional)
                          </label>
                          <textarea
                            value={feedbackComment}
                            onChange={(e) => setFeedbackComment(e.target.value)}
                            placeholder="Tell us what you liked or how we can improve..."
                            className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:border-fuchsia-400 focus:outline-none focus:ring-4 focus:ring-fuchsia-400/20 resize-none"
                            rows={3}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {!feedbackSubmitted && feedbackRating > 0 && (
                    <div className="border-t border-slate-100 p-5 bg-white">
                      <button
                        onClick={submitFeedback}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-500 text-white font-semibold shadow-lg shadow-fuchsia-500/30 hover:shadow-xl hover:scale-[1.02] transition-all active:scale-[0.98]"
                      >
                        Submit Feedback ✨
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Messages */}
              {!showCart && !showFeedback && (
                <>
                  <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 bg-gradient-to-b from-slate-50/50 to-white">
                    {messages.map((message, index) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-fadeIn`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {/* Avatar */}
                        <div className={`flex-shrink-0 ${message.role === 'user' ? 'mt-auto' : ''}`}>
                          {message.role === 'assistant' ? (
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-fuchsia-500/30">
                              <ChefHat className="h-5 w-5 text-white" />
                            </div>
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 shadow-md">
                              <User className="h-5 w-5 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Message bubble */}
                        <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'} max-w-[80%]`}>
                          <div
                            className={`rounded-2xl px-4 py-3 shadow-sm ${
                              message.role === 'user'
                                ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white rounded-br-md shadow-lg shadow-fuchsia-500/20'
                                : 'bg-white text-slate-700 rounded-bl-md border border-slate-100 shadow-md'
                            }`}
                          >
                            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                              {message.content}
                            </p>
                          </div>

                          {/* Timestamp */}
                          <span className="mt-1.5 text-xs text-slate-400 px-1">
                            {formatTime(message.timestamp)}
                          </span>

                          {/* Suggested Items */}
                          {message.suggestedItems && message.suggestedItems.length > 0 && (
                            <div className="mt-3 space-y-3 w-full">
                              {message.suggestedItems.slice(0, 3).map((item, idx) => {
                                const colors = [
                                  'from-violet-500 to-purple-600',
                                  'from-fuchsia-500 to-pink-600',
                                  'from-orange-500 to-amber-600',
                                ];
                                const isAdded = addedItemId === item.id;

                                return (
                                  <div
                                    key={item.id}
                                    className="rounded-2xl bg-white p-4 shadow-lg border border-slate-100 hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-800 text-[15px]">
                                          {item.name}
                                        </p>
                                        <p className="text-sm text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                          {item.description}
                                        </p>
                                      </div>
                                      <div className="flex flex-col items-end gap-2.5">
                                        <span className={`text-lg font-bold bg-gradient-to-r ${colors[idx % 3]} bg-clip-text text-transparent`}>
                                          ${item.price.toFixed(2)}
                                        </span>
                                        <button
                                          onClick={() => addToCart(item)}
                                          disabled={isAdded}
                                          className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full transition-all shadow-md active:scale-95 ${
                                            isAdded
                                              ? 'bg-gradient-to-r from-emerald-400 to-cyan-500 text-white shadow-emerald-500/30'
                                              : `bg-gradient-to-r ${colors[idx % 3]} text-white hover:shadow-lg hover:scale-105`
                                          }`}
                                        >
                                          {isAdded ? (
                                            <>
                                              <Check className="h-4 w-4" />
                                              Added!
                                            </>
                                          ) : (
                                            <>
                                              <Plus className="h-4 w-4" />
                                              Add
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Loading indicator */}
                    {isLoading && (
                      <div className="flex gap-3 animate-fadeIn">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-fuchsia-500/30">
                          <ChefHat className="h-5 w-5 text-white" />
                        </div>
                        <div className="bg-white rounded-2xl rounded-bl-md px-5 py-3 shadow-md border border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quick prompts */}
                    {messages.length <= 1 && !isLoading && (
                      <div className="pt-2">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">
                          ✨ Quick questions
                        </p>
                        <div className="grid grid-cols-2 gap-2.5">
                          {quickPrompts.map((prompt) => (
                            <button
                              key={prompt.label}
                              onClick={() => {
                                setInputValue(prompt.label);
                                setTimeout(() => sendMessage(), 0);
                              }}
                              className={`flex items-center gap-2.5 rounded-xl bg-gradient-to-r ${prompt.color} px-4 py-3 text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg active:scale-95 shadow-md`}
                            >
                              <span className="text-lg">{prompt.icon}</span>
                              <span className="truncate">{prompt.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input area */}
                  <div className="border-t border-slate-100 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <input
                          ref={inputRef}
                          type="text"
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Ask about dishes, allergies, pairings..."
                          className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3.5 text-[15px] text-slate-700 placeholder-slate-400 transition-all focus:border-fuchsia-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-fuchsia-400/20"
                          disabled={isLoading || rateLimitRemaining === 0}
                        />
                      </div>
                      <button
                        onClick={sendMessage}
                        disabled={!inputValue.trim() || isLoading || rateLimitRemaining === 0}
                        className="flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-500 text-white shadow-lg shadow-fuchsia-500/30 transition-all hover:shadow-xl hover:scale-105 disabled:from-slate-300 disabled:via-slate-300 disabled:to-slate-400 disabled:shadow-none disabled:cursor-not-allowed active:scale-95"
                        aria-label="Send message"
                      >
                        {isLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <Sparkles className="h-3.5 w-3.5 text-fuchsia-500" />
                      <p className="text-xs text-slate-400 font-medium">
                        AI-powered • Always confirm allergies with staff
                      </p>
                      {rateLimitRemaining !== null && (
                        <span className={`text-xs font-medium ml-1 ${
                          rateLimitRemaining <= 3
                            ? 'text-amber-500'
                            : rateLimitRemaining === 0
                            ? 'text-red-500'
                            : 'text-slate-400'
                        }`}>
                          • {rateLimitRemaining}/{rateLimitTotal} left
                        </span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom styles */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </>
  );
}
