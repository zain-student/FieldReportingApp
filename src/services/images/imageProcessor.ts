import ImageResizer from '@bam.tech/react-native-image-resizer';
import { Asset } from 'react-native-image-picker';
import uuid from 'react-native-uuid';

import {
  MAX_IMAGE_BYTES,
  MAX_REPORT_IMAGES,
  ReportImage,
} from '../../features/reports/types';

import {
  calculateImageHash,
  deleteLocalImage,
  getFileSize,
  saveImagePermanently,
} from './imageFileStore';

const COMPRESSION_PROFILES = [
  { dimension: 2560, quality: 88 },
  { dimension: 2304, quality: 85 },
  { dimension: 2048, quality: 82 },
  { dimension: 1920, quality: 78 },
  { dimension: 1600, quality: 74 },
  { dimension: 1280, quality: 70 },
  { dimension: 1024, quality: 65 },
];

export interface ProcessingProgress {
  completed: number;
  total: number;
}

async function processSingleImage(
  asset: Asset,
  reportId: string,
): Promise<ReportImage> {
  if (!asset.uri) {
    throw new Error('Selected photograph has no valid URI.');
  }

  // Generate once and reuse for all compression attempts.
  const imageId = String(uuid.v4());

  for (const profile of COMPRESSION_PROFILES) {
    let temporaryPath: string | null = null;
    let permanentPath: string | null = null;

    try {
      const resized = await ImageResizer.createResizedImage(
        asset.uri,
        profile.dimension,
        profile.dimension,
        'JPEG',
        profile.quality,
        0,
        undefined,
        false,
        {
          mode: 'contain',
          onlyScaleDown: true,
        },
      );

      temporaryPath = resized.path;

      // Verify the actual compressed file size.
      const processedSize = await getFileSize(temporaryPath);

      if (processedSize > MAX_IMAGE_BYTES) {
        continue;
      }

      // Copy the accepted image to permanent storage.
      const saved = await saveImagePermanently(temporaryPath, imageId);

      permanentPath = saved.localPath;

      // Independently verify the permanent copy.
      if (saved.sizeBytes > MAX_IMAGE_BYTES) {
        await deleteLocalImage(permanentPath);
        permanentPath = null;
        continue;
      }

      // Calculate checksum for integrity verification.
      const sha256 = await calculateImageHash(permanentPath);

      const reportImage: ReportImage = {
        id: imageId,
        localPath: permanentPath,
        storagePath: `reports/${reportId}/images/${imageId}.jpg`,
        mimeType: 'image/jpeg',
        sizeBytes: saved.sizeBytes,
        sha256,
        status: 'pending',
        uploadedAt: null,
      };

      // Ownership of the permanent file is transferred
      // to the report. Do not delete it in finally.
      permanentPath = null;

      return reportImage;
    } finally {
      // Always remove the temporary compressed file.
      if (temporaryPath) {
        await deleteLocalImage(temporaryPath);
      }

      // Remove permanent files if processing failed.
      // Successfully returned files are preserved.
      if (permanentPath) {
        await deleteLocalImage(permanentPath);
      }
    }
  }

  throw new Error(
    'Unable to compress this photograph below the 5 MB limit. ' +
      'The original image has not been uploaded.',
  );
}

export async function processReportImages(
  assets: Asset[],
  reportId: string,
  onProgress?: (progress: ProcessingProgress) => void,
): Promise<ReportImage[]> {
  if (assets.length < 1 || assets.length > MAX_REPORT_IMAGES) {
    throw new Error(
      `A report must contain between 1 and ${MAX_REPORT_IMAGES} photographs.`,
    );
  }

  const processedImages: ReportImage[] = [];

  try {
    for (const asset of assets) {
      const image = await processSingleImage(asset, reportId);

      processedImages.push(image);

      onProgress?.({
        completed: processedImages.length,
        total: assets.length,
      });
    }

    return processedImages;
  } catch (error) {
    // If one image fails, clean up all successfully
    // processed images belonging to this incomplete report.
    await Promise.all(
      processedImages.map(image => deleteLocalImage(image.localPath)),
    );

    throw error;
  }
}
