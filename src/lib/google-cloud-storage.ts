import { Storage } from '@google-cloud/storage';

// Initialize Google Cloud Storage client
// Initialize Google Cloud Storage client with fallback options
let storage: Storage;

try {
  if (process.env.GOOGLE_CLOUD_PRIVATE_KEY && process.env.GOOGLE_CLOUD_CLIENT_EMAIL) {
    // Option 1: Use individual credential fields (recommended)
    console.log('Using individual credential fields');
    const credentials = {
      type: 'service_account',
      project_id: process.env.GOOGLE_CLOUD_PROJECT_ID,
      private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    };
    console.log('Credentials created, project_id:', credentials.project_id);
    
    storage = new Storage({
      credentials,
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    });
  } else if (process.env.GOOGLE_CLOUD_CREDENTIALS) {
    // Option 2: Use full credentials JSON
    console.log('Using full credentials JSON');
    const credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS || '{}');
    console.log('Credentials parsed successfully, project_id:', credentials.project_id);
    
    storage = new Storage({
      credentials,
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    });
  } else {
    // Option 3: Use Application Default Credentials
    console.log('Using Application Default Credentials');
    storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    });
  }
} catch (error) {
  console.error('Error initializing Google Cloud Storage:', error);
  console.error('Error details:', {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined
  });
  // Fallback to basic configuration
  storage = new Storage({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  });
}

const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET;

if (!bucketName) {
  throw new Error('GOOGLE_CLOUD_STORAGE_BUCKET environment variable is required');
}

const bucket = storage.bucket(bucketName);

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface FileUploadResult {
  url: string;
  filename: string;
  size: number;
  contentType: string;
}

/**
 * Upload a file to Google Cloud Storage
 */
export async function uploadFile(
  file: Buffer | string,
  filename: string,
  options: UploadOptions = {}
): Promise<FileUploadResult> {
  try {
    console.log('Starting file upload:', { filename, contentType: options.contentType });
    
    const fileBuffer = typeof file === 'string' ? Buffer.from(file) : file;
    console.log('File buffer size:', fileBuffer.length);
    
    // Generate unique filename to prevent conflicts
    const fileExtension = filename.split('.').pop() || '';
    const baseName = filename.replace(`.${fileExtension}`, '');
    const uniqueFilename = `${baseName}-${Date.now()}.${fileExtension}`;
    console.log('Generated filename:', uniqueFilename);
    
    const fileUpload = bucket.file(uniqueFilename);
    console.log('File object created');
    
    const uploadOptions = {
      metadata: {
        contentType: options.contentType || 'application/octet-stream',
        metadata: options.metadata || {},
      },
    };

    console.log('Upload options:', uploadOptions);
    await fileUpload.save(fileBuffer, uploadOptions);
    console.log('File saved successfully');
    
    // Note: With UBLA enabled, we can't use makePublic() on individual objects
    // Files will be accessible based on bucket-level IAM permissions
    // For public access, you need to grant allUsers:objectViewer to the bucket
    console.log('File uploaded successfully (UBLA mode)');

    const [metadata] = await fileUpload.getMetadata();
    console.log('File metadata retrieved:', metadata);
    
    // Generate a signed URL for secure access (works with UBLA)
    const [signedUrl] = await fileUpload.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });
    
    const result = {
      url: signedUrl,
      filename: uniqueFilename,
      size: parseInt(metadata.size as string || '0'),
      contentType: metadata.contentType || 'application/octet-stream',
    };
    
    console.log('Upload result:', result);
    return result;
  } catch (error) {
    console.error('Error uploading file to Google Cloud Storage:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as { code?: string })?.code,
      status: (error as { status?: string })?.status,
      stack: error instanceof Error ? error.stack : undefined
    });
    throw new Error('Failed to upload file');
  }
}

/**
 * Upload a file from a stream (useful for large files)
 */
export async function uploadFileFromStream(
  stream: NodeJS.ReadableStream,
  filename: string,
  options: UploadOptions = {}
): Promise<FileUploadResult> {
  try {
    const fileExtension = filename.split('.').pop() || '';
    const baseName = filename.replace(`.${fileExtension}`, '');
    const uniqueFilename = `${baseName}-${Date.now()}.${fileExtension}`;
    
    const fileUpload = bucket.file(uniqueFilename);
    
    const uploadOptions = {
      metadata: {
        contentType: options.contentType || 'application/octet-stream',
        metadata: options.metadata || {},
      },
    };

    await new Promise((resolve, reject) => {
      stream
        .pipe(fileUpload.createWriteStream(uploadOptions))
        .on('error', reject)
        .on('finish', resolve);
    });

    // Note: With UBLA enabled, we can't use makePublic() on individual objects

    const [metadata] = await fileUpload.getMetadata();
    
    // Generate a signed URL for secure access (works with UBLA)
    const [signedUrl] = await fileUpload.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });
    
    return {
      url: signedUrl,
      filename: uniqueFilename,
      size: parseInt(metadata.size as string || '0'),
      contentType: metadata.contentType || 'application/octet-stream',
    };
  } catch (error) {
    console.error('Error uploading file stream to Google Cloud Storage:', error);
    throw new Error('Failed to upload file');
  }
}

/**
 * Generate a signed URL for secure file access
 */
export async function generateSignedUrl(
  filename: string,
  action: 'read' | 'write' = 'read',
  expiresInMinutes: number = 60
): Promise<string> {
  try {
    const file = bucket.file(filename);
    
    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action,
      expires: Date.now() + expiresInMinutes * 60 * 1000,
    });
    
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error('Failed to generate signed URL');
  }
}

/**
 * Delete a file from Google Cloud Storage
 */
export async function deleteFile(filename: string): Promise<void> {
  try {
    await bucket.file(filename).delete();
  } catch (error) {
    console.error('Error deleting file from Google Cloud Storage:', error);
    throw new Error('Failed to delete file');
  }
}

/**
 * Get file metadata
 */
export async function getFileMetadata(filename: string) {
  try {
    const [metadata] = await bucket.file(filename).getMetadata();
    return metadata;
  } catch (error) {
    console.error('Error getting file metadata:', error);
    throw new Error('Failed to get file metadata');
  }
}

/**
 * List files in bucket with optional prefix
 */
export async function listFiles(prefix?: string): Promise<string[]> {
  try {
    console.log('Attempting to list files from bucket:', bucketName);
    console.log('Storage configuration:', {
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      hasCredentials: !!process.env.GOOGLE_CLOUD_CREDENTIALS,
      hasKeyFile: !!process.env.GOOGLE_CLOUD_KEY_FILE,
      bucketName
    });
    
    const [files] = await bucket.getFiles({ prefix });
    console.log('Successfully listed files:', files.length);
    return files.map(file => file.name);
  } catch (error) {
    console.error('Error listing files:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as { code?: string })?.code,
      status: (error as { status?: string })?.status
    });
    throw new Error('Failed to list files');
  }
}

export { storage, bucket };
