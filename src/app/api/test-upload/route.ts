import { NextRequest, NextResponse } from 'next/server'
import { uploadFile, listFiles } from '@/lib/google-cloud-storage'

// Test endpoint for Google Cloud Storage
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Upload to Google Cloud Storage
    const uploadResult = await uploadFile(
      buffer,
      file.name,
      {
        contentType: file.type,
        metadata: {
          testUpload: 'true',
          uploadedAt: new Date().toISOString()
        }
      }
    )
    
    // List files to verify upload
    const files = await listFiles()
    
    return NextResponse.json({
      success: true,
      uploadResult,
      totalFilesInBucket: files.length,
      message: 'File uploaded successfully to Google Cloud Storage!'
    })
    
  } catch (error) {
    console.error('Test upload error:', error)
    return NextResponse.json({
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint to test bucket access
export async function GET() {
  try {
    const files = await listFiles()
    
    return NextResponse.json({
      success: true,
      totalFiles: files.length,
      files: files.slice(0, 10), // Show first 10 files
      message: 'Successfully connected to Google Cloud Storage!'
    })
    
  } catch (error) {
    console.error('Test connection error:', error)
    return NextResponse.json({
      error: 'Connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
