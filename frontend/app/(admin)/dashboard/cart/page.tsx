'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

// ── Nav ───────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard',           icon: '◈' },
  { label: 'Orders',    href: '/dashboard/orders',    icon: '📦' },
  { label: 'Products',  href: '/dashboard/products',  icon: '🏷' },
  { label: 'Cart',      href: '/dashboard/cart',      icon: '🛒', active: true },
  { label: 'Suppliers', href: '/dashboard/suppliers', icon: '🔗' },
  { label: 'Analytics', href: '/dashboard/analytics', icon: '📊' },
  { label: 'AI Agents', href: '/dashboard/agents',    icon: '🤖' },
  { label: 'Settings',  href: '/dashboard/settings',  icon: '⚙️' },
];

// ── Mock cart items ────────────────────────────────────────────
const INITIAL_CART = [
  {
    id: 'c1',
    productId: '7',
    sku: 'ZY-ELEC-002',
    name: 'Noise Cancelling Earbuds Pro',
    category: 'Electronics',
    supplier: 'AliExpress',
    image: '🎧',
    price: 79.00,
    supplierCost: 28.00,
    stock: 212,
    quantity: 2,
    slug: 'noise-cancelling-earbuds-pro',
  },
  {
    id: 'c2',
    productId: '5',
    sku: 'ZY-FIT-001',
    name: 'Resistance Band Set (Pro)',
    category: 'Fitness',
    supplier: 'AliExpress',
    image: '💪',
    price: 28.00,
    supplierCost: 8.00,
    stock: 620,
    quantity: 1,
    slug: 'resistance-band-set-pro',
  },
  {
    id: 'c3',
    productId: '4',
    sku: 'ZY-FASH-001',
    name: 'Breathable Sports Watch',
    category: 'Fashion',
    supplier: 'CJ',
    image: '⌚',
    price: 69.00,
    supplierCost: 24.00,
    stock: 175,
    quantity: 3,
    slug: 'breathable-sports-watch',
  },
  {
    id: 'c4',
    productId: '2',
    sku: 'ZY-HOME-001',
    name: 'Minimalist Desk Lamp',
    category: 'Home Decor',
    supplier: 'CJ',
    image: '💡',
    price: 39.00,
    supplierCost: 14.50,
    stock: 88,
    quantity: 1,
    slug: 'minimalist-desk-lamp',
  },
];

// ── Saved / Wishlisted items ───────────────────────────────────
const SAVED_ITEMS = [
  {
    id: 's1',
    productId: '3',
    sku: 'ZY-GADG-001',
    name: 'Portable Power Bank 20K',
    category: 'Gadgets',
    supplier: 'AliExpress',
    image: '🔋',
    price: 55.00,
    supplierCost: 19.00,
    stock: 4,
    slug: 'portable-power-bank-20k',
  },
  {
    id: 's2',
    productId: '9',
    sku: 'ZY-FASH-002',
    name: 'Slim Leather Card Wallet',
    category: 'Fashion',
    supplier: 'AliExpress',
    image: '👛',
    price: 24.00,
    supplierCost: 7.00,
    stock: 512,
    slug: 'slim-leather-card-wallet',
  },
];

type CartItem = typeof INITIAL_CART[number];

