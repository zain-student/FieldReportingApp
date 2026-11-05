import ReactNativeBlobUtil from 'react-native-blob-util';
const fs = ReactNativeBlobUtil.fs;
const IMAGE_DIRECTORY = `${fs.dirs.DocumentDir}/field-reporting/images`;
function normalizePath(path: string): string {
  return path.startsWith('file://') ? path.slice(7) : path;
}
/**
 * Creates the permanent image directory.
 */
async function ensureImageDirectory(): Promise<void> {
  const exists = await fs.exists(IMAGE_DIRECTORY);

  if (!exists) {
    await fs.mkdir(IMAGE_DIRECTORY);
  }
}

/**
 * Returns the actual size of a file.
 */
export async function getFileSize(path: string): Promise<number> {
  const normalizedPath = normalizePath(path);

  const exists = await fs.exists(normalizedPath);

  if (!exists) {
    throw new Error(`Image file does not exist: ${normalizedPath}`);
  }

  const file = await fs.stat(normalizedPath);
  const size = Number(file.size);

  if (!Number.isFinite(size) || size <= 0) {
    throw new Error('Invalid image file size.');
  }

  return size;
}

/**
 * Copies an image into permanent application storage.
 */
export async function saveImagePermanently(
  sourcePath: string,
  imageId: string,
): Promise<{ localPath: string; sizeBytes: number }> {
  await ensureImageDirectory();

  const source = normalizePath(sourcePath);

  const destination = `${IMAGE_DIRECTORY}/${imageId}.jpg`;

  const sourceExists = await fs.exists(source);

  if (!sourceExists) {
    throw new Error('Temporary processed image does not exist.');
  }

  try {
    await fs.cp(source, destination);

    // Verify that the permanent copy exists.
    const copiedFileExists = await fs.exists(destination);

    if (!copiedFileExists) {
      throw new Error('Permanent image copy was not created.');
    }

    const sizeBytes = await getFileSize(destination);

    console.log('[IMAGE STORAGE] Image saved:', {
      imageId,
      destination,
      sizeBytes,
    });

    return {
      localPath: destination,
      sizeBytes,
    };
  } catch (error) {
    await deleteLocalImage(destination);
    throw error;
  }
}

/**
 * Calculates SHA-256 checksum.
 */
export async function calculateImageHash(localPath: string): Promise<string> {
  const path = normalizePath(localPath);

  if (!(await fs.exists(path))) {
    throw new Error('Cannot hash an image that does not exist.');
  }

  const hash = await fs.hash(path, 'sha256');

  if (!hash) {
    throw new Error('Unable to calculate image checksum.');
  }

  return hash;
}

/**
 * Converts a stored filesystem path into an
 * Android-compatible image URI.
 */
export function getLocalImageUri(localPath: string): string {
  if (localPath.startsWith('file://') || localPath.startsWith('content://')) {
    return localPath;
  }

  return `file://${localPath}`;
}

/**
 * Deletes one local image.
 */
export async function deleteLocalImage(path: string): Promise<void> {
  try {
    const normalizedPath = normalizePath(path);

    if (await fs.exists(normalizedPath)) {
      await fs.unlink(normalizedPath);
    }
  } catch (error) {
    console.warn('[IMAGE STORAGE] Cleanup failed:', error);
  }
}
