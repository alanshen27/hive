import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const groupId = params.id;

    // Check if group exists and is public
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        _count: {
          select: {
            members: true
          }
        }
      }
    });

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    if (group.isPrivate) {
      return NextResponse.json(
        { error: 'This group is private. You need an invitation to join.' },
        { status: 403 }
      );
    }

    // Check if group is full
    if (group._count.members >= group.maxMembers) {
      return NextResponse.json(
        { error: 'This group is full' },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const existingMembership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: groupId
        }
      }
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: 'You are already a member of this group' },
        { status: 400 }
      );
    }

    // Add user to group
    const membership = await prisma.groupMember.create({
      data: {
        userId: session.user.id,
        groupId: groupId,
        role: 'member'
      }
    });

    return NextResponse.json({
      message: 'Successfully joined the group',
      membership
    }, { status: 201 });

  } catch (error) {
    console.error('Error joining group:', error);
    return NextResponse.json(
      { error: 'Failed to join group' },
      { status: 500 }
    );
  }
}
