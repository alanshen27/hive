import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET /api/groups/[id]/video-sessions - Get all video sessions for a group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params

    const videoSessions = await prisma.videoSession.findMany({
      where: {
        groupId
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
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    return NextResponse.json({ videoSessions })
  } catch (error) {
    console.error('Error fetching video sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch video sessions' },
      { status: 500 }
    )
  }
}

// POST /api/groups/[id]/video-sessions - Create a new video session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: groupId } = await params
    const body = await request.json()
    const { title, description, startTime, endTime, meetingUrl } = body

    if (!title || !startTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user is a member of the group
    const groupMember = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId
        }
      }
    })

    const groupOwner = await prisma.group.findUnique({
      where: {
        id: groupId
      },
      select: {
        ownerId: true
      }
    })
    if (!groupMember && groupOwner?.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'You must be a member of this group to create video sessions' },
        { status: 403 }
      )
    }

    const videoSession = await prisma.videoSession.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        meetingUrl,
        groupId,
        userId: session.user.id
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

    return NextResponse.json({ videoSession }, { status: 201 })
  } catch (error) {
    console.error('Error creating video session:', error)
    return NextResponse.json(
      { error: 'Failed to create video session' },
      { status: 500 }
    )
  }
}
