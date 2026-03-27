export interface SupplierProduct {
  id: string; title: string; price: number;
  stock: number; rating: number; images: string[];
}
export interface OrderPayload {
  productId: string; quantity: number; shippingAddress: object;
}
export interface SupplierAdapter {
  fetchProducts(page?: number): Promise<SupplierProduct[]>;
  submitOrder(payload: OrderPayload): Promise<{ supplierOrderId: string }>;
  checkStock(productId: string): Promise<number>;
}
