import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET /api/dashboard/upcoming-sessions - Get upcoming video sessions for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Get user's groups
    const userGroups = await prisma.group.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId: userId } } }
        ]
      },
      select: { id: true }
    })

    const groupIds = userGroups.map(g => g.id)

    // Get upcoming video sessions
    const upcomingSessions = await prisma.videoSession.findMany({
      where: {
        groupId: { in: groupIds },
        startTime: {
          gte: new Date()
        },
        status: 'scheduled'
      },
      include: {
        group: {
          select: {
            name: true,
            id: true
          }
        },
        _count: {
          select: {
            participants: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      },
      take: 5
    })

    const sessions = upcomingSessions.map(session => ({
      id: session.id,
      title: session.title,
      startTime: session.startTime.toISOString(),
      groupName: session.group.name,
      groupId: session.group.id,
      participants: session._count.participants
    }))

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Error fetching upcoming sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch upcoming sessions' },
      { status: 500 }
    )
  }
}
