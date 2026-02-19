/**
 * PrintOnDemand — Physical book ordering interface with 3D book preview,
 * product options, gift wrapping, and era-themed packaging.
 * @module shared/components/PrintOnDemand
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { Badge } from '@/modules/shared/components/ui/badge';
import { Input } from '@/modules/shared/components/ui/input';
import { Label } from '@/modules/shared/components/ui/label';
import { Switch } from '@/modules/shared/components/ui/switch';
import { Separator } from '@/modules/shared/components/ui/separator';
import { cn } from '@/core/lib/utils';
import {
  BookOpen,
  Package,
  Gift,
  Truck,
  Minus,
  Plus,
  Sparkles,
  Check,
} from 'lucide-react';

/** Story data for PrintOnDemand */
export interface PrintOnDemandStory {
  title: string;
  era: string;
  chapters: Array<{ title: string; content: string }>;
  coverUrl?: string;
}

export interface PrintOnDemandProps {
  story: PrintOnDemandStory;
}

interface ProductOption {
  id: 'paperback' | 'hardcover' | 'zine';
  name: string;
  price: number;
  size: string;
  finish: string;
  icon: React.ReactNode;
}

const PRODUCTS: ProductOption[] = [
  { id: 'paperback', name: 'Paperback',  price: 14.99, size: '5.5" × 8.5"', finish: 'Matte cover',       icon: <BookOpen className="w-5 h-5" /> },
  { id: 'hardcover', name: 'Hardcover',  price: 24.99, size: '6" × 9"',     finish: 'Glossy cover',      icon: <Package className="w-5 h-5" /> },
  { id: 'zine',      name: 'Mini Zine',  price: 9.99,  size: '4" × 6"',     finish: 'Saddle-stitched',   icon: <Sparkles className="w-5 h-5" /> },
];

const ERA_COLORS: Record<string, string> = {
  Debut: 'from-amber-300 to-yellow-500',
  Fearless: 'from-yellow-400 to-amber-500',
  'Speak Now': 'from-purple-400 to-violet-600',
  Red: 'from-red-500 to-rose-600',
  '1989': 'from-sky-400 to-blue-500',
  Reputation: 'from-gray-800 to-emerald-900',
  Lover: 'from-pink-400 via-purple-400 to-blue-400',
  Folklore: 'from-emerald-700 to-gray-600',
  Evermore: 'from-orange-700 to-amber-900',
  Midnights: 'from-indigo-800 to-purple-900',
};

const GIFT_WRAP_PRICE = 3.99;

