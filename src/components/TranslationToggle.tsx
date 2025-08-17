"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "@/lib/translation";



export function TranslationToggle({
  currentLanguage,
  onLanguageChange,
  className = "",
}: {
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
  className?: string;
}) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Language Selector */}
      <Select value={currentLanguage} onValueChange={onLanguageChange}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">English</SelectItem>
          {SUPPORTED_LANGUAGES.filter(lang => lang.code !== 'en').map((language) => (
            <SelectItem key={language.code} value={language.code}>
              {language.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function TranslationContent({
  originalContent,
  translatedContent,
  currentLanguage,
  sourceLanguage = 'en',
  ref
}: {
  originalContent: string;
  translatedContent: string;
  currentLanguage: string;
  sourceLanguage?: string;
  ref?: React.RefObject<HTMLDivElement>;
}) {
  if (currentLanguage === 'en') {
    return <p className="text-sm break-words whitespace-pre-wrap">{originalContent}</p>;
  }

  return (
    <div ref={ref} className="w-full max-w-full">
      {/* Translation indicator */}
      <div className="flex items-center space-x-2 mb-2">
        <Globe className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        <span className="text-xs text-muted-foreground">
          Translated from {sourceLanguage === 'en' ? 'English' : sourceLanguage}
        </span>
      </div>
      
      {/* Content */}
      <p className="text-sm break-words whitespace-pre-wrap overflow-hidden max-w-full" style={{ wordBreak: 'break-word' }}>{translatedContent}</p>
    </div>
  );
}
