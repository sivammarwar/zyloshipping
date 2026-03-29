export interface SupplierProduct {
  id: string;
  title: string;
  price: number;
  stock: number;
  rating: number;
  images: string[];
}

export interface OrderPayload {
  productId: string;
  quantity: number;
  shippingAddress: object;
  supplierSku?: string;
}

export interface SupplierOrderResult {
  supplierOrderId: string;
  raw?: unknown;
}

export interface SupplierAdapter {
  fetchProducts(page?: number): Promise<SupplierProduct[]>;
  submitOrder(payload: OrderPayload): Promise<SupplierOrderResult>;
  checkStock(productId: string): Promise<number>;
  /** CJ: poll order status for tracking / phase */
  getOrderStatus?(supplierOrderId: string): Promise<{ status: string; trackingNumber?: string }>;
}
