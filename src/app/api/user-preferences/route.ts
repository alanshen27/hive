import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId, subjects, interests, level } = await request.json();

  const user = await prisma.user.update({
    where: { id: userId },
    data: { bio: JSON.stringify({ subjects, interests, level }) }
  });

  return NextResponse.json({ message: 'Preferences saved successfully' });
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user preferences
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        bio: true,
        preferredLanguage: true,
      }
    });

    // Parse preferences from bio (stored as JSON)
    let subjects: string[] = [];
    let interests: string[] = [];
    let level: string = '';

    if (user?.bio) {
      try {
        // Try to parse bio as JSON first
        const preferences = JSON.parse(user.bio);
        
        if (preferences.subjects) {
          subjects = Array.isArray(preferences.subjects) ? preferences.subjects : [];
        }
        
        if (preferences.interests) {
          interests = Array.isArray(preferences.interests) ? preferences.interests : [];
        }
        
        if (preferences.level) {
          level = preferences.level;
        }
      } catch (error) {
        // If JSON parsing fails, fall back to text parsing
        console.log('Bio is not JSON, falling back to text parsing');
        
        const subjectKeywords = [
          'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
          'Engineering', 'Literature', 'History', 'Psychology', 'Economics',
          'Art', 'Music', 'Philosophy', 'Language Learning', 'Medicine'
        ];
        
        subjects = subjectKeywords.filter(subject => 
          user.bio?.toLowerCase().includes(subject.toLowerCase())
        );

        const interestKeywords = [
          'Group Study', 'Homework Help', 'Exam Preparation', 'Project Collaboration',
          'Research', 'Tutoring', 'Discussion Groups', 'Problem Solving',
          'Creative Projects', 'Skill Building'
        ];
        
        interests = interestKeywords.filter(interest => 
          user.bio?.toLowerCase().includes(interest.toLowerCase())
        );

        const levelKeywords = [
          { keyword: 'high school', level: 'High School' },
          { keyword: 'undergraduate', level: 'Undergraduate' },
          { keyword: 'graduate', level: 'Graduate' },
          { keyword: 'professional', level: 'Professional' }
        ];
        
        const matchedLevel = levelKeywords.find(l => 
          user.bio?.toLowerCase().includes(l.keyword)
        );
        level = matchedLevel?.level || '';
      }
    }

    return NextResponse.json({
      subjects,
      interests,
      level,
      preferredLanguage: user?.preferredLanguage ? JSON.parse(user.preferredLanguage) : { code: 'en', name: 'English' }
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}
