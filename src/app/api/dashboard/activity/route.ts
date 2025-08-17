import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET /api/dashboard/activity - Get recent activity for the current user
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

    // Get recent messages
    const recentMessages = await prisma.message.findMany({
      where: {
        groupId: { in: groupIds }
      },
      include: {
        user: {
          select: {
            name: true
          }
        },
        group: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })

    // Get recent milestone submissions
    const recentSubmissions = await prisma.milestoneSubmission.findMany({
      where: {
        milestone: {
          groupId: { in: groupIds }
        }
      },
      include: {
        user: {
          select: {
            name: true
          }
        },
        milestone: {
          select: {
            title: true,
            group: {
              select: {
                name: true,
                id: true
              }
            }
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      },
      take: 5
    })

    // Get recent join requests (for groups where user is leader)
    const recentJoinRequests = await prisma.joinRequest.findMany({
      where: {
        group: {
          ownerId: userId
        },
        status: 'pending'
      },
      include: {
        user: {
          select: {
            name: true
          }
        },
        group: {
          select: {
            name: true,
            id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })

    // Get recent video sessions
    const recentVideoSessions = await prisma.videoSession.findMany({
      where: {
        groupId: { in: groupIds },
        startTime: {
          gte: new Date()
        }
      },
      include: {
        group: {
          select: {
            name: true,
            id: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      },
      take: 5
    })

    // Combine and format activities
    const activities = [
      ...recentMessages.map(msg => ({
        id: `msg-${msg.id}`,
        type: 'message' as const,
        title: `New message from ${msg.user.name}`,
        description: msg.content.length > 50 ? msg.content.substring(0, 50) + '...' : msg.content,
        timestamp: msg.createdAt.toISOString(),
        groupName: msg.group.name,
        groupId: msg.groupId
      })),
      ...recentSubmissions.map(sub => ({
        id: `sub-${sub.id}`,
        type: 'milestone' as const,
        title: `Milestone submission by ${sub.user.name}`,
        description: `Submitted work for "${sub.milestone.title}"`,
        timestamp: sub.submittedAt.toISOString(),
        groupName: sub.milestone.group.name,
        groupId: sub.milestone.group.id
      })),
      ...recentJoinRequests.map(req => ({
        id: `req-${req.id}`,
        type: 'join_request' as const,
        title: `Join request from ${req.user.name}`,
        description: req.message || 'Wants to join your group',
        timestamp: req.createdAt.toISOString(),
        groupName: req.group.name,
        groupId: req.group.id
      })),
      ...recentVideoSessions.map(session => ({
        id: `session-${session.id}`,
        type: 'video_session' as const,
        title: `Upcoming: ${session.title}`,
        description: `Video session scheduled`,
        timestamp: session.startTime.toISOString(),
        groupName: session.group.name,
        groupId: session.group.id
      }))
    ]

    // Sort by timestamp and take the most recent 10
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)

    return NextResponse.json({ activities: sortedActivities })
  } catch (error) {
    console.error('Error fetching recent activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent activity' },
      { status: 500 }
    )
  }
}
