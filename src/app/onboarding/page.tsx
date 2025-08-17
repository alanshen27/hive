'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BookOpen, ArrowRight, Check, Loader2, Globe, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { SUPPORTED_LANGUAGES, LanguagePreference } from "@/lib/translation";
import Image from "next/image";

const subjects = [
  "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science",
  "Engineering", "Literature", "History", "Psychology", "Economics",
  "Art", "Music", "Philosophy", "Language Learning", "Medicine"
];

const interests = [
  "Group Study", "Homework Help", "Exam Preparation", "Project Collaboration",
  "Research", "Tutoring", "Discussion Groups", "Problem Solving",
  "Creative Projects", "Skill Building"
];

const levels = [
  { id: "high-school", label: "High School", description: "Grades 9-12" },
  { id: "undergraduate", label: "Undergraduate", description: "Bachelor's degree" },
  { id: "graduate", label: "Graduate", description: "Master's/PhD" },
  { id: "professional", label: "Professional", description: "Working professional" }
];

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const [step, setStep] = useState(1);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<LanguagePreference>({ code: 'en', name: 'English' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const progress = (step / 4) * 100;

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status, router]);

  // Show loading while checking session
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-hero/5 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  const toggleSubject = (subject: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subject) 
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleNext = async () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Complete onboarding and save user preferences
      await completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    if (!session?.user?.id) {
      setError("User session not found");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/users/${session.user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bio: `Interests: ${selectedInterests.join(', ')}`,
          preferredLanguage: JSON.stringify(selectedLanguage),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      const preferencesResponse = await fetch('/api/user-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          subjects: selectedSubjects,
          interests: selectedInterests,
          level: selectedLevel,
        }),
      });

      if (!preferencesResponse.ok) {
        console.warn('Failed to save detailed preferences, but continuing...');
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Onboarding error:', error);
      setError('Failed to save your preferences. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return selectedSubjects.length > 0;
      case 2: return selectedInterests.length > 0;
      case 3: return selectedLevel !== "";
      case 4: return selectedLanguage.code !== "";
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-center space-x-2 mb-8">
          <Image src="/logo-lg.png" alt="Hive" width={200} height={200}/>
        </div>

        <div className="mb-8">
          <Progress value={progress} className="w-full h-2" />
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Step {step} of 4
          </p>
        </div>

        <Card className="shadow-glow border-border/50">
          <CardHeader className="text-center">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <CardTitle className="text-2xl">
              {step === 1 && "What subjects interest you?"}
              {step === 2 && "How do you like to study?"}
              {step === 3 && "What's your academic level?"}
              {step === 4 && "Choose your preferred language"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Select all subjects you're studying or want to learn about"}
              {step === 2 && "Choose your preferred study activities and interests"}
              {step === 3 && "This helps us match you with peers at your level"}
              {step === 4 && "We'll translate content to your preferred language"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {step === 1 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {subjects.map((subject) => (
                  <Badge
                    key={subject}
                    variant={selectedSubjects.includes(subject) ? "default" : "outline"}
                    className={`cursor-pointer justify-start p-3 transition-all hover:scale-105 w-full ${
                      selectedSubjects.includes(subject) 
                        ? "bg-gradient-primary text-white shadow-glow" 
                        : "hover:bg-accent"
                    }`}
                    onClick={() => toggleSubject(subject)}
                  >
                    {selectedSubjects.includes(subject) && (
                      <Check className="w-3 h-3 mr-1" />
                    )}
                    {subject}
                  </Badge>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-2 gap-3">
                {interests.map((interest) => (
                  <Badge
                    key={interest}
                    variant={selectedInterests.includes(interest) ? "default" : "outline"}
                    className={`cursor-pointer justify-start p-3 transition-all hover:scale-105 w-full ${
                      selectedInterests.includes(interest)
                        ? "bg-gradient-primary text-white shadow-glow"
                        : "hover:bg-accent"
                    }`}
                    onClick={() => toggleInterest(interest)}
                  >
                    {selectedInterests.includes(interest) && (
                      <Check className="w-3 h-3 mr-1" />
                    )}
                    {interest}
                  </Badge>
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                {levels.map((level) => (
                  <div
                    key={level.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-[1.02] ${
                      selectedLevel === level.id
                        ? "border-primary bg-primary/10 shadow-glow"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedLevel(level.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{level.label}</h3>
                        <p className="text-sm text-muted-foreground">{level.description}</p>
                      </div>
                      {selectedLevel === level.id && (
                        <div className="bg-gradient-primary rounded-full p-1">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Preferred Language</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                          <span>{selectedLanguage.name}</span>
                          <span className="text-xs text-muted-foreground">({selectedLanguage.code})</span>
                        </div>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search languages..." className="outline-none" />
                        <CommandList>
                          <CommandEmpty>No language found.</CommandEmpty>
                          <CommandGroup>
                            {SUPPORTED_LANGUAGES.map((language) => (
                              <CommandItem
                                key={language.code}
                                value={`${language.name} ${language.code}`}
                                onSelect={() => setSelectedLanguage(language)}
                              >
                                <div className="flex items-center space-x-2 w-full">
                                  <Globe className="w-4 h-4 text-muted-foreground" />
                                  <span>{language.name}</span>
                                  <span className="text-xs text-muted-foreground">({language.code})</span>
                                  {selectedLanguage.code === language.code && (
                                    <Check className="ml-auto h-4 w-4" />
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                
                {selectedLanguage.code !== 'en' && (
                  <Alert>
                    <Globe className="h-4 w-4" />
                    <AlertDescription>
                      You've selected {selectedLanguage.name}. Content will be automatically translated to {selectedLanguage.name} when available.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <div className="flex justify-between pt-6">
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  Back
                </Button>
              )}
              <Button 
                variant="default" 
                onClick={handleNext}
                disabled={!canProceed() || isLoading}
                className="ml-auto group"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    {step === 4 ? "Complete Setup" : "Continue"}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


