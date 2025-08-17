import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET /api/dashboard/group-progress - Get progress for all user's groups
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

    // Get user's groups with milestones
    const userGroups = await prisma.group.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId: userId } } }
        ]
      },
      include: {
        milestones: {
          select: {
            id: true,
            title: true,
            completed: true,
            dueDate: true
          },
          orderBy: {
            dueDate: 'asc'
          }
        }
      }
    })

    const groups = userGroups
      .filter(group => group.milestones.length > 0) // Only include groups with milestones
      .map(group => {
        const totalMilestones = group.milestones.length
        const completedMilestones = group.milestones.filter(m => m.completed).length
        const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0
        
        // Find next incomplete milestone
        const nextMilestone = group.milestones.find(m => !m.completed)

        return {
          id: group.id,
          name: group.name,
          progress,
          totalMilestones,
          completedMilestones,
          nextMilestone: nextMilestone ? nextMilestone.title : undefined
        }
      })
      .sort((a, b) => b.progress - a.progress) // Sort by progress (highest first)

    return NextResponse.json({ groups })
  } catch (error) {
    console.error('Error fetching group progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch group progress' },
      { status: 500 }
    )
  }
}
