import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { parseLanguagePreference, LanguagePreference, SUPPORTED_LANGUAGES, getLanguageName } from '@/lib/translation'

// Global translation cache to prevent duplicate API calls
const translationCache = new Map<string, string>();

export function useTranslation() {
  const { data: session } = useSession()
  const [userLanguage, setUserLanguage] = useState<LanguagePreference>({ code: 'en', name: 'English' })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUserLanguage = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch(`/api/users/${session.user.id}`)
          if (response.ok) {
            const user = await response.json()
            if (user.preferredLanguage) {
              const languagePref = parseLanguagePreference(user.preferredLanguage)
              setUserLanguage(languagePref)
            }
          }
        } catch (error) {
          console.error('Error fetching user language:', error)
        }
      }
      setIsLoading(false)
    }

    fetchUserLanguage()
  }, [session?.user?.id])

  const translateContent = async (content: string, targetLanguage?: string) => {
    const language = targetLanguage || userLanguage.code

    // Check cache first
    const cacheKey = `${content}:${language}`;
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey);
    }

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          targetLanguage: language,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        const translatedContent = result.content || result;
        
        // Cache the result
        translationCache.set(cacheKey, translatedContent);
        
        return translatedContent;
      }
    } catch (error) {
      console.error('Translation error:', error)
    }

    return content
  }

  const storeTranslation = async (
    entityType: string,
    entityId: string,
    field: string,
    content: string,
    targetLanguage?: string
  ) => {
    const language = targetLanguage || userLanguage.code
    
    if (language === 'en' || !content) {
      return content
    }

    try {
      const response = await fetch('/api/translate/store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityType,
          entityId,
          field,
          content,
          targetLanguage: language,
          userId: session?.user?.id
        }),
      })

      if (response.ok) {
        const result = await response.json()
        return result.translatedContent
      }
    } catch (error) {
      console.error('Error storing translation:', error)
    }

    return content
  }

  const getStoredTranslation = (metadata: string, targetLanguage?: string, field?: string) => {
    if (!metadata) return null
    
    try {
      const parsed = JSON.parse(metadata)
      const language = targetLanguage || userLanguage.code
      
      // For milestones, check if we have field-specific translations
      if (field && parsed[field] && parsed[field][language] && parsed[field][language].content) {
        return parsed[field][language].content
      }
      
      // Fallback to the old format (for backward compatibility)
      if (parsed[language] && parsed[language].content) {
        return parsed[language].content
      }
    } catch (error) {
      console.error('Error parsing translation metadata:', error)
    }
    
    return null
  }

  // Use the imported getLanguageName function

  return {
    userLanguage,
    isLoading,
    translateContent,
    storeTranslation,
    getStoredTranslation,
    getLanguageName,
    isTranslationEnabled: userLanguage.code !== 'en'
  }
}
