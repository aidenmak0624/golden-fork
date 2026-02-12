'use client';

import Link from 'next/link';
import { Utensils, ChefHat, Sparkles, ArrowRight, Star, Clock, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-200 rounded-full blur-3xl opacity-50" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-200 rounded-full blur-3xl opacity-50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-200 rounded-full blur-3xl opacity-30" />
        </div>

        {/* Content */}
        <div className="relative max-w-6xl mx-auto px-4 py-16 sm:py-24">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm mb-6">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium text-gray-700">AI-Powered Menu Experience</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 tracking-tight">
              The Golden{' '}
              <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
                Fork
              </span>
            </h1>

            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Experience fine dining reimagined. Browse our curated menu, get personalized
              recommendations from our AI assistant, and enjoy seamless ordering.
            </p>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-16">
            {[
              { icon: Star, label: '4.9 Rating', sublabel: '2,000+ reviews' },
              { icon: Clock, label: 'Fast Service', sublabel: '15 min avg.' },
              { icon: Users, label: '50k+', sublabel: 'Happy diners' },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/60 backdrop-blur-sm px-5 py-3 rounded-2xl shadow-sm">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center">
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{stat.label}</p>
                  <p className="text-sm text-gray-500">{stat.sublabel}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Interface Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Customer Card */}
            <Link
              href="/order"
              className="group relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] overflow-hidden"
            >
              {/* Background gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Decorative circle */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500" />

              <div className="relative">
                <div className="flex items-start justify-between mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform duration-300">
                    <Utensils className="h-8 w-8 text-white" />
                  </div>
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-amber-700 transition-colors">
                  Browse Menu
                </h2>
                <p className="text-gray-600 mb-6">
                  Discover our carefully crafted dishes. Get AI recommendations,
                  check dietary options, and place your order.
                </p>

                <div className="flex flex-wrap gap-2">
                  {['AI Assistant', 'Dietary Filters', 'Easy Ordering'].map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>

            {/* Owner Card */}
            <Link
              href="/dashboard"
              className="group relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] overflow-hidden"
            >
              {/* Background gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Decorative circle */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-violet-100 to-purple-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500" />

              <div className="relative">
                <div className="flex items-start justify-between mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:scale-110 transition-transform duration-300">
                    <ChefHat className="h-8 w-8 text-white" />
                  </div>
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-violet-500 group-hover:text-white transition-all duration-300">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-violet-700 transition-colors">
                  Restaurant Dashboard
                </h2>
                <p className="text-gray-600 mb-6">
                  Manage orders, view analytics, track performance,
                  and control your menu in real-time.
                </p>

                <div className="flex flex-wrap gap-2">
                  {['Live Orders', 'Analytics', 'Menu Control'].map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-violet-50 text-violet-700 rounded-full text-sm font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-16">
            <p className="text-gray-500 text-sm">
              Powered by AI • Built with ❤️ for food lovers
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
