import ReactNativeBlobUtil from 'react-native-blob-util';

const fs = ReactNativeBlobUtil.fs;

const IMAGE_DIRECTORY = `${fs.dirs.DocumentDir}/field-reporting/images`;

function normalizePath(path: string): string {
  return path.startsWith('file://') ? path.slice('file://'.length) : path;
}

async function ensureImageDirectory(): Promise<void> {
  const exists = await fs.exists(IMAGE_DIRECTORY);

  if (!exists) {
    await fs.mkdir(IMAGE_DIRECTORY);
  }
}

export async function getFileSize(path: string): Promise<number> {
  const file = await fs.stat(normalizePath(path));
  const size = Number(file.size);

  if (!Number.isFinite(size) || size <= 0) {
    throw new Error('Unable to determine image file size.');
  }

  return size;
}

export async function saveImagePermanently(
  sourcePath: string,
  imageId: string,
): Promise<{ localPath: string; sizeBytes: number }> {
  await ensureImageDirectory();

  const destination = `${IMAGE_DIRECTORY}/${imageId}.jpg`;

  try {
    await fs.cp(normalizePath(sourcePath), destination);

    const sizeBytes = await getFileSize(destination);

    return {
      localPath: destination,
      sizeBytes,
    };
  } catch (error) {
    await deleteLocalImage(destination);
    throw error;
  }
}

export async function calculateImageHash(localPath: string): Promise<string> {
  const hash = await fs.hash(normalizePath(localPath), 'sha256');

  if (!hash) {
    throw new Error('Unable to calculate image checksum.');
  }

  return hash;
}

export async function deleteLocalImage(path: string): Promise<void> {
  try {
    const normalizedPath = normalizePath(path);
    const exists = await fs.exists(normalizedPath);

    if (exists) {
      await fs.unlink(normalizedPath);
    }
  } catch {
    // Cleanup must not hide the original operation error.
  }
}

export async function removeAllLocalImages(): Promise<void> {
  const exists = await fs.exists(IMAGE_DIRECTORY);

  if (exists) {
    await fs.unlink(IMAGE_DIRECTORY);
  }
}
