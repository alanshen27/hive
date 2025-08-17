import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'


// POST /api/groups/[id]/video-sessions/[sessionId]/leave - Leave a video session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {

  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { sessionId: videoSessionId } = await params
    const userId = session.user.id

    // Check if video session exists
    const videoSession = await prisma.videoSession.findUnique({
      where: { id: videoSessionId },
      include: {
        group: {
          select: {
            id: true,
            name: true
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

    // Check if user is a participant
    const participant = await prisma.videoSessionParticipant.findUnique({
      where: {
        userId_videoSessionId: {
          userId: userId,
          videoSessionId: videoSessionId
        }
      }
    })

    if (!participant) {
      return NextResponse.json(
        { error: 'You are not a participant in this session' },
        { status: 400 }
      )
    }

    // Remove user from session
    await prisma.videoSessionParticipant.delete({
      where: {
        userId_videoSessionId: {
          userId: userId,
          videoSessionId: videoSessionId
        }
      }
    })

    return NextResponse.json({ 
      success: true,
      message: `Successfully left "${videoSession.title}"`
    })
  } catch (error) {
    console.error('Error leaving video session:', error)
    return NextResponse.json(
      { error: 'Failed to leave video session' },
      { status: 500 }
    )
  }
}
