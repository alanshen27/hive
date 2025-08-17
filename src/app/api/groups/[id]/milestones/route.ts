import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET /api/groups/[id]/milestones - Get all milestones for a group
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  try {
    const groupId = params.id

    const milestones = await prisma.milestone.findMany({
      where: {
        groupId
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

                // Transform to match MilestoneCard component format
            const transformedMilestones = milestones.map(milestone => ({
              id: milestone.id,
              title: milestone.title,
              description: milestone.description,
              dueDate: milestone.dueDate.toISOString().split('T')[0],
              completed: milestone.completed,
              translation_metadata: milestone.translation_metadata,
              userVerified: milestone.submissions.find(sub => sub.aiVerified && sub.userId === session.user.id) ? true : false,
              submissions: milestone.submissions.map(sub => ({
                id: sub.id,
                user: sub.user.name,
                avatar: sub.user.avatar || sub.user.name.charAt(0),
                content: sub.content,
                contentTranslationMetadata: sub.contentTranslationMetadata,
                files: sub.files || [],
                submittedAt: sub.submittedAt.toISOString().split('T')[0],
                aiVerified: sub.aiVerified,
                aiComment: sub.aiComment,
                aiTranslationMetadata: sub.aiTranslationMetadata
              }))
            }));

            return NextResponse.json({ milestones: transformedMilestones })
  } catch (error) {
    console.error('Error fetching milestones:', error)
    return NextResponse.json(
      { error: 'Failed to fetch milestones' },
      { status: 500 }
    )
  }
}

// POST /api/groups/[id]/milestones - Create a new milestone
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  try {
    const groupId = params.id
    const body = await request.json()
    const { title, description, dueDate } = body

    if (!title || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const milestone = await prisma.milestone.create({
      data: {
        title,
        description,
        dueDate: new Date(dueDate),
        groupId,
        completed: false
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
              translation_metadata: milestone.translation_metadata,
              userVerified: milestone.submissions.find(sub => sub.aiVerified && sub.userId === session.user.id) ? true : false,
              submissions: milestone.submissions.map(sub => ({
                id: sub.id,
                user: sub.user.name,
                avatar: sub.user.avatar || sub.user.name.charAt(0),
                content: sub.content,
                contentTranslationMetadata: sub.contentTranslationMetadata,
                files: sub.files || [],
                submittedAt: sub.submittedAt.toISOString().split('T')[0],
                aiVerified: sub.aiVerified,
                aiComment: sub.aiComment,
                aiTranslationMetadata: sub.aiTranslationMetadata
              }))
            };

            return NextResponse.json({ milestone: transformedMilestone }, { status: 201 })
  } catch (error) {
    console.error('Error creating milestone:', error)
    return NextResponse.json(
      { error: 'Failed to create milestone' },
      { status: 500 }
    )
  }
}
