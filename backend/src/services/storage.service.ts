import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const bucket = process.env.R2_BUCKET_NAME;
const accountId = process.env.R2_ACCOUNT_ID;

const s3 = bucket && process.env.R2_ACCESS_KEY_ID
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    })
  : null;

export async function uploadPublicImage(key: string, body: Buffer, contentType: string): Promise<string | null> {
  if (!s3 || !bucket) return null;
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  const publicBase = process.env.R2_PUBLIC_BASE_URL;
  return publicBase ? `${publicBase.replace(/\/$/, '')}/${key}` : key;
}

export async function getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string | null> {
  if (!s3 || !bucket) return null;
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn }
  );
}
