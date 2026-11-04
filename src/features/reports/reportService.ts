import uuid from 'react-native-uuid';
import type { Asset } from 'react-native-image-picker';

import type { ReportRecord } from './types';

import { processReportImages } from '../../services/images/imageProcessor';
import { deleteLocalImage } from '../../services/images/imageFileStore';
import { saveReport } from './reportRepository';

export interface CreateReportInput {
  description: string;
  images: Asset[];
}

export interface CreateReportProgress {
  completed: number;
  total: number;
}

export async function createLocalReport(
  input: CreateReportInput,
  onProgress?: (progress: CreateReportProgress) => void,
): Promise<ReportRecord> {
  const description = input.description.trim();

  // Validate before processing any images.
  if (!description) {
    throw new Error('Report description is required.');
  }

  if (input.images.length < 1 || input.images.length > 5) {
    throw new Error('Select between 1 and 5 photographs.');
  }

  // Generate the ID once and persist it with this report.
  const reportId = String(uuid.v4());

  // Process photographs sequentially.
  const images = await processReportImages(input.images, reportId, onProgress);

  const now = Date.now();

  const report: ReportRecord = {
    schemaVersion: 1,
    id: reportId,
    description,
    createdAt: now,
    updatedAt: now,
    status: 'queued',
    retryCount: 0,
    nextRetryAt: null,
    lastError: null,
    images,
  };

  try {
    // This synchronous write is the local submission boundary.
    saveReport(report);

    return report;
  } catch (error) {
    // If persistence fails, remove all files belonging
    // to this incomplete report.
    await Promise.all(images.map(image => deleteLocalImage(image.localPath)));

    throw error;
  }
}
