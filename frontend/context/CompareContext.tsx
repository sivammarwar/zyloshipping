'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ProductCardData } from '@/components/store/ProductCard';

const MAX_COMPARE = 3;

interface CompareContextValue {
  items: ProductCardData[];
  toggle: (p: ProductCardData) => void;
  remove: (id: string) => void;
  clear: () => void;
  isSelected: (id: string) => boolean;
  isAtMax: boolean;
  modalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems]       = useState<ProductCardData[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const toggle = useCallback((p: ProductCardData) => {
    setItems(prev => {
      const exists = prev.some(x => x.id === p.id);
      if (exists) return prev.filter(x => x.id !== p.id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, p];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems(prev => prev.filter(x => x.id !== id));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setModalOpen(false);
  }, []);

  const isSelected  = useCallback((id: string) => items.some(x => x.id === id), [items]);
  const isAtMax     = items.length >= MAX_COMPARE;
  const openModal   = useCallback(() => setModalOpen(true), []);
  const closeModal  = useCallback(() => setModalOpen(false), []);

  return (
    <CompareContext.Provider value={{ items, toggle, remove, clear, isSelected, isAtMax, modalOpen, openModal, closeModal }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare(): CompareContextValue {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within <CompareProvider>');
  return ctx;
}
