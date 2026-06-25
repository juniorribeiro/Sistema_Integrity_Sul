import fp from 'fastify-plugin';
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { FastifyInstance } from 'fastify';
import { env } from '../env.js';

export interface GarageService {
  client: S3Client;
  /** Gera presigned URL de download (validade 1h por padrão). */
  presignDownload(bucket: string, key: string, expiresIn?: number): Promise<string>;
  /** Gera presigned URL de upload (PUT) (validade 1h por padrão). */
  presignUpload(bucket: string, key: string, contentType: string, expiresIn?: number): Promise<string>;
  /** Upload direto via buffer (usado em uploads multipart no backend). */
  putObject(bucket: string, key: string, body: Buffer, contentType: string): Promise<void>;
  deleteObject(bucket: string, key: string): Promise<void>;
}

declare module 'fastify' {
  interface FastifyInstance {
    garage: GarageService;
  }
}

export default fp(async (app: FastifyInstance) => {
  const client = new S3Client({
    endpoint: env.GARAGE_ENDPOINT,
    region: env.GARAGE_REGION,
    forcePathStyle: true, // obrigatório para Garage/S3-compat
    credentials: {
      accessKeyId: env.GARAGE_ACCESS_KEY,
      secretAccessKey: env.GARAGE_SECRET_KEY,
    },
  });

  const service: GarageService = {
    client,
    async presignDownload(bucket, key, expiresIn = 3600) {
      return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn });
    },
    async presignUpload(bucket, key, contentType, expiresIn = 3600) {
      return getSignedUrl(
        client,
        new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
        { expiresIn },
      );
    },
    async putObject(bucket, key, body, contentType) {
      await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }));
    },
    async deleteObject(bucket, key) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
  };

  app.decorate('garage', service);
});