export const PrintOnDemand: React.FC<PrintOnDemandProps> = ({ story }) => {
  const [selected, setSelected] = useState<ProductOption>(PRODUCTS[0]);
  const [quantity, setQuantity] = useState(1);
  const [giftOption, setGiftOption] = useState(false);
  const [giftWrap, setGiftWrap] = useState(false);
  const [address, setAddress] = useState({ name: '', street: '', city: '', state: '', zip: '' });

  const eraGradient = ERA_COLORS[story.era] ?? 'from-purple-500 to-pink-500';
  const subtotal = selected.price * quantity + (giftWrap ? GIFT_WRAP_PRICE : 0);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* 3D Book Preview */}
        <div className="flex items-center justify-center">
          <motion.div
            className="relative"
            initial={{ rotateY: -20, opacity: 0 }}
            animate={{ rotateY: -15, opacity: 1 }}
            transition={{ duration: 0.8 }}
            style={{ perspective: 800 }}
          >
            <div
              className="relative w-56 h-80 rounded-r-lg shadow-2xl"
              style={{
                transform: 'rotateY(-15deg) rotateX(2deg)',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Book cover */}
              {story.coverUrl ? (
                <img
                  src={story.coverUrl}
                  alt={story.title}
                  className="absolute inset-0 w-full h-full object-cover rounded-r-lg"
                />
              ) : (
                <div className={cn('absolute inset-0 rounded-r-lg bg-gradient-to-br flex flex-col items-center justify-center text-white p-6', eraGradient)}>
                  <BookOpen className="w-10 h-10 mb-3 opacity-80" />
                  <p className="text-center font-bold text-lg leading-tight">{story.title}</p>
                  <Badge className="mt-3 bg-white/20 text-white border-0">{story.era}</Badge>
                </div>
              )}
              {/* Spine shadow */}
              <div className="absolute left-0 top-0 w-3 h-full bg-black/20 rounded-l" />
              {/* Page edges */}
              <div className="absolute -right-1 top-1 w-1 h-[calc(100%-8px)] bg-gray-200 rounded-r" />
              <div className="absolute -right-2 top-2 w-1 h-[calc(100%-16px)] bg-gray-100 rounded-r" />
            </div>
          </motion.div>
        </div>

        {/* Product Options */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-1">Print Your Story</h2>
            <p className="text-sm text-muted-foreground">Choose a format for "{story.title}"</p>
          </div>

          <div className="space-y-3">
            {PRODUCTS.map((product) => (
              <motion.button
                key={product.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelected(product)}
                className={cn(
                  'w-full flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all',
                  selected.id === product.id
                    ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-300'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full',
                  selected.id === product.id ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-500'
                )}>
                  {product.icon}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{product.name}</div>
                  <div className="text-xs text-muted-foreground">{product.size} · {product.finish}</div>
                </div>
                <div className="font-bold text-lg">${product.price.toFixed(2)}</div>
                {selected.id === product.id && <Check className="w-5 h-5 text-purple-500" />}
              </motion.button>
            ))}
          </div>

          {/* Quantity */}
          <div className="flex items-center gap-4">
            <Label className="text-sm font-medium">Quantity</Label>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setQuantity((q) => Math.max(1, q - 1))}><Minus className="w-3 h-3" /></Button>
              <span className="w-8 text-center font-semibold">{quantity}</span>
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setQuantity((q) => Math.min(99, q + 1))}><Plus className="w-3 h-3" /></Button>
            </div>
          </div>

          <Separator />

          {/* Gift Wrap */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-pink-500" />
              <span className="text-sm font-medium">Gift wrapping</span>
              <Badge variant="secondary" className="text-xs">+$3.99</Badge>
            </div>
            <Switch checked={giftWrap} onCheckedChange={setGiftWrap} />
          </div>

          {/* Era-themed packaging note */}
          {giftWrap && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
              <div className={cn('rounded-lg p-3 text-sm text-white bg-gradient-to-r', eraGradient)}>
                <Sparkles className="w-4 h-4 inline mr-1" />
                {story.era}-themed packaging with era-colored tissue paper & a lyric card
              </div>
            </motion.div>
          )}

          {/* Gift address toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">Ship to a different address</span>
            </div>
            <Switch checked={giftOption} onCheckedChange={setGiftOption} />
          </div>

          <AnimatePresence>
            {giftOption && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden space-y-3"
              >
                <Input placeholder="Recipient name" value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} />
                <Input placeholder="Street address" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} />
                <div className="grid grid-cols-3 gap-2">
                  <Input placeholder="City" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
                  <Input placeholder="State" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
                  <Input placeholder="ZIP" value={address.zip} onChange={(e) => setAddress({ ...address, zip: e.target.value })} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Separator />

          {/* Shipping estimate */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Truck className="w-4 h-4" />
            Ships in 5–7 business days
          </div>

          {/* Order summary & CTA */}
          <Card>
            <CardContent className="pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>{selected.name} × {quantity}</span>
                <span>${(selected.price * quantity).toFixed(2)}</span>
              </div>
              {giftWrap && (
                <div className="flex justify-between text-sm">
                  <span>Gift wrapping</span>
                  <span>${GIFT_WRAP_PRICE.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Button
            size="lg"
            className="w-full gap-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white shadow-lg"
          >
            <Package className="w-4 h-4" />
            Order Print
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Powered by [Print Partner] — Coming Soon
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrintOnDemand;
