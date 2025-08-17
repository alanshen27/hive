import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { Prisma } from '@prisma/client'


// GET /api/groups - Get all groups with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const subject = searchParams.get('subject')
    const level = searchParams.get('level')
    const activity = searchParams.get('activity')
    const myGroups = searchParams.get('myGroups') === 'true'
    const sortBy = searchParams.get('sortBy') || 'newest'
    const showOnlyAvailable = searchParams.get('showOnlyAvailable') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Get current user session
    const session = await auth()
    const userId = session?.user?.id

    // Build where clause
    const where: Prisma.GroupWhereInput = {}
    
    if (myGroups && userId) {
      // For my-groups page, get groups where user is a member
      where.members = {
        some: {
          userId: userId
        }
      }
    } else {
      // For explore page, only show public groups
      where.isPrivate = false
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (subject && subject !== 'All') {
      where.subject = subject
    }
    
    if (level && level !== 'All') {
      where.level = level
    }

    // Get groups with member count
    const groups = await prisma.group.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        members: {
          where: userId ? { userId } : undefined,
          select: {
            role: true
          }
        },
        _count: {
          select: {
            members: true,
            messages: true,
            milestones: true
          }
        },
        milestones: {
          include: {
            submissions: {
              select: {
                id: true,
                aiVerified: true
              }
            }
          }
        }
      },
      skip,
      take: limit,
      orderBy: getOrderBy(sortBy) as Prisma.GroupOrderByWithRelationInput
    })

    // Filter by availability if requested
    let filteredGroups = groups
    if (showOnlyAvailable) {
      filteredGroups = groups.filter(group => 
        group._count.members < group.maxMembers
      )
    }

    // Add role information - only set role if user is actually a member
    const groupsWithRole = filteredGroups.map(group => ({
      ...group,
      role: group.members.length > 0 ? group.members[0]?.role : undefined
    }))

    // Get total count for pagination
    const total = await prisma.group.count({ where })

    return NextResponse.json({
      groups: groupsWithRole,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching groups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    )
  }
}

// POST /api/groups - Create a new group
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json(
        { error: 'You must be logged in to create a group' },
        { status: 401 }
      )
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { name, description, subject, level, isPrivate, maxMembers } = body

    // Validate required fields
    if (!name || !description || !subject || !level) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create group
    const group = await prisma.group.create({
      data: {
        name,
        description,
        subject,
        level,
        isPrivate: isPrivate || false,
        maxMembers: maxMembers || 50,
        ownerId: userId
      }
    })

    // Add owner as first member
    await prisma.groupMember.create({
      data: {
        userId: userId,
        groupId: group.id,
        role: 'leader'
      }
    })

    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    console.error('Error creating group:', error)
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    )
  }
}

function getOrderBy(sortBy: string) {
  switch (sortBy) {
    case 'newest':
      return { createdAt: 'desc' }
    case 'oldest':
      return { createdAt: 'asc' }
    case 'members':
      return { members: { _count: 'desc' } }
    case 'activity':
      return { messages: { _count: 'desc' } }
    default:
      return { createdAt: 'desc' }
  }
}
