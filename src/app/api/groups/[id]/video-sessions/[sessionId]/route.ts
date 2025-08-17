import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET /api/video-sessions/[id] - Get a specific video session
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId
    const videoSession = await prisma.videoSession.findUnique({
      where: { id: sessionId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    if (!videoSession) {
      return NextResponse.json(
        { error: 'Video session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ videoSession })
  } catch (error) {
    console.error('Error fetching video session:', error)
    return NextResponse.json(
      { error: 'Failed to fetch video session' },
      { status: 500 }
    )
  }
}

// PUT /api/video-sessions/[id] - Update a video session
export async function PUT(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId
    const body = await request.json()
    const { title, description, startTime, endTime, meetingUrl, status } = body

    const videoSession = await prisma.videoSession.update({
      where: { id: sessionId },
      data: {
        title,
        description,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        meetingUrl,
        status
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    return NextResponse.json({ videoSession })
  } catch (error) {
    console.error('Error updating video session:', error)
    return NextResponse.json(
      { error: 'Failed to update video session' },
      { status: 500 }
    )
  }
}

// DELETE /api/video-sessions/[id] - Delete a video session
export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId

    await prisma.videoSession.delete({
      where: { id: sessionId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting video session:', error)
    return NextResponse.json(
      { error: 'Failed to delete video session' },
      { status: 500 }
    )
  }
}
