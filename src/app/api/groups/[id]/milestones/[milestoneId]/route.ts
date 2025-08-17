import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET /api/milestones/[id] - Get a specific milestone
export async function GET(
  request: NextRequest,
  { params }: { params: { milestoneId: string } }
) {
  try {
    const milestoneId = params.milestoneId

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        submissions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        }
      }
    })

    if (!milestone) {
      return NextResponse.json(
        { error: 'Milestone not found' },
        { status: 404 }
      )
    }

    // Transform to match MilestoneCard component format
    const transformedMilestone = {
      id: milestone.id,
      title: milestone.title,
      description: milestone.description,
      dueDate: milestone.dueDate.toISOString().split('T')[0],
      completed: milestone.completed,
      submissions: milestone.submissions.map(sub => ({
        id: sub.id,
        user: sub.user.name,
        avatar: sub.user.avatar || sub.user.name.charAt(0),
        content: sub.content,
        files: sub.files || [],
        submittedAt: sub.submittedAt.toISOString().split('T')[0],
        aiVerified: sub.aiVerified,
        aiComment: sub.aiComment
      }))
    };

    return NextResponse.json({ milestone: transformedMilestone })
  } catch (error) {
    console.error('Error fetching milestone:', error)
    return NextResponse.json(
      { error: 'Failed to fetch milestone' },
      { status: 500 }
    )
  }
}

// PUT /api/milestones/[id] - Update a milestone
export async function PUT(
  request: NextRequest,
  { params }: { params: { milestoneId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const milestoneId = params.milestoneId
    const body = await request.json()
    const { title, description, dueDate, completed } = body

    // First check if the milestone exists and get group information
    const existingMilestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        group: {
          include: {
            owner: true,
            members: {
              where: { userId: session.user.id }
            }
          }
        }
      }
    })

    if (!existingMilestone) {
      return NextResponse.json(
        { error: 'Milestone not found' },
        { status: 404 }
      )
    }

    // Check if user is the group owner or a member
    const isOwner = existingMilestone.group.ownerId === session.user.id
    const isMember = existingMilestone.group.members.length > 0

    if (!isOwner && !isMember) {
      return NextResponse.json(
        { error: 'You do not have permission to update this milestone' },
        { status: 403 }
      )
    }

    const milestone = await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        completed
      },
      include: {
        submissions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        }
      }
    })

    // Transform to match MilestoneCard component format
    const transformedMilestone = {
      id: milestone.id,
      title: milestone.title,
      description: milestone.description,
      dueDate: milestone.dueDate.toISOString().split('T')[0],
      completed: milestone.completed,
      submissions: milestone.submissions.map(sub => ({
        id: sub.id,
        user: sub.user.name,
        avatar: sub.user.avatar || sub.user.name.charAt(0),
        content: sub.content,
        files: sub.files || [],
        submittedAt: sub.submittedAt.toISOString().split('T')[0],
        aiVerified: sub.aiVerified,
        aiComment: sub.aiComment
      }))
    };

    return NextResponse.json({ milestone: transformedMilestone })
  } catch (error) {
    console.error('Error updating milestone:', error)
    return NextResponse.json(
      { error: 'Failed to update milestone' },
      { status: 500 }
    )
  }
}

// DELETE /api/milestones/[id] - Delete a milestone
export async function DELETE(
  request: NextRequest,
  { params }: { params: { milestoneId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const milestoneId = params.milestoneId

    // First check if the milestone exists and get group information
    const existingMilestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        group: {
          include: {
            owner: true,
            members: {
              where: { userId: session.user.id }
            }
          }
        }
      }
    })

    if (!existingMilestone) {
      return NextResponse.json(
        { error: 'Milestone not found' },
        { status: 404 }
      )
    }

    // Check if user is the group owner or a member with admin permissions
    const isOwner = existingMilestone.group.ownerId === session.user.id
    const isMember = existingMilestone.group.members.length > 0

    if (!isOwner && !isMember) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this milestone' },
        { status: 403 }
      )
    }

    await prisma.milestone.delete({
      where: { id: milestoneId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting milestone:', error)
  
    
    return NextResponse.json(
      { error: 'Failed to delete milestone' },
      { status: 500 }
    )
  }
}
