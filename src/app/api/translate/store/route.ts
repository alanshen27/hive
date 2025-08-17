import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { v2 as TranslateV2 } from '@google-cloud/translate';

const translateClient = new TranslateV2.Translate({
  key: process.env.GOOGLE_TRANSLATE_API_KEY,
});

async function translateText(text: string, targetLanguage: string): Promise<string> {
  try {
    const [translation] = await translateClient.translate(text, targetLanguage);
    return translation;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text if translation fails
  }
}

async function getExistingMetadata(entityType: string, entityId: string, field: string): Promise<string | null> {
  try {
    switch (entityType) {
      case 'milestone':
        const milestone = await prisma.milestone.findUnique({
          where: { id: entityId },
          select: { translation_metadata: true }
        });
        return milestone?.translation_metadata || null;

      case 'milestoneSubmission':
        const submission = await prisma.milestoneSubmission.findUnique({
          where: { id: entityId },
          select: { 
            contentTranslationMetadata: field === 'content',
            aiTranslationMetadata: field === 'aiComment'
          }
        });
        return field === 'content' ? submission?.contentTranslationMetadata : submission?.aiTranslationMetadata || null;

      case 'videoSession':
        const videoSession = await prisma.videoSession.findUnique({
          where: { id: entityId },
          select: { 
            titleTranslationMetadata: field === 'title',
            descriptionTranslationMetadata: field === 'description'
          }
        });
        return field === 'title' ? videoSession?.titleTranslationMetadata : videoSession?.descriptionTranslationMetadata || null;

      case 'message':
        const message = await prisma.message.findUnique({
          where: { id: entityId },
          select: { contentTranslationMetadata: true }
        });
        return message?.contentTranslationMetadata || null;

      case 'group':
        const group = await prisma.group.findUnique({
          where: { id: entityId },
          select: { 
            nameTranslationMetadata: field === 'name',
            descriptionTranslationMetadata: field === 'description'
          }
        });
        return field === 'name' ? group?.nameTranslationMetadata : group?.descriptionTranslationMetadata || null;

      default:
        return null;
    }
  } catch (error) {
    console.error('Error getting existing metadata:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      entityType, 
      entityId, 
      field, 
      content, 
      targetLanguage,
      userId 
    } = body;

    if (!entityType || !entityId || !field || !content || !targetLanguage) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Translate the content
    const translatedContent = await translateText(content, targetLanguage);

    // Get existing metadata or create empty object
    let existingMetadata = {};
    try {
      const existingData = await getExistingMetadata(entityType, entityId, field);
      existingMetadata = existingData ? JSON.parse(existingData) : {};
    } catch (error) {
      console.error('Error parsing existing metadata:', error);
      existingMetadata = {};
    }

    // Add/update translation for this language
    const updatedMetadata = {
      ...existingMetadata,
      [targetLanguage]: {
        content: translatedContent,
        translatedAt: new Date().toISOString(),
        translatedBy: userId
      }
    };

    let result;

    switch (entityType) {
      case 'milestone':
        // For milestones, we need to handle both title and description in the same metadata
        const existingMilestoneMetadata = await getExistingMetadata(entityType, entityId, field);
        let milestoneMetadata = {};
        try {
          milestoneMetadata = existingMilestoneMetadata ? JSON.parse(existingMilestoneMetadata) : {};
        } catch (error) {
          console.error('Error parsing existing milestone metadata:', error);
          milestoneMetadata = {};
        }
        
        // Add/update translation for this field and language
        const updatedMilestoneMetadata = {
          ...milestoneMetadata,
          [field]: {
            ...milestoneMetadata[field],
            [targetLanguage]: {
              content: translatedContent,
              translatedAt: new Date().toISOString(),
              translatedBy: userId
            }
          }
        };
        
        result = await prisma.milestone.update({
          where: { id: entityId },
          data: {
            translation_metadata: JSON.stringify(updatedMilestoneMetadata)
          }
        });
        break;

      case 'milestoneSubmission':
        if (field === 'content') {
          result = await prisma.milestoneSubmission.update({
            where: { id: entityId },
            data: {
              contentTranslationMetadata: JSON.stringify(updatedMetadata)
            }
          });
        } else if (field === 'aiComment') {
          result = await prisma.milestoneSubmission.update({
            where: { id: entityId },
            data: {
              aiTranslationMetadata: JSON.stringify(updatedMetadata)
            }
          });
        }
        break;

      case 'videoSession':
        if (field === 'title') {
          result = await prisma.videoSession.update({
            where: { id: entityId },
            data: {
              titleTranslationMetadata: JSON.stringify(updatedMetadata)
            }
          });
        } else if (field === 'description') {
          result = await prisma.videoSession.update({
            where: { id: entityId },
            data: {
              descriptionTranslationMetadata: JSON.stringify(updatedMetadata)
            }
          });
        }
        break;

      case 'message':
        result = await prisma.message.update({
          where: { id: entityId },
          data: {
            contentTranslationMetadata: JSON.stringify(updatedMetadata)
          }
        });
        break;

      case 'group':
        if (field === 'name') {
          result = await prisma.group.update({
            where: { id: entityId },
            data: {
              nameTranslationMetadata: JSON.stringify(updatedMetadata)
            }
          });
        } else if (field === 'description') {
          result = await prisma.group.update({
            where: { id: entityId },
            data: {
              descriptionTranslationMetadata: JSON.stringify(updatedMetadata)
            }
          });
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Unsupported entity type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ 
      success: true, 
      translatedContent,
      metadata: updatedMetadata
    });

  } catch (error) {
    console.error('Error storing translation:', error);
    return NextResponse.json(
      { error: 'Failed to store translation' },
      { status: 500 }
    );
  }
}
