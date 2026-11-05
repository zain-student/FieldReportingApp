import { supabase } from '../../services/supabase';
import { uploadReportImage } from '../../services/supabaseStorageService';

import { getReport, updateReport } from './reportRepository';

async function getInspectorId(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  const inspectorId = data.session?.user.id;

  if (!inspectorId) {
    throw new Error('Inspector authentication is required.');
  }

  return inspectorId;
}

// Prevent two sync attempts for the same report in this JS runtime.
const activeSyncs = new Set<string>();

export async function syncReport(reportId: string): Promise<void> {
  if (activeSyncs.has(reportId)) {
    return;
  }

  activeSyncs.add(reportId);

  try {
    const report = getReport(reportId);

    if (!report) {
      throw new Error('Local report not found.');
    }

    const inspectorId = await getInspectorId();

    // 1. Mark the local report as uploading.
    updateReport(reportId, current => ({
      ...current,
      status: 'uploading',
      lastError: null,
    }));

    // 2. Create or reuse the server report.
    // This must exist before image metadata can pass its RLS policy.
    const { error: reportError } = await supabase.from('reports').upsert(
      {
        id: report.id,
        inspector_id: inspectorId,
        description: report.description,
        client_created_at: new Date(report.createdAt).toISOString(),
        updated_at: new Date().toISOString(),
        sync_status: 'syncing',
      },
      { onConflict: 'id' },
    );

    if (reportError) {
      throw reportError;
    }

    // 3. Upload images and save their server metadata.
    for (const image of report.images) {
      updateReport(reportId, current => ({
        ...current,
        images: current.images.map(item =>
          item.id === image.id ? { ...item, status: 'uploading' } : item,
        ),
      }));

      const uploaded = await uploadReportImage(image, report.id, inspectorId);

      const { error: imageError } = await supabase.from('report_images').upsert(
        {
          id: image.id,
          report_id: report.id,
          inspector_id: inspectorId,
          storage_path: uploaded.storagePath,
          mime_type: image.mimeType,
          size_bytes: image.sizeBytes,
          sha256: image.sha256,
        },
        { onConflict: 'id' },
      );

      if (imageError) {
        throw imageError;
      }

      // Persist successful image progress locally.
      updateReport(reportId, current => ({
        ...current,
        images: current.images.map(item =>
          item.id === image.id
            ? {
                ...item,
                status: 'uploaded',
                uploadedAt: Date.now(),
              }
            : item,
        ),
      }));
    }

    // 4. All images and metadata are confirmed.
    updateReport(reportId, current => ({
      ...current,
      status: 'finalizing',
    }));

    // 5. Finalize the server report.
    const { error: finalizeError } = await supabase
      .from('reports')
      .update({
        sync_status: 'uploaded',
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId)
      .eq('inspector_id', inspectorId);

    if (finalizeError) {
      throw finalizeError;
    }

    // 6. Mark the local report as uploaded.
    updateReport(reportId, current => ({
      ...current,
      status: 'uploaded',
      retryCount: 0,
      nextRetryAt: null,
      lastError: null,
    }));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Report synchronization failed.';

    console.error('Report sync failed:', message);

    // Keep the report and its photographs locally for retry.
    const current = getReport(reportId);

    if (current) {
      updateReport(reportId, report => ({
        ...report,
        status: 'retry_wait',
        retryCount: report.retryCount + 1,
        nextRetryAt: Date.now() + 30_000,
        lastError: message,
      }));
    }

    throw error;
  } finally {
    activeSyncs.delete(reportId);
  }
}
