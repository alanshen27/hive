import { NextRequest, NextResponse } from 'next/server'
import { v2 as TranslateV2 } from '@google-cloud/translate'

const translateClient = new TranslateV2.Translate({
  // Option 1: Use API Key (simplest)
  key: process.env.GOOGLE_TRANSLATE_API_KEY,
  
  // Option 2: Use Service Account (more secure for production)
  // projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  // keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
});



async function translateText(text: string, targetLanguage: string): Promise<string> {
  try {
    if (!text || targetLanguage === 'en') {
      return text;
    }

    console.log(`Translating "${text}" to ${targetLanguage}`);
    const [translation] = await translateClient.translate(text, targetLanguage);
    console.log(`Translation result: "${translation}"`);
    return translation;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text if translation fails
  }
}

async function translateObject(obj: any, targetLanguage: string): Promise<any> {
  if (!obj || targetLanguage === 'en') {
    return obj;
  }

  const seen = new WeakSet();

  async function walk(value: any): Promise<any> {
    if (typeof value === 'string') {
      if (!value.trim()) return value;
      return await translateText(value, targetLanguage);
    }

    if (!value || typeof value !== 'object') return value;
    if (seen.has(value)) return value; // avoid cycles
    seen.add(value);

    if (Array.isArray(value)) {
      const translated = await Promise.all(value.map(v => walk(v)));
      return translated;
    }

    const translatedObj = { ...value };
    
    for (const [key, val] of Object.entries(value)) {
      translatedObj[key] = await walk(val);
    }
    
    return translatedObj;
  }

  return walk(structuredClone(obj));
}

async function detectLanguage(text: string): Promise<string> {
  try {
    if (!text) {
      return 'en';
    }

    const [detection] = await translateClient.detect(text);
    return detection.language;
  } catch (error) {
    console.error('Language detection error:', error);
    return 'en'; // Default to English if detection fails
  }
}

function getLanguageName(code: string): string {
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' },
    { code: 'tr', name: 'Turkish' },
    { code: 'nl', name: 'Dutch' },
    { code: 'pl', name: 'Polish' },
    { code: 'sv', name: 'Swedish' },
    { code: 'da', name: 'Danish' },
    { code: 'no', name: 'Norwegian' },
    { code: 'fi', name: 'Finnish' },
  ];
  
  const language = languages.find(lang => lang.code === code);
  return language ? language.name : code;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, targetLanguage } = body

    if (!content || !targetLanguage) {
      return NextResponse.json(
        { error: 'Content and target language are required' },
        { status: 400 }
      )
    }

    if (targetLanguage === 'en') {
      return NextResponse.json(content)
    }

    // Detect source language if it's a string
    let sourceLanguage = 'en'
    if (typeof content === 'string') {
      sourceLanguage = await detectLanguage(content)
    } else if (typeof content === 'object') {
      // For objects, detect language from the first text field
      const firstTextValue = Object.values(content).find(val => typeof val === 'string')
      if (firstTextValue) {
        sourceLanguage = await detectLanguage(firstTextValue as string)
      }
    }

    const translatedContent = await translateObject(content, targetLanguage)

    return NextResponse.json({
      content: translatedContent,
      metadata: {
        sourceLanguage,
        sourceLanguageName: getLanguageName(sourceLanguage),
        targetLanguage,
        targetLanguageName: getLanguageName(targetLanguage),
        translatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Translation API error:', error)
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    )
  }
}
