// Note: Google Translate is only used server-side in API routes

export interface LanguagePreference {
  code: string;
  name: string;
}

export const SUPPORTED_LANGUAGES: LanguagePreference[] = [
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

// Note: Google Translate client is only used in server-side API routes

export interface LanguagePreference {
  code: string;
  name: string;
}

// Note: Server-side translation functions are now in the API routes
// This file only contains client-side utilities and types

export function parseLanguagePreference(prefString: string): LanguagePreference {
  try {
    const parsed = JSON.parse(prefString);
    if (parsed?.code && parsed?.name) return parsed;
  } catch {}
  return {code: 'en', name: 'English'};
}

export function getLanguageName(code: string): string {
  const language = SUPPORTED_LANGUAGES.find(lang => lang.code === code);
  return language ? language.name : code;
}
