# Field Reporting App

A React Native mobile application designed for field inspectors to create photo-based reports and deliver them reliably to a remote server, even under unstable or intermittent network conditions.

The application supports offline report creation, local persistence, image processing, upload synchronization, and server-side report review.

## 1. Core Features

### Report Composition

- Create reports with a required, non-empty description.
- Capture photographs using the device camera.
- Select photographs from the device gallery.
- Attach between 1 and 5 images per report.
- Validate image count and file size before submission.

### Image Processing

- Resize and compress original photographs before uploading.
- Convert processed images to JPEG format.
- Enforce a maximum image size of 5 MB per image.
- Preserve image quality while reducing file size.
- Calculate SHA-256 hashes for processed images.

### Offline Support

- Save report information locally before attempting synchronization.
- Store processed image files in the application's persistent storage.
- Maintain pending reports when internet connectivity is unavailable.
- Detect network connectivity changes and trigger synchronization.

### Report Synchronization

- Upload report information to Supabase.
- Upload associated images to Supabase Storage.
- Maintain upload status for individual reports and images.
- Retry unsuccessful uploads.
- Use deterministic report and image identifiers to support idempotent upload operations.

### Server-Side Review

- Retrieve reports directly from Supabase.
- Display server-stored report information.
- Retrieve and display associated images from Supabase Storage.

## 2. Technology Stack

| Technology                 | Purpose                            |
| -------------------------- | ---------------------------------- |
| React Native CLI           | Cross-platform mobile application  |
| TypeScript                 | Type safety and maintainable code  |
| Supabase                   | Backend services and database      |
| PostgreSQL                 | Report and image metadata          |
| Supabase Storage           | Remote image storage               |
| MMKV                       | Local report persistence           |
| React Native Blob Util     | File handling, hashing and uploads |
| React Native Image Picker  | Camera and gallery selection       |
| React Native Image Resizer | Image resizing and compression     |
| NetInfo                    | Network connectivity monitoring    |
| Redux Toolkit              | Application state management       |
| React Navigation           | Screen navigation                  |

## 3. Application Architecture

The application separates report composition, local persistence, image processing, and synchronization logic.

### Local Persistence

Report metadata is stored using MMKV. Processed image files are copied into the application's persistent document directory so that they remain available after the application is closed or restarted.

### Image Processing

Selected photographs are processed before being saved. Images are resized, compressed, converted to JPEG, and checked against the application's file-size limit.

### Synchronization

The synchronization layer retrieves pending reports from local storage and uploads their report data and images to Supabase.

Unique report and image identifiers are reused during retry operations. Database upserts and Storage upserts help prevent duplicate records and objects.

### Server Review

The Server screen retrieves report data from Supabase rather than displaying locally stored report records. Associated images are retrieved from remote Storage.

## 4. Prerequisites

- Node.js 22 or compatible version.
- JDK 17.
- Android Studio.
- Android SDK and platform tools.
- A physical Android device or Android emulator.
- A Supabase project.

The application is built using React Native CLI, not Expo managed workflow.

## 5. Installation and Setup

### Clone the Repository

```bash
git clone https://github.com/zain-student/FieldReportingApp.git

cd FieldReportingApp
```

### Install Dependencies

```bash
npm install
```

### Configure Supabase

Create a Supabase project and configure the application with:

- Supabase project URL.
- Supabase publishable key.
- Anonymous authentication enabled.
- PostgreSQL database tables.
- Row Level Security policies.
- A private Storage bucket named `report-images`.

Configure the Supabase client in the application's Supabase configuration file.

**Security:** Never commit service-role keys, database passwords, or other privileged credentials to the repository.

### Database Configuration

The backend uses two main tables:

**reports**

Stores report information, including:

- `id`
- `inspector_id`
- `description`
- `client_created_at`
- `created_at`
- `updated_at`
- `sync_status`

**report_images**

Stores image metadata, including:

- `id`
- `report_id`
- `inspector_id`
- `storage_path`
- `mime_type`
- `size_bytes`
- `sha256`
- `uploaded_at`

Report IDs and image IDs are UUIDs. The report-image relationship uses a foreign key with cascading deletion.

Enable Row Level Security on both tables and configure policies so that authenticated inspectors can access only their own records.

### Storage Configuration

Create a private Supabase Storage bucket:

`report-images`

Images are organized using inspector, report, and image identifiers:

```text
{inspectorId}/
    reports/
        {reportId}/
            images/
                {imageId}.jpg
```

Configure Storage policies to restrict access to the authenticated inspector's own files.

## 6. Running the Application

### Start Metro

```bash
npm start
```

### Build and Run on Android

Open another terminal:

```bash
npm run android
```

Alternatively, use a connected Android device with USB debugging enabled.

## 7. Reliability and Delivery Strategy

The application is designed to preserve submitted reports locally before network synchronization begins.

The delivery strategy includes:

- Persistent local report records.
- Persistent local image files.
- Network connectivity monitoring.
- Retry handling for unsuccessful synchronization attempts.
- Stable report and image identifiers.
- Database upserts to avoid duplicate metadata records.
- Storage upserts to avoid duplicate image objects.
- Server-side verification through the Server screen.

A report is marked as uploaded only after its report information, associated image objects, and image metadata have been successfully synchronized.

**Important:** The current implementation uses React Native network monitoring to trigger synchronization while the application process is running. Reliable unattended synchronization after process termination through native WorkManager is not yet completed and should not be considered a verified delivery guarantee.

## 8. Testing

The following scenarios should be used to evaluate the application:

| Test scenario             | Expected behaviour                               |
| ------------------------- | ------------------------------------------------ |
| Empty description         | Submission is rejected                           |
| Zero images               | Submission is rejected                           |
| Six images                | Submission is rejected                           |
| One image                 | Report can be submitted                          |
| Five images               | Report can be submitted                          |
| Large original photograph | Image is resized and compressed                  |
| Image exceeding 5 MB      | Image is not uploaded                            |
| Camera permission denied  | Permission denial is handled                     |
| Gallery permission denied | Permission denial is handled                     |
| Airplane mode enabled     | Reports remain saved locally                     |
| Internet restored         | Pending reports can synchronize                  |
| Application restarted     | Locally saved reports remain available           |
| Interrupted upload        | Failed synchronization can be retried            |
| Repeated upload attempts  | Existing report and image identifiers are reused |
| Server review             | Data is retrieved from Supabase                  |

Testing should also include throttled network conditions and verification of the final report and image counts in Supabase.

## 9. Backend Failure Testing

Network failure scenarios can be tested by:

1. Enabling airplane mode during report submission.
2. Restoring connectivity and observing synchronization.
3. Interrupting connectivity during image uploads.
4. Testing with a throttled network connection.
5. Checking whether failed uploads can be retried.

Controlled backend responses, such as forced HTTP errors and requests that hang without responding, require an additional failure-injection mechanism. These scenarios should be documented and tested before claiming full backend failure coverage.

## 10. Reset Behaviour

The assessment requires a deliberate reset operation with a clearly defined blast radius.

The reset implementation and its effect on local report records, local image files, pending synchronization work, and remote Supabase data must be documented here before submission.

Do not assume that deleting local data also deletes remote data.

## 11. Repository

GitHub: https://github.com/zain-student/FieldReportingApp

---

**Project:** Field Reporting App  
**Platform:** Android  
**Framework:** React Native CLI  
**Language:** TypeScript  
**Backend:** Supabase
