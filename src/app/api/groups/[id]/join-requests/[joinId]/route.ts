import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'


// PUT /api/join-requests/[id] - Approve or reject a join request
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ joinId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { joinId: joinRequestId } = await params
    const body = await request.json()
    const { action } = body // 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    // Get the join request with group info
    const joinRequest = await prisma.joinRequest.findUnique({
      where: { id: joinRequestId },
      include: {
        group: {
          include: {
            owner: {
              select: {
                id: true
              }
            },
            _count: {
              select: {
                members: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!joinRequest) {
      return NextResponse.json(
        { error: 'Join request not found' },
        { status: 404 }
      )
    }

    // Check if user is the group leader
    if (joinRequest.group.owner.id !== session.user.id) {
      return NextResponse.json(
        { error: 'Only group leaders can approve/reject join requests' },
        { status: 403 }
      )
    }

    // Check if join request is still pending
    if (joinRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Join request has already been processed' },
        { status: 400 }
      )
    }

    if (action === 'approve') {
      // Check if group is full
      if (joinRequest.group._count.members >= joinRequest.group.maxMembers) {
        return NextResponse.json(
          { error: 'Group is full' },
          { status: 400 }
        )
      }

      // Use transaction to update join request and add member
      await prisma.$transaction(async (tx) => {
        // Update join request status
        await tx.joinRequest.update({
          where: { id: joinRequestId },
          data: { status: 'approved' }
        })

        // Add user to group
        await tx.groupMember.create({
          data: {
            userId: joinRequest.user.id,
            groupId: joinRequest.group.id,
            role: 'member'
          }
        })

        // Create notification for the user
        await tx.notification.create({
          data: {
            userId: joinRequest.user.id,
            type: 'group_invite',
            title: 'Join Request Approved',
            message: `Your request to join "${joinRequest.group.name}" has been approved!`
          }
        })
      })
    } else {
      // Reject the join request
      await prisma.joinRequest.update({
        where: { id: joinRequestId },
        data: { status: 'rejected' }
      })

      // Create notification for the user
      await prisma.notification.create({
        data: {
          userId: joinRequest.user.id,
          type: 'group_invite',
          title: 'Join Request Rejected',
          message: `Your request to join "${joinRequest.group.name}" has been rejected.`
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing join request:', error)
    return NextResponse.json(
      { error: 'Failed to process join request' },
      { status: 500 }
    )
  }
}
