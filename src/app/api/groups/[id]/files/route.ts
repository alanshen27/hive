import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadFile } from '@/lib/google-cloud-storage'

// GET /api/groups/[id]/files - Get all files for a group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params

    const files = await prisma.file.findMany({
      where: {
        groupId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: {
        uploadedAt: 'desc'
      }
    })

    return NextResponse.json({ files })
  } catch (error) {
    console.error('Error fetching files:', error)
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    )
  }
}

// POST /api/groups/[id]/files - Upload a new file
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params
    
    // Handle both FormData (file upload) and JSON (metadata)
    let fileData: any = {}
    
    const contentType = request.headers.get('content-type') || ''
    
    if (contentType.includes('multipart/form-data')) {
      // Handle file upload via FormData
      const formData = await request.formData()
      const file = formData.get('file') as File
      const userId = formData.get('userId') as string
      
      if (!file || !userId) {
        return NextResponse.json(
          { error: 'File and userId are required' },
          { status: 400 }
        )
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
            groupId,
            uploadedBy: userId,
            uploadedAt: new Date().toISOString()
          }
        }
      )
      
      fileData = {
        name: file.name,
        url: uploadResult.url,
        size: uploadResult.size,
        type: uploadResult.contentType,
        userId
      }
    } else {
      // Handle JSON metadata (for existing file URLs)
      const body = await request.json()
      const { name, url, size, type, userId } = body
      
      if (!name || !url || !size || !type || !userId) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        )
      }
      
      fileData = { name, url, size, type, userId }
    }

    // Save file record to database
    const file = await prisma.file.create({
      data: {
        ...fileData,
        groupId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    return NextResponse.json({ file }, { status: 201 })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
