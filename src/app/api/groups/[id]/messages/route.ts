import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { pusher } from '@/lib/pusher'

import { auth } from '@/lib/auth'
import { generateContent } from '@/lib/inference'
import { NotificationService } from '@/lib/notification-service'

// GET /api/groups/[id]/messages - Get messages for a group
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit
    
    const messages = await prisma.message.findMany({
      where: { groupId: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    })

    const total = await prisma.message.count({
      where: { groupId: params.id }
    })

    return NextResponse.json({
      messages: messages.reverse().map(message => ({
        ...message,
        contentTranslationMetadata: message.contentTranslationMetadata
      })), // Return in chronological order
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST /api/groups/[id]/messages - Send a message to a group
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
      )
    }
    const body = await request.json()
    const { content, isAI = false } = body

    if (!content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user is a member of the group
    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: params.id
        }
      }
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'User is not a member of this group' },
        { status: 403 }
      )
    }

    const message = await prisma.message.create({
      data: {
        content,
        userId: session.user.id,
        groupId: params.id,
        isAI
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    const context = await prisma.message.findMany({
      where: {
        groupId: params.id,
        createdAt: {
          gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: 20,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    const contextString = context.map((message) => `${message.isAI ? "AI Assistant" : message.user.name} (${message.createdAt.toLocaleString()}): "${message.content}"`).join('\n');

    console.log(contextString);

    const prompt = `
    You are a helpful assistant that can figure out what users want based on the chat log.
    If you do not need to do any actions, set the response to false.
    You can do the following actions:
    - When the user @ you, with (@AI, you respond directly to them with the question)
      For example:
      User: @AI, what is the capital of France?
      AI: The capital of France is Paris.
    - Based on context (or if you are asked to do so), you can do the following actions:
      - Schedule multiple video sessions
      - Create multiple milestones (with title, task description, and due date)

    are a controller. Output ONE JSON object and nothing else.

  If no action is needed, output:
  {"response": false, "text": "", "action": null, "data": {"videoSessions": null, "milestones": null}}

  Otherwise follow exactly this meaning:
  - "response": whether to reply to the user.
  - "text": the message to send if responding or being @-mentioned as @AI.
  - "action": one of "schedule_video_sessions", "create_milestones", or null.
  - "data.videoSessions": null or an array of { "title": string, "description": string, "dueDate": ISO-8601 string }.
  - "data.milestones": null or an array of { "title": string, "description": string, "dueDate": ISO-8601 string }.
  - If a message has already been answered/resolved, set "response": false.


NOTE: in this context your name is "AI Assistant".

    The following is the chat log, take into consideration the time and context of the conversation: IF YOU DO NOT NEED TO RESPOND DO NOT RESPOND. DONT FILL UP THE CHAT LOG WITH YOUR RESPONSE.
    ${contextString}
    `
    // Trigger Pusher event for real-time updates
    await pusher.trigger(`group-${params.id}`, 'new-message', {
      message
    });

    // Create notifications for other group members
    try {
      await NotificationService.notifyNewMessage(
        params.id,
        message.id,
        session.user.id,
        content
      );
    } catch (notificationError) {
      console.error('Error creating message notifications:', notificationError);
      // Don't fail the message creation if notifications fail
    }

    const response = await generateContent(prompt, {
      // json
      type: "json_object", schema: { type: "object", properties: {
        response: { type: "boolean" },
        text: { type: "string" },
        action: { type: "string" },
        data: { type: "object", properties: {
          videoSessions: { type: "array", items: { type: "object", properties: {
            title: { type: "string" },
            description: { type: "string" },
            dueDate: { type: "string" },
          } } },
          milestones: { type: "array", items: { type: "object", properties: {
            title: { type: "string" },
            description: { type: "string" },
            dueDate: { type: "string" },
          } } },
        } }
      } }
    });


    const { response: responseBoolean, text, action, data } = JSON.parse(response || "{}") as { response: boolean; text: string; action: string; data: { videoSessions: { title: string; description: string; dueDate: string }[]; milestones: { title: string; description: string; dueDate: string }[] } };

    if (responseBoolean) {
      const aiAssistantMessage = await prisma.message.create({
        data: {
          content: JSON.stringify({ text, action, data }),
          userId: session.user.id,
          groupId: params.id,
          isAI: true
        }
      });

      await pusher.trigger(`group-${params.id}`, 'new-message', {
        message: aiAssistantMessage
      })
    }

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    )
  }
}

// PATCH /api/groups/[id]/messages - Update a message (for confirming AI suggestions)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { messageId, content } = body

    if (!messageId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user is a member of the group
    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: params.id
        }
      }
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'User is not a member of this group' },
        { status: 403 }
      )
    }

    // Update the message content
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { content },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    // Trigger Pusher event for real-time updates
    await pusher.trigger(`group-${params.id}`, 'message-updated', {
      message: updatedMessage
    });

    return NextResponse.json(updatedMessage)
  } catch (error) {
    console.error('Error updating message:', error)
    return NextResponse.json(
      { error: 'Failed to update message' },
      { status: 500 }
    )
  }
}
