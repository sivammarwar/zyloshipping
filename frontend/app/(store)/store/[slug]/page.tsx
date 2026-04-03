'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface StoreProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  images: string[];
  category: string;
  rating: number;
  reviewCount: number;
}

interface Store {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  ownerName: string;
  currency: string;
  products: StoreProduct[];
}

export default function StorePage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (slug) {
      fetchStore();
    }
  }, [slug]);

  async function fetchStore() {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://zyloshippingbackend-production.up.railway.app';
      const res = await fetch(`${apiUrl}/api/user/store/public/${slug}`);
      
      if (!res.ok) {
        if (res.status === 404) {
          setError('Store not found');
        } else {
          setError('Failed to load store');
        }
        setLoading(false);
        return;
      }
      
      const data = await res.json();
      setStore(data.store);
    } catch (err) {
      console.error('Error fetching store:', err);
      setError('Failed to load store');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>Loading store...</div>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !store) {
    return (
      <>
        <Header />
        <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <h1 style={{ fontSize: '2rem', color: 'var(--ink)', marginBottom: '1rem' }}>Store Not Found</h1>
          <p style={{ color: 'var(--ink-muted)', marginBottom: '2rem' }}>{error || 'This store does not exist or is not public.'}</p>
          <Link href="/" style={{ padding: '0.75rem 1.5rem', background: 'var(--red)', color: 'var(--white)', borderRadius: 2, textDecoration: 'none' }}>
            Browse Products
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      
      {/* Store Header */}
      <div style={{ background: 'var(--off-white)', padding: '3rem 4vw', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            {store.logo ? (
              <img src={store.logo} alt={store.name} style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: 8, background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--white)', fontSize: '2rem', fontWeight: 900 }}>
                {store.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 style={{ fontFamily: 'var(--serif)', fontSize: '2rem', fontWeight: 900, color: 'var(--ink)', marginBottom: '0.25rem' }}>
                {store.name}
              </h1>
              <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)' }}>
                by {store.ownerName} • {store.products.length} products
              </p>
            </div>
          </div>
          
          {store.description && (
            <p style={{ marginTop: '1rem', color: 'var(--ink-muted)', maxWidth: 600 }}>
              {store.description}
            </p>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '3rem 4vw' }}>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1.5rem' }}>
          Products
        </h2>
        
        {store.products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--off-white)', borderRadius: 8 }}>
            <p style={{ color: 'var(--ink-muted)' }}>No products in this store yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {store.products.map((product) => (
              <Link key={product.id} href={`/products/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ background: 'var(--white)', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', transition: 'transform 0.2s, box-shadow 0.2s' }}>
                  <div style={{ aspectRatio: '1', background: '#f8fafc', position: 'relative' }}>
                    {product.images && product.images.length > 0 ? (
                      <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                        No image
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '1rem' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                      {product.category}
                    </p>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                      {product.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--red)' }}>
                        {store.currency} {product.price.toFixed(2)}
                      </span>
                      {product.compareAtPrice && product.compareAtPrice > product.price && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--ink-faint)', textDecoration: 'line-through' }}>
                          {store.currency} {product.compareAtPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                    {product.rating > 0 && (
                      <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--ink-muted)' }}>
                        <span style={{ color: '#f59e0b' }}>★</span>
                        <span>{product.rating.toFixed(1)}</span>
                        <span>({product.reviewCount})</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}
