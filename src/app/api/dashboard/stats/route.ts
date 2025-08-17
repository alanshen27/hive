import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET /api/dashboard/stats - Get dashboard statistics for the current user
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

    // Get user's groups (both as member and leader)
    const userGroups = await prisma.group.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId: userId } } }
        ]
      },
      include: {
        _count: {
          select: {
            members: true,
            messages: true,
            milestones: true
          }
        },
        milestones: {
          select: {
            completed: true
          }
        }
      }
    })

    // Calculate stats
    const totalGroups = userGroups.length
    const totalMembers = userGroups.reduce((sum, group) => sum + group._count.members, 0)
    const totalMessages = userGroups.reduce((sum, group) => sum + group._count.messages, 0)
    const totalMilestones = userGroups.reduce((sum, group) => sum + group._count.milestones, 0)
    const completedMilestones = userGroups.reduce((sum, group) => 
      sum + group.milestones.filter(m => m.completed).length, 0
    )

    // Get upcoming video sessions
    const upcomingSessions = await prisma.videoSession.count({
      where: {
        group: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId: userId } } }
          ]
        },
        startTime: {
          gte: new Date()
        },
        status: 'scheduled'
      }
    })

    // Get pending join requests (only for groups where user is leader)
    const pendingJoinRequests = await prisma.joinRequest.count({
      where: {
        group: {
          ownerId: userId
        },
        status: 'pending'
      }
    })

    return NextResponse.json({
      totalGroups,
      totalMembers,
      totalMessages,
      totalMilestones,
      completedMilestones,
      upcomingSessions,
      pendingJoinRequests
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
