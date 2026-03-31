import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import axios from 'axios';
import crypto from 'crypto';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'zyloshipping-products';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

function getS3Client(): S3Client | null {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    console.warn('[R2] Credentials not configured, image upload disabled');
    return null;
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

/**
 * Upload image from URL to R2
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  folder: string = 'products'
): Promise<string | null> {
  const client = getS3Client();
  if (!client) return null;

  try {
    // Download image
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
      maxContentLength: 10 * 1024 * 1024, // 10MB max
    });

    const buffer = Buffer.from(response.data);
    const contentType = response.headers['content-type'] || 'image/jpeg';

    // Generate unique filename
    const hash = crypto.createHash('md5').update(buffer).digest('hex');
    const ext = contentType.split('/')[1] || 'jpg';
    const filename = `${folder}/${hash}.${ext}`;

    // Upload to R2
    await client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: filename,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000', // 1 year
      })
    );

    // Return public URL
    const publicUrl = R2_PUBLIC_URL 
      ? `${R2_PUBLIC_URL}/${filename}`
      : `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${filename}`;

    console.log(`[R2] Uploaded image: ${filename}`);
    return publicUrl;
  } catch (error: any) {
    console.error('[R2] Upload failed:', error.message);
    return null;
  }
}

/**
 * Upload multiple product images
 */
export async function uploadProductImages(
  imageUrls: string[],
  productId: string
): Promise<string[]> {
  const client = getS3Client();
  if (!client) {
    console.warn('[R2] Client not configured, returning original URLs');
    return imageUrls;
  }

  const uploadedUrls: string[] = [];

  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    
    // Skip if already uploaded to R2
    if (url.includes(R2_BUCKET_NAME || 'r2.cloudflarestorage.com')) {
      uploadedUrls.push(url);
      continue;
    }

    const uploadedUrl = await uploadImageFromUrl(url, `products/${productId}`);
    
    if (uploadedUrl) {
      uploadedUrls.push(uploadedUrl);
    } else {
      // Fallback to original URL if upload fails
      uploadedUrls.push(url);
    }

    // Rate limit: wait 100ms between uploads
    if (i < imageUrls.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log(`[R2] Uploaded ${uploadedUrls.length}/${imageUrls.length} images for product ${productId}`);
  return uploadedUrls;
}

/**
 * Delete image from R2
 */
export async function deleteImage(imageUrl: string): Promise<boolean> {
  const client = getS3Client();
  if (!client) return false;

  try {
    // Extract key from URL
    const key = imageUrl.split('/').slice(-2).join('/'); // e.g., "products/abc123.jpg"

    await client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    );

    console.log(`[R2] Deleted image: ${key}`);
    return true;
  } catch (error: any) {
    console.error('[R2] Delete failed:', error.message);
    return false;
  }
}

/**
 * Batch upload images with progress tracking
 */
export async function batchUploadImages(
  images: Array<{ url: string; productId: string }>,
  onProgress?: (completed: number, total: number) => void
): Promise<Map<string, string[]>> {
  const results = new Map<string, string[]>();

  for (let i = 0; i < images.length; i++) {
    const { url, productId } = images[i];
    
    const uploadedUrl = await uploadImageFromUrl(url, `products/${productId}`);
    
    if (!results.has(productId)) {
      results.set(productId, []);
    }
    
    results.get(productId)!.push(uploadedUrl || url);

    if (onProgress) {
      onProgress(i + 1, images.length);
    }

    // Rate limit
    if (i < images.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}
