import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { uploadFile } from '@/lib/google-cloud-storage'

// GET /api/groups/[id]/milestones/[milestoneId]/submissions - Get submissions for a milestone
export async function GET(
  request: NextRequest,
  {params}: { params: Promise<{ id: string, milestoneId: string }> }
) {
  try {
    const { milestoneId } = await params

    const submissions = await prisma.milestoneSubmission.findMany({
      where: { milestoneId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    })

    // Transform to match MilestoneCard component format
    const transformedSubmissions = submissions.map(sub => ({
      id: sub.id,
      user: sub.user.name,
      avatar: sub.user.avatar || sub.user.name.charAt(0),
      content: sub.content,
      files: sub.files || [],
      submittedAt: sub.submittedAt.toISOString().split('T')[0],
      aiVerified: sub.aiVerified,
      aiComment: sub.aiComment
    }))

    return NextResponse.json({ submissions: transformedSubmissions })
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}

// POST /api/groups/[id]/milestones/[milestoneId]/submissions - Submit work for a milestone
export async function POST(
  request: NextRequest,
  {params}: { params: Promise<{ id: string, milestoneId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { milestoneId, id: groupId } = await params
    
    // Handle both FormData (with files) and JSON (text only)
    let content = ''
    let uploadedFiles: string[] = []
    
    const contentType = request.headers.get('content-type') || ''
    
    if (contentType.includes('multipart/form-data')) {
      // Handle file upload via FormData
      const formData = await request.formData()
      const textContent = formData.get('content') as string
      const files = formData.getAll('files') as File[]
      
      if (!textContent) {
        return NextResponse.json(
          { error: 'Content is required' },
          { status: 400 }
        )
      }
      
      content = textContent
      
      // Upload files to Google Cloud Storage
      for (const file of files) {
        if (file.size > 0) {
          const buffer = Buffer.from(await file.arrayBuffer())
          
          const uploadResult = await uploadFile(
            buffer,
            file.name,
            {
              contentType: file.type,
              metadata: {
                milestoneId,
                groupId,
                uploadedBy: session.user.id,
                uploadedAt: new Date().toISOString()
              }
            }
          )
          
          uploadedFiles.push(uploadResult.url)
        }
      }
    } else {
      // Handle JSON metadata (text-only submission)
      const body = await request.json()
      const { content: textContent, files = [] } = body
      
      if (!textContent) {
        return NextResponse.json(
          { error: 'Content is required' },
          { status: 400 }
        )
      }
      
      content = textContent
      uploadedFiles = files
    }

    // Check if milestone exists and user is a member of the group
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        group: true
      }
    })

    if (!milestone) {
      return NextResponse.json(
        { error: 'Milestone not found' },
        { status: 404 }
      )
    }

    const submission = await prisma.milestoneSubmission.create({
      data: {
        content,
        files: uploadedFiles,
        userId: session.user.id,
        milestoneId,
        aiVerified: false // Will be verified by AI later
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

    fetch(`${process.env.NEXTAUTH_URL}/api/groups/${milestone.group.id}/milestones/review`, {
      method: 'POST',
      body: JSON.stringify({
        submissionId: submission.id,
      })
    });
    
    // Transform to match MilestoneCard component format
    const transformedSubmission = {
      id: submission.id,
      user: submission.user.name,
      avatar: submission.user.avatar || submission.user.name.charAt(0),
      content: submission.content,
      files: submission.files || [],
      submittedAt: submission.submittedAt.toISOString().split('T')[0],
      aiVerified: submission.aiVerified,
      aiComment: submission.aiComment
    }

    return NextResponse.json({ submission: transformedSubmission }, { status: 201 })
  } catch (error) {
    console.error('Error creating submission:', error)
    return NextResponse.json(
      { error: 'Failed to create submission' },
      { status: 500 }
    )
  }
}
