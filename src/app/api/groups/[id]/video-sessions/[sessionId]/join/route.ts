import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'


// POST /api/video-sessions/[id]/join - Join a video session
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const videoSessionId = params.sessionId

    // Check if video session exists
    const videoSession = await prisma.videoSession.findUnique({
      where: { id: videoSessionId },
      include: {
        group: {
          include: {
            members: {
              where: { userId: session.user.id }
            }
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

    // Check if user already joined
    const existingParticipant = await prisma.videoSessionParticipant.findFirst({
      where: {
        videoSessionId,
        userId: session.user.id
      }
    })

    if (existingParticipant) {
      return NextResponse.json(
        { error: 'You have already joined this session' },
        { status: 400 }
      )
    }

    // Join the session
    const participant = await prisma.videoSessionParticipant.create({
      data: {
        userId: session.user.id,
        videoSessionId,
        joinedAt: new Date()
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

    return NextResponse.json({ participant }, { status: 201 })
  } catch (error) {
    console.error('Error joining video session:', error)
    return NextResponse.json(
      { error: 'Failed to join video session' },
      { status: 500 }
    )
  }
}
