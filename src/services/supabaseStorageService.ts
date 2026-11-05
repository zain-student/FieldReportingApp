import ReactNativeBlobUtil from 'react-native-blob-util';
import type { ReportImage } from '../features/reports/types';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, supabase } from './supabase';
const BUCKET_NAME = 'report-images';

function encodeStoragePath(path: string): string {
  return path
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/');
}

export interface UploadedImage {
  imageId: string;
  storagePath: string;
}

export async function uploadReportImage(
  image: ReportImage,
  reportId: string,
  inspectorId: string,
): Promise<UploadedImage> {
  // Confirm that the current session belongs to this inspector.
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  const session = sessionData.session;

  if (!session || session.user.id !== inspectorId) {
    throw new Error('Inspector authentication is invalid.');
  }

  // Confirm that the permanent local image still exists.
  const localPath = image.localPath.replace(/^file:\/\//, '');

  const fileExists = await ReactNativeBlobUtil.fs.exists(localPath);

  if (!fileExists) {
    throw new Error('Local photograph could not be found.');
  }

  // Build a deterministic remote path.
  const storagePath = `${inspectorId}/reports/${reportId}/images/${image.id}.jpg`;

  const encodedPath = encodeStoragePath(storagePath);

  const uploadUrl =
    `${SUPABASE_URL}/storage/v1/object/` + `${BUCKET_NAME}/${encodedPath}`;

  // Upload the file directly without Base64 conversion.
  const response = await ReactNativeBlobUtil.fetch(
    'POST',
    uploadUrl,
    {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': image.mimeType,
      'x-upsert': 'true',
      'cache-control': '3600',
    },
    ReactNativeBlobUtil.wrap(localPath),
  );

  const status = response.info().status;

  if (status < 200 || status >= 300) {
    throw new Error(`Image upload failed (${status}): ${response.data()}`);
  }

  return {
    imageId: image.id,
    storagePath,
  };
}
