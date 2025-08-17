import { NextResponse } from 'next/server'
import { storage, bucket } from '@/lib/google-cloud-storage'

export async function GET() {
  try {
    console.log('Testing Google Cloud Storage connection...');
    
    // Test bucket access
    const [exists] = await bucket.exists();
    console.log('Bucket exists:', exists);
    
    if (!exists) {
      return NextResponse.json({
        error: 'Bucket does not exist',
        bucketName: process.env.GOOGLE_CLOUD_STORAGE_BUCKET
      }, { status: 404 });
    }
    
    // Test listing files
    const [files] = await bucket.getFiles({ maxResults: 5 });
    console.log('Files in bucket:', files.length);
    
    // Test bucket metadata
    const [metadata] = await bucket.getMetadata();
    console.log('Bucket metadata:', {
      name: metadata.name,
      location: metadata.location,
      storageClass: metadata.storageClass
    });
    
    return NextResponse.json({
      success: true,
      bucketName: process.env.GOOGLE_CLOUD_STORAGE_BUCKET,
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      bucketExists: exists,
      fileCount: files.length,
      bucketLocation: metadata.location,
      bucketStorageClass: metadata.storageClass
    });
    
  } catch (error) {
    console.error('Storage test error:', error);
    return NextResponse.json({
      error: 'Storage test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      bucketName: process.env.GOOGLE_CLOUD_STORAGE_BUCKET,
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
    }, { status: 500 });
  }
}
