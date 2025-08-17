import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateContent } from "@/lib/inference";
import { pusher } from "@/lib/pusher";

export async function POST(request: NextRequest) {
  const { submissionId } = await request.json();

  const submission = await prisma.milestoneSubmission.findUnique({
    where: { id: submissionId },
    include: {
      milestone: {
        select: {
          description: true,
          title: true,
          groupId: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const prompt = `
  You are a helpful assistant that reviews milestone submissions.
  The milestone description is: ${submission?.milestone.description}
  The milestone title is: ${submission?.milestone.title}
  The submission content is: ${submission?.content}

  You will be given three parameters to fill out.
  - review: a detailed review of the submission
  - score: a score out of 100 for the submission
  - pass: a boolean indicating whether the submission passed or failed

  The review should be a detailed review of the submission, including what the submission did well and what it could improve on.
  The score should be a score out of 100 for the submission, based on the review.

  For example:

  The milestone description is: "Learn about the history of the internet"
  The milestone title is: "History of the Internet"
  The submission content is: "I learned about the history of the internet, and thought it was fun."

  The review should be: "It's great that you enjoyed learning about the history of the internet, although in your submissions you should include the facts and new knowledge you have acquired from your learning experiences."
  The score should be: 50
  The pass should be: false

  The milestone description is: "Learn about the history of the internet"
  The milestone title is: "History of the Internet"
  The submission content is: "I learned about the history of the internet, and thought it was fun. The internet was invented in 1969 by Tim Berners-Lee at CERN, and the first website was created in 1991."

  The review should be: "It's great that you enjoyed learning about the history of the internet, although in your submissions you should include the facts and new knowledge you have acquired from your learning experiences."
  The score should be: 80
  The pass should be: true
  `;

  const response = await generateContent(prompt, { type: "json_object", schema: { type: "object", properties: {
    review: { type: "string" },
    score: { type: "number" },
    pass: { type: "boolean" },
  } } });

  const { review, score, pass } = JSON.parse(response || "{}") as { review: string; score: number; pass: boolean };

  await prisma.milestoneSubmission.update({
    where: { id: submissionId },
    data: { aiComment: review, aiVerified: pass },
  });

  console.log(review, score, pass);

  // Send Pusher notification for AI feedback completion
  if (submission?.milestone.groupId && submission?.user.id) {
    try {
      await pusher.trigger(`group-${submission.milestone.groupId}`, 'ai-feedback-completed', {
        submissionId,
        userId: submission.user.id,
        userName: submission.user.name,
        milestoneTitle: submission.milestone.title,
        aiComment: review,
        aiVerified: pass,
        score,
        timestamp: new Date().toISOString(),
      });
      
      console.log('Pusher notification sent for AI feedback completion');
    } catch (error) {
      console.error('Error sending Pusher notification:', error);
    }
  }

  // check if all users in milestone have submitted
  const usersInMilestone = await prisma.groupMember.findMany({
    where: {
      groupId: submission?.milestone.groupId,
    },
  });
  
  const milestoneSubmissions = await prisma.milestoneSubmission.findMany({
    where: {
      milestoneId: submission?.milestoneId,
    },
  });

  // check if all users in milestone have submitted
  const allUsersSubmitted = usersInMilestone.every(user => {
    return milestoneSubmissions.some(s => s.userId === user.userId);
  });

  if (allUsersSubmitted) {
    await prisma.milestone.update({
      where: { id: submission?.milestoneId },
      data: { completed: true },
    });
  }

  return NextResponse.json({ review, score, pass });
}