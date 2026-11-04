// Defining these types so every service will use the same type definition
export type ReportStatus =
  | 'queued'
  | 'uploading'
  | 'retry_wait'
  | 'finalizing'
  | 'uploaded'
  | 'needs_attention';

export type ImageUploadStatus = 'pending' | 'uploading' | 'uploaded';

export interface ReportImage {
  id: string;
  localPath: string;
  storagePath: string;
  mimeType: 'image/jpeg';
  sizeBytes: number;
  sha256: string;
  status: ImageUploadStatus;
  uploadedAt: number | null;
}

export interface ReportRecord {
  schemaVersion: 1;
  id: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  status: ReportStatus;
  retryCount: number;
  nextRetryAt: number | null;
  lastError: string | null;
  images: ReportImage[];
}

export const MAX_REPORT_IMAGES = 5;

// Keep a safety margin below the 5 MB destination limit.
export const MAX_IMAGE_BYTES = 4_700_000;
