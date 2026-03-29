import { submitOrderToPrimaryOrBackupSupplier } from '../services/supplier/orderSubmit.service';

export async function handleOrderSubmissionJob(orderId: string): Promise<void> {
  await submitOrderToPrimaryOrBackupSupplier(orderId);
}
