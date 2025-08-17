import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET /api/users/[id] - Get user profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: (await params).id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        bio: true,
        preferredLanguage: true,
        createdAt: true,
        _count: {
          select: {
            groupMemberships: true,
            ownedGroups: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id] - Update user profile
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { name, avatar, bio, preferredLanguage } = body

    const user = await prisma.user.update({
      where: { id: (await params).id },
      data: {
        name: name || undefined,
        avatar: avatar || undefined,
        bio: bio || undefined,
        preferredLanguage: preferredLanguage || undefined
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        bio: true,
        preferredLanguage: true,
        createdAt: true
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Delete user account
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure user can only delete their own account
    if (session.user.id !== (await params).id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete user (cascade will handle related data)
    await prisma.user.delete({
      where: { id: (await params).id }
    });

    return NextResponse.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