export default function AdminCartPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [cartItems, setCartItems]     = useState<CartItem[]>(INITIAL_CART);
  const [savedItems, setSavedItems]   = useState(SAVED_ITEMS);
  const [selected, setSelected]       = useState<string[]>([]);
  const [coupon, setCoupon]           = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError]     = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [note, setNote]               = useState('');

  // ── Calculations ──────────────────────────────────────────
  const subtotal = useMemo(
    () => cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [cartItems]
  );
  const totalCost = useMemo(
    () => cartItems.reduce((sum, i) => sum + i.supplierCost * i.quantity, 0),
    [cartItems]
  );
  const discount    = couponApplied ? subtotal * 0.1 : 0;
  const shipping    = subtotal > 200 ? 0 : 9.99;
  const total       = subtotal - discount + shipping;
  const totalProfit = total - totalCost - shipping;
  const totalMargin = total > 0 ? Math.round((totalProfit / total) * 100) : 0;
  const totalItems  = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  // ── Handlers ──────────────────────────────────────────────
  function updateQty(id: string, delta: number) {
    setCartItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(1, Math.min(item.stock, item.quantity + delta)) }
          : item
      )
    );
  }

  function setQty(id: string, val: number) {
    setCartItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(1, Math.min(item.stock, val)) }
          : item
      )
    );
  }

  function removeItem(id: string) {
    setCartItems(prev => prev.filter(i => i.id !== id));
    setSelected(prev => prev.filter(s => s !== id));
  }

  function saveForLater(id: string) {
    const item = cartItems.find(i => i.id === id);
    if (!item) return;
    setSavedItems(prev => [...prev, { id: `s${Date.now()}`, productId: item.productId, sku: item.sku, name: item.name, category: item.category, supplier: item.supplier, image: item.image, price: item.price, supplierCost: item.supplierCost, stock: item.stock, slug: item.slug }]);
    removeItem(id);
  }

  function moveToCart(id: string) {
    const item = savedItems.find(i => i.id === id);
    if (!item) return;
    setCartItems(prev => [...prev, { ...item, quantity: 1 }]);
    setSavedItems(prev => prev.filter(i => i.id !== id));
  }

  function removeSaved(id: string) {
    setSavedItems(prev => prev.filter(i => i.id !== id));
  }

  function toggleSelect(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  }

  function toggleAll() {
    setSelected(selected.length === cartItems.length ? [] : cartItems.map(i => i.id));
  }

  function removeSelected() {
    setCartItems(prev => prev.filter(i => !selected.includes(i.id)));
    setSelected([]);
  }

  function applyCoupon() {
    if (coupon.toUpperCase() === 'ZYLO10') {
      setCouponApplied(true);
      setCouponError('');
    } else {
      setCouponError('Invalid coupon code');
      setCouponApplied(false);
    }
  }

  function handleCheckout() {
    setCheckoutLoading(true);
    setTimeout(() => setCheckoutLoading(false), 2000);
  }

  const marginColor = (m: number) => m >= 60 ? '#22c55e' : m >= 40 ? '#f59e0b' : 'var(--red)';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--off-white)', fontFamily: 'var(--sans)' }}>

      {/* ── Sidebar ── */}
      <aside style={{ width: sidebarOpen ? 220 : 64, background: 'var(--ink)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50, transition: 'width 0.25s cubic-bezier(0.22,1,0.36,1)', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, background: 'var(--red)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontFamily: 'var(--serif)', fontWeight: 900, color: 'white', fontSize: '1rem' }}>Z</span>
          </div>
          {sidebarOpen && <span style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 900, color: 'white', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>Zylo<span style={{ color: 'var(--red)' }}>.</span></span>}
        </div>
        <nav style={{ flex: 1, padding: '1rem 0', overflowY: 'auto' }}>
          {NAV_ITEMS.map(item => (
            <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 1.25rem', color: item.active ? 'var(--white)' : 'rgba(255,255,255,0.45)', background: item.active ? 'rgba(196,30,58,0.18)' : 'transparent', borderLeft: `3px solid ${item.active ? 'var(--red)' : 'transparent'}`, textDecoration: 'none', fontSize: '0.84rem', fontWeight: item.active ? 500 : 300, whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && item.label}
            </Link>
          ))}
        </nav>
        <button onClick={() => setSidebarOpen(v => !v)} style={{ margin: '1rem', padding: '0.6rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2, color: 'rgba(255,255,255,0.45)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ transform: sidebarOpen ? 'rotate(0)' : 'rotate(180deg)', transition: 'transform 0.25s' }}><path d="M9 2L4 7l5 5"/></svg>
        </button>
      </aside>

      {/* ── Main ── */}
      <main style={{ marginLeft: sidebarOpen ? 220 : 64, flex: 1, transition: 'margin-left 0.25s', minHeight: '100vh' }}>

        {/* Top bar */}
        <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 40, gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--red)' }}>Admin</div>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              Cart
              {totalItems > 0 && (
                <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.55rem', borderRadius: 2, background: 'var(--red)', color: 'white', letterSpacing: '0.04em' }}>
                  {totalItems} items
                </span>
              )}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
            <Link href="/dashboard/products" style={{ padding: '0.5rem 0.9rem', background: 'none', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.78rem', color: 'var(--ink-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              + Continue shopping
            </Link>
            <button
              onClick={handleCheckout}
              disabled={cartItems.length === 0 || checkoutLoading}
              style={{ padding: '0.5rem 1.1rem', background: cartItems.length === 0 ? 'var(--border)' : 'var(--red)', color: 'white', border: 'none', borderRadius: 2, fontSize: '0.78rem', fontWeight: 500, cursor: cartItems.length === 0 ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'background 0.2s' }}
            >
              {checkoutLoading ? '⏳ Processing…' : '→ Checkout'}
            </button>
          </div>
        </div>

        <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'start' }}>

          {/* ── LEFT ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Summary strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
              {[
                { label: 'Items in cart',  val: totalItems,                       unit: 'units' },
                { label: 'Cart value',     val: `$${subtotal.toFixed(2)}`,        unit: 'subtotal' },
                { label: 'Est. profit',    val: `$${totalProfit.toFixed(2)}`,     unit: 'after costs' },
                { label: 'Blended margin', val: `${totalMargin}%`,                unit: 'across items' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1rem 1.25rem' }}>
                  <div style={{ fontSize: '0.63rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.3rem' }}>{s.label}</div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: '1.45rem', fontWeight: 900, color: 'var(--ink)', lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--ink-faint)', marginTop: '0.2rem' }}>{s.unit}</div>
                </div>
              ))}
            </div>

            {/* Bulk actions bar */}
            {selected.length > 0 && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 2, padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--red)', fontWeight: 500 }}>{selected.length} selected</span>
                <button onClick={removeSelected} style={{ padding: '0.35rem 0.8rem', background: 'none', border: '1px solid #fca5a5', borderRadius: 2, fontSize: '0.75rem', color: '#dc2626', cursor: 'pointer', fontFamily: 'var(--sans)' }}>🗑 Remove selected</button>
                <button onClick={() => setSelected([])} style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)' }}>Clear</button>
              </div>
            )}

            {/* Cart items */}
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>

              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 110px 120px 90px 80px 100px', gap: 0, padding: '0.6rem 1.25rem', background: 'var(--off-white)', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                <input type="checkbox" checked={selected.length === cartItems.length && cartItems.length > 0} onChange={toggleAll} style={{ cursor: 'pointer', accentColor: 'var(--red)' }} />
                {['Product', 'Supplier', 'Unit price', 'Quantity', 'Margin', 'Total'].map(h => (
                  <div key={h} style={{ fontSize: '0.64rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>{h}</div>
                ))}
              </div>

              {cartItems.length === 0 ? (
                <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🛒</div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.35rem' }}>Your cart is empty</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--ink-faint)', marginBottom: '1.25rem' }}>Browse products and add items to get started</div>
                  <Link href="/dashboard/products" style={{ padding: '0.55rem 1.1rem', background: 'var(--red)', color: 'white', borderRadius: 2, fontSize: '0.8rem', textDecoration: 'none', fontWeight: 500 }}>Browse Products</Link>
                </div>
              ) : (
                cartItems.map((item, idx) => {
                  const margin    = Math.round(((item.price - item.supplierCost) / item.price) * 100);
                  const lineTotal = item.price * item.quantity;
                  const isLowStock = item.stock < 10;
                  return (
                    <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 110px 120px 90px 80px 100px', gap: 0, padding: '1rem 1.25rem', borderBottom: idx < cartItems.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center', background: selected.includes(item.id) ? '#fef2f2' : 'transparent', transition: 'background 0.15s' }}>

                      {/* Checkbox */}
                      <input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleSelect(item.id)} style={{ cursor: 'pointer', accentColor: 'var(--red)' }} />

                      {/* Product */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', paddingRight: '1rem' }}>
                        <div style={{ width: 52, height: 52, background: 'var(--off-white)', border: '1px solid var(--border)', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>{item.image}</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 500, color: 'var(--ink)', fontSize: '0.84rem', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{item.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--ink-faint)', fontFamily: 'monospace', marginTop: '0.1rem' }}>{item.sku}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--ink-faint)', marginTop: '0.15rem' }}>{item.category}</div>
                          {isLowStock && (
                            <div style={{ fontSize: '0.64rem', color: '#d97706', fontWeight: 500, marginTop: '0.15rem' }}>⚠ Only {item.stock} left</div>
                          )}
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                            <button onClick={() => saveForLater(item.id)} style={{ fontSize: '0.65rem', color: 'var(--ink-faint)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', padding: 0, textDecoration: 'underline' }}>Save for later</button>
                            <span style={{ color: 'var(--border)' }}>·</span>
                            <button onClick={() => removeItem(item.id)} style={{ fontSize: '0.65rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', padding: 0, textDecoration: 'underline' }}>Remove</button>
                          </div>
                        </div>
                      </div>

                      {/* Supplier */}
                      <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>{item.supplier}</div>

                      {/* Unit price */}
                      <div>
                        <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--red)', fontSize: '0.95rem' }}>${item.price.toFixed(2)}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--ink-faint)', marginTop: '0.1rem' }}>cost ${item.supplierCost.toFixed(2)}</div>
                      </div>

                      {/* Quantity stepper */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <button onClick={() => updateQty(item.id, -1)} disabled={item.quantity <= 1} style={{ width: 26, height: 26, border: '1px solid var(--border)', borderRadius: 2, background: 'none', fontSize: '0.9rem', cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer', color: item.quantity <= 1 ? 'var(--border)' : 'var(--ink)', fontFamily: 'var(--sans)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>−</button>
                        <input
                          type="number"
                          value={item.quantity}
                          min={1}
                          max={item.stock}
                          onChange={e => setQty(item.id, parseInt(e.target.value) || 1)}
                          style={{ width: 38, height: 26, border: '1px solid var(--border)', borderRadius: 2, textAlign: 'center', fontSize: '0.82rem', fontFamily: 'var(--sans)', outline: 'none', color: 'var(--ink)' }}
                        />
                        <button onClick={() => updateQty(item.id, 1)} disabled={item.quantity >= item.stock} style={{ width: 26, height: 26, border: '1px solid var(--border)', borderRadius: 2, background: 'none', fontSize: '0.9rem', cursor: item.quantity >= item.stock ? 'not-allowed' : 'pointer', color: item.quantity >= item.stock ? 'var(--border)' : 'var(--ink)', fontFamily: 'var(--sans)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>+</button>
                      </div>

                      {/* Margin */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                          <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 2 }}>
                            <div style={{ height: '100%', width: `${margin}%`, background: marginColor(margin), borderRadius: 2 }} />
                          </div>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: marginColor(margin), fontWeight: 600 }}>{margin}%</div>
                      </div>

                      {/* Line total */}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'var(--serif)', fontWeight: 900, color: 'var(--ink)', fontSize: '1rem' }}>${lineTotal.toFixed(2)}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--ink-faint)', marginTop: '0.1rem' }}>
                          profit ${((item.price - item.supplierCost) * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Order note */}
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.25rem' }}>
              <label style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', display: 'block', marginBottom: '0.75rem' }}>Order note</label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
                placeholder="Add a note for this order (supplier instructions, gift message, etc.)"
                style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.82rem', fontFamily: 'var(--sans)', color: 'var(--ink)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--red)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
              />
            </div>

            {/* Saved for later */}
            {savedItems.length > 0 && (
              <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>Saved for later ({savedItems.length})</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {savedItems.map((item, idx) => {
                    const margin = Math.round(((item.price - item.supplierCost) / item.price) * 100);
                    return (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.9rem 1.25rem', borderBottom: idx < savedItems.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <div style={{ width: 44, height: 44, background: 'var(--off-white)', border: '1px solid var(--border)', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>{item.image}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 500, color: 'var(--ink)', fontSize: '0.84rem' }}>{item.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--ink-faint)', fontFamily: 'monospace' }}>{item.sku}</div>
                          {item.stock < 10 && <div style={{ fontSize: '0.64rem', color: '#d97706', marginTop: '0.1rem' }}>⚠ Low stock — {item.stock} left</div>}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--red)', fontSize: '0.9rem' }}>${item.price.toFixed(2)}</div>
                          <div style={{ fontSize: '0.68rem', color: marginColor(margin), marginTop: '0.1rem' }}>{margin}% margin</div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                          <button onClick={() => moveToCart(item.id)} style={{ padding: '0.35rem 0.7rem', background: 'none', border: '1px solid var(--red)', borderRadius: 2, fontSize: '0.72rem', color: 'var(--red)', cursor: 'pointer', fontFamily: 'var(--sans)', whiteSpace: 'nowrap' }}>Move to cart</button>
                          <button onClick={() => removeSaved(item.id)} style={{ padding: '0.35rem 0.7rem', background: 'none', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.72rem', color: 'var(--ink-faint)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>✕</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT — Order summary ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '4.5rem' }}>

            {/* Summary card */}
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.25rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '1rem' }}>Order summary</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
                {[
                  { label: 'Subtotal',      val: `$${subtotal.toFixed(2)}` },
                  { label: `Shipping${subtotal > 200 ? ' (free)' : ''}`, val: shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}` },
                  ...(couponApplied ? [{ label: 'Discount (ZYLO10)', val: `-$${discount.toFixed(2)}`, red: true }] : []),
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--ink-faint)' }}>{row.label}</span>
                    <span style={{ color: (row as any).red ? '#16a34a' : 'var(--ink)', fontWeight: 500 }}>{row.val}</span>
                  </div>
                ))}

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '0.88rem' }}>Total</span>
                  <span style={{ fontFamily: 'var(--serif)', fontWeight: 900, color: 'var(--red)', fontSize: '1.2rem' }}>${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Profit summary */}
              <div style={{ background: 'var(--off-white)', borderRadius: 2, padding: '0.85rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.5rem' }}>Estimated profit</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 5, background: 'var(--border)', borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${Math.min(totalMargin, 100)}%`, background: marginColor(totalMargin), borderRadius: 3, transition: 'width 0.4s' }} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--serif)', fontWeight: 900, fontSize: '1rem', color: marginColor(totalMargin) }}>{totalMargin}%</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.72rem', color: 'var(--ink-faint)' }}>
                  <span>Supplier cost: <strong style={{ color: 'var(--ink)' }}>${totalCost.toFixed(2)}</strong></span>
                  <span>Net: <strong style={{ color: '#16a34a' }}>${totalProfit.toFixed(2)}</strong></span>
                </div>
              </div>

              {/* Coupon */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--ink-muted)', marginBottom: '0.4rem' }}>Coupon code</div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <input
                    value={coupon}
                    onChange={e => { setCoupon(e.target.value); setCouponError(''); }}
                    disabled={couponApplied}
                    placeholder="e.g. ZYLO10"
                    style={{ flex: 1, padding: '0.5rem 0.65rem', border: `1px solid ${couponError ? '#fca5a5' : couponApplied ? '#86efac' : 'var(--border)'}`, borderRadius: 2, fontSize: '0.8rem', fontFamily: 'var(--sans)', outline: 'none', color: 'var(--ink)', background: couponApplied ? '#f0fdf4' : 'var(--white)' }}
                    onFocus={e => { if (!couponApplied) e.currentTarget.style.borderColor = 'var(--red)'; }}
                    onBlur={e => { if (!couponApplied && !couponError) e.currentTarget.style.borderColor = 'var(--border)'; }}
                  />
                  {couponApplied ? (
                    <button onClick={() => { setCouponApplied(false); setCoupon(''); }} style={{ padding: '0.5rem 0.7rem', background: 'none', border: '1px solid #86efac', borderRadius: 2, fontSize: '0.75rem', color: '#16a34a', cursor: 'pointer', fontFamily: 'var(--sans)' }}>✓</button>
                  ) : (
                    <button onClick={applyCoupon} style={{ padding: '0.5rem 0.7rem', background: 'var(--red)', border: 'none', borderRadius: 2, fontSize: '0.75rem', color: 'white', cursor: 'pointer', fontFamily: 'var(--sans)' }}>Apply</button>
                  )}
                </div>
                {couponError && <div style={{ fontSize: '0.68rem', color: '#dc2626', marginTop: '0.25rem' }}>{couponError}</div>}
                {couponApplied && <div style={{ fontSize: '0.68rem', color: '#16a34a', marginTop: '0.25rem' }}>✓ 10% discount applied</div>}
              </div>

              {/* Checkout CTA */}
              <button
                onClick={handleCheckout}
                disabled={cartItems.length === 0 || checkoutLoading}
                style={{ width: '100%', padding: '0.75rem', background: cartItems.length === 0 ? 'var(--border)' : 'var(--red)', color: 'white', border: 'none', borderRadius: 2, fontSize: '0.88rem', fontWeight: 600, cursor: cartItems.length === 0 ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)', letterSpacing: '0.01em', marginBottom: '0.75rem', transition: 'background 0.2s' }}
              >
                {checkoutLoading ? '⏳ Processing…' : `Checkout · $${total.toFixed(2)}`}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', fontSize: '0.68rem', color: 'var(--ink-faint)' }}>
                <span>🔒</span>
                <span>Secure checkout · Powered by Razorpay</span>
              </div>

              {/* Free shipping nudge */}
              {shipping > 0 && (
                <div style={{ marginTop: '0.85rem', padding: '0.65rem 0.85rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 2, fontSize: '0.72rem', color: '#92400e' }}>
                  Add <strong>${(200 - subtotal).toFixed(2)}</strong> more for free shipping
                </div>
              )}
            </div>

            {/* Supplier breakdown */}
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.25rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '1rem' }}>Supplier breakdown</div>
              {['AliExpress', 'CJ'].map(sup => {
                const items = cartItems.filter(i => i.supplier === sup);
                if (items.length === 0) return null;
                const supTotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
                return (
                  <div key={sup} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.5rem' }}>
                    <div>
                      <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{sup}</span>
                      <span style={{ color: 'var(--ink-faint)', marginLeft: '0.35rem' }}>{items.length} item{items.length > 1 ? 's' : ''}</span>
                    </div>
                    <span style={{ color: 'var(--ink)', fontWeight: 600 }}>${supTotal.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>

            {/* Quick actions */}
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.25rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.85rem' }}>Quick actions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <button style={{ padding: '0.5rem 0.75rem', background: 'none', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.78rem', color: 'var(--ink-muted)', cursor: 'pointer', fontFamily: 'var(--sans)', textAlign: 'left', transition: 'border-color 0.15s' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--red)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                  📋 Export cart as CSV
                </button>
                <button style={{ padding: '0.5rem 0.75rem', background: 'none', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.78rem', color: 'var(--ink-muted)', cursor: 'pointer', fontFamily: 'var(--sans)', textAlign: 'left', transition: 'border-color 0.15s' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--red)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                  🤖 AI suggest substitutes
                </button>
                <button onClick={() => setCartItems([])} style={{ padding: '0.5rem 0.75rem', background: 'none', border: '1px solid #fca5a5', borderRadius: 2, fontSize: '0.78rem', color: '#dc2626', cursor: 'pointer', fontFamily: 'var(--sans)', textAlign: 'left' }}>
                  🗑 Clear cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @media (max-width: 1100px) {
          div[style*="grid-template-columns: 1fr 300px"] { grid-template-columns: 1fr !important; }
          div[style*="grid-template-columns: repeat(4, 1fr)"] { grid-template-columns: repeat(2, 1fr) !important; }
          div[style*="position: sticky"][style*="top: 4.5rem"] { position: static !important; }
        }
        @media (max-width: 768px) {
          main { margin-left: 64px !important; }
          div[style*="grid-template-columns: 36px 1fr 110px 120px 90px 80px 100px"] { grid-template-columns: 36px 1fr 90px !important; }
        }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
      `}</style>
    </div>
  );
}