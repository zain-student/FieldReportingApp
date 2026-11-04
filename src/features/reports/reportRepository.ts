import { appStorage } from '../../storage/mmkv';

import { MAX_IMAGE_BYTES, MAX_REPORT_IMAGES, ReportRecord } from './types';

const REPORT_KEY_PREFIX = 'report:v1:';

function getReportKey(reportId: string): string {
  return `${REPORT_KEY_PREFIX}${reportId}`;
}

function isValidReportRecord(value: unknown): value is ReportRecord {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const report = value as Partial<ReportRecord>;

  return (
    report.schemaVersion === 1 &&
    typeof report.id === 'string' &&
    typeof report.description === 'string' &&
    typeof report.createdAt === 'number' &&
    typeof report.updatedAt === 'number' &&
    Array.isArray(report.images) &&
    report.images.length >= 1 &&
    report.images.length <= MAX_REPORT_IMAGES
  );
}

function parseReport(raw: string): ReportRecord {
  const parsed: unknown = JSON.parse(raw);

  if (!isValidReportRecord(parsed)) {
    throw new Error('Invalid stored report record.');
  }

  return parsed;
}

/**
 * Save a new report after its image files
 * have been copied to permanent local storage.
 */
export function saveReport(report: ReportRecord): void {
  const key = getReportKey(report.id);

  if (appStorage.contains(key)) {
    throw new Error('This report already exists.');
  }

  if (!report.description.trim()) {
    throw new Error('Description is required.');
  }

  if (report.images.length < 1 || report.images.length > MAX_REPORT_IMAGES) {
    throw new Error('A report must have between 1 and 5 images.');
  }

  for (const image of report.images) {
    if (image.sizeBytes <= 0 || image.sizeBytes > MAX_IMAGE_BYTES) {
      throw new Error('Image exceeds the allowed size.');
    }
  }

  if (!isValidReportRecord(report)) {
    throw new Error('Invalid report data.');
  }

  // Synchronous persistent write.
  appStorage.set(key, JSON.stringify(report));
}

/**
 * Retrieve one report from local storage.
 */
export function getReport(reportId: string): ReportRecord | null {
  const raw = appStorage.getString(getReportKey(reportId));

  if (raw === undefined) {
    return null;
  }

  return parseReport(raw);
}

/**
 * Retrieve all locally stored reports.
 * The queue is reconstructed from these records.
 */
export function getAllReports(): ReportRecord[] {
  return appStorage
    .getAllKeys()
    .filter(key => key.startsWith(REPORT_KEY_PREFIX))
    .map(key => {
      const raw = appStorage.getString(key);

      if (raw === undefined) {
        throw new Error(`Missing report data for ${key}.`);
      }

      return parseReport(raw);
    })
    .sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Update one complete report record.
 * Keep this operation synchronous.
 */
export function updateReport(
  reportId: string,
  updater: (current: ReportRecord) => ReportRecord,
): ReportRecord {
  const current = getReport(reportId);

  if (!current) {
    throw new Error('Report not found.');
  }

  const updated = {
    ...updater(current),
    updatedAt: Date.now(),
  };

  if (updated.id !== reportId || !isValidReportRecord(updated)) {
    throw new Error('Invalid report update.');
  }

  appStorage.set(getReportKey(reportId), JSON.stringify(updated));

  return updated;
}

/**
 * Remove one local report record.
 * Image file deletion will be handled separately.
 */
export function removeReportRecord(reportId: string): void {
  appStorage.remove(getReportKey(reportId));
}
