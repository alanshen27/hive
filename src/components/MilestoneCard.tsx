"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronDown, ChevronRight, Clock, Paperclip, 
  Check, Brain, Upload, Edit, Trash2, Globe, Languages, Loader2
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate, formatRelativeTime, isOverdue } from "@/lib/date-utils";
import { Milestone, MilestoneSubmission } from "@prisma/client";
import { useTranslation } from "@/hooks/useTranslation";
import { TranslationToggle, TranslationContent } from "@/components/TranslationToggle";
import { useInView } from "@/hooks/useInView";
import { useAIFeedback } from "@/hooks/useAIFeedback";
import { toast } from "sonner";

interface MilestoneProps {
  milestone: (Milestone & { userVerified: boolean }) & { submissions: (MilestoneSubmission & { user: string })[] };
  onEdit?: (milestone: Milestone) => void;
  onDelete?: (milestoneId: string) => void;
  groupId: string;
}

export function MilestoneCard({ milestone, onEdit, onDelete, groupId }: MilestoneProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [submission, setSubmission] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [translatedMilestone, setTranslatedMilestone] = useState(milestone);
  const [displayLanguage, setDisplayLanguage] = useState('en');
  const [translatingMilestone, setTranslatingMilestone] = useState(false);
  const [translatingSubmissions, setTranslatingSubmissions] = useState<Set<string>>(new Set());
  const [translatedSubmissions, setTranslatedSubmissions] = useState<Set<string>>(new Set());
  const [localSubmissions, setLocalSubmissions] = useState(milestone.submissions);
  const [translationProgress, setTranslationProgress] = useState<{
    title?: boolean;
    description?: boolean;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingSubmissions, setProcessingSubmissions] = useState<Set<string>>(new Set());

  const { userLanguage, isTranslationEnabled, getStoredTranslation, translateContent, storeTranslation } = useTranslation();
  const [ref, inView] = useInView({ threshold: 0.1 });
  const { recentFeedback, isConnected: isPusherConnected } = useAIFeedback(groupId);

  // Set initial display language
  useEffect(() => {
    if (isTranslationEnabled) {
      setDisplayLanguage(userLanguage.code);
    }
  }, [userLanguage.code, isTranslationEnabled]);

  // Reset translated submissions when language changes
  useEffect(() => {
    setTranslatedSubmissions(new Set());
  }, [displayLanguage]);

  // Update submissions when AI feedback is received
  useEffect(() => {
    if (recentFeedback.length > 0) {
      const latestFeedback = recentFeedback[0];
      if (latestFeedback.submissionId) {
        setLocalSubmissions(prev => 
          prev.map(sub => 
            sub.id === latestFeedback.submissionId 
              ? { 
                  ...sub, 
                  aiVerified: latestFeedback.aiVerified, 
                  aiComment: latestFeedback.aiComment 
                }
              : sub
          )
        );
        
        // Remove from processing list
        setProcessingSubmissions(prev => {
          const newSet = new Set(prev);
          newSet.delete(latestFeedback.submissionId);
          return newSet;
        });
      }
    }
  }, [recentFeedback]);

  // Simple translation effect - only runs when language changes
  useEffect(() => {
    if (!isTranslationEnabled || displayLanguage === 'en') {
      setTranslatedMilestone(milestone);
      return;
    }

    const translateMilestone = async () => {
      // Check for existing translations first - NO API CALLS if we have them
      const storedTitle = getStoredTranslation(milestone.translation_metadata, displayLanguage, 'title');
      const storedDescription = getStoredTranslation(milestone.translation_metadata, displayLanguage, 'description');

      // If we have both translations, use them immediately - NO API CALLS
      if (storedTitle && storedDescription) {
        setTranslatedMilestone({
          ...milestone,
          title: storedTitle,
          description: storedDescription
        });
        return; // Exit early - no API calls needed
      }

      // Only show loading and make API calls if we don't have translations
      setTranslatingMilestone(true);
      setTranslationProgress({ title: true, description: true });

      try {
        let finalTitle = milestone.title;
        let finalDescription = milestone.description;

        // Only translate title if we don't have it stored
        if (!storedTitle) {
          const translatedTitle = await translateContent(milestone.title, displayLanguage);
          if (translatedTitle && translatedTitle !== milestone.title) {
            finalTitle = translatedTitle;
            await storeTranslation('milestone', milestone.id, 'title', milestone.title, displayLanguage);
          }
        } else {
          finalTitle = storedTitle;
        }
        setTranslationProgress(prev => ({ ...prev, title: false }));

        // Only translate description if we don't have it stored
        if (!storedDescription) {
          const translatedDescription = await translateContent(milestone.description, displayLanguage);
          if (translatedDescription && translatedDescription !== milestone.description) {
            finalDescription = translatedDescription;
            await storeTranslation('milestone', milestone.id, 'description', milestone.description, displayLanguage);
          }
        } else {
          finalDescription = storedDescription;
        }
        setTranslationProgress(prev => ({ ...prev, description: false }));

        setTranslatedMilestone({
          ...milestone,
          title: finalTitle,
          description: finalDescription
        });
      } catch (error) {
        console.error('Translation error:', error);
        setTranslatedMilestone(milestone);
      } finally {
        setTranslatingMilestone(false);
      }
    };

    translateMilestone();
  }, [displayLanguage, isTranslationEnabled]); // Only depend on language changes

  // Function to handle submission translation when it comes into view
  const handleSubmissionInView = useCallback(async (submission: MilestoneSubmission) => {
    if (!isTranslationEnabled || translatingSubmissions.has(submission.id) || !submission.id) {
      return;
    }

    // Check if translation already exists
    const storedContent = getStoredTranslation(submission.contentTranslationMetadata, displayLanguage);
    const storedAiComment = submission.aiComment ? getStoredTranslation(submission.aiTranslationMetadata, displayLanguage) : null;
    
    if (storedContent && (!submission.aiComment || storedAiComment)) {
      return;
    }

    // Check if we've already processed this submission for this language
    const submissionKey = `${submission.id}-${displayLanguage}`;
    if (translatedSubmissions.has(submissionKey)) {
      return;
    }

    setTranslatingSubmissions(prev => new Set(prev).add(submission.id));

    try {
      // Translate content if needed
      if (!storedContent) {
        const translatedContent = await translateContent(submission.content, displayLanguage);
        if (translatedContent && translatedContent !== submission.content) {
          await storeTranslation('milestoneSubmission', submission.id, 'content', translatedContent, displayLanguage);
          
          // Update local submission with translation metadata
          setLocalSubmissions(prev => prev.map(sub => {
            if (sub.id === submission.id) {
              const newMetadata = {
                ...(sub.contentTranslationMetadata ? JSON.parse(sub.contentTranslationMetadata) : {}),
                [displayLanguage]: {
                  content: translatedContent,
                  timestamp: new Date().toISOString()
                }
              };
              return {
                ...sub,
                contentTranslationMetadata: JSON.stringify(newMetadata)
              };
            }
            return sub;
          }));
        }
      }

      // Translate AI comment if needed
      if (submission.aiComment && !storedAiComment) {
        const translatedAiComment = await translateContent(submission.aiComment, displayLanguage);
        if (translatedAiComment && translatedAiComment !== submission.aiComment) {
          await storeTranslation('milestoneSubmission', submission.id, 'aiComment', translatedAiComment, displayLanguage);
          
          // Update local submission with AI translation metadata
          setLocalSubmissions(prev => prev.map(sub => {
            if (sub.id === submission.id) {
              const newMetadata = {
                ...(sub.aiTranslationMetadata ? JSON.parse(sub.aiTranslationMetadata) : {}),
                [displayLanguage]: {
                  content: translatedAiComment,
                  timestamp: new Date().toISOString()
                }
              };
              return {
                ...sub,
                aiTranslationMetadata: JSON.stringify(newMetadata)
              };
            }
            return sub;
          }));
        }
      }

      // Mark as translated
      setTranslatedSubmissions(prev => new Set(prev).add(submissionKey));
    } catch (error) {
      console.error('Error translating submission:', error);
    } finally {
      setTranslatingSubmissions(prev => {
        const newSet = new Set(prev);
        newSet.delete(submission.id);
        return newSet;
      });
    }
  }, [isTranslationEnabled, translatingSubmissions, displayLanguage, getStoredTranslation, translateContent, storeTranslation]);

  // Handle milestone translation when it comes into view
  useEffect(() => {
    if (inView) {
      // This useEffect is no longer needed as translation is handled by the new useEffect
      // Keeping it for now in case it's used elsewhere or for future context, but it will be removed.
    }
  }, [inView]);

  const handleSubmission = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      let response;
      
      if (files.length > 0) {
        // Upload files with FormData
        const formData = new FormData();
        formData.append('content', submission);
        
        files.forEach((file) => {
          formData.append('files', file);
        });
        
        response = await fetch(`/api/groups/${groupId}/milestones/${milestone.id}/submissions`, {
          method: 'POST',
          body: formData,
        });
      } else {
        // Text-only submission
        response = await fetch(`/api/groups/${groupId}/milestones/${milestone.id}/submissions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: submission,
            files: []
          }),
        });
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit');
      }

      const result = await response.json();
      
      // Add the new submission to the list
      const newSubmission = result.submission;
      setLocalSubmissions(prev => [newSubmission, ...prev]);
      
      // Mark submission as being processed by AI
      setProcessingSubmissions(prev => new Set(prev).add(newSubmission.id));
      
      setSubmission("");
      setFiles([]);
    } catch (error) {
      console.error('Error submitting:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit work');
    } finally {
      setIsSubmitting(false);
    }
  };

  // const completionRate = localSubmissions.length > 0 
  //   ? (localSubmissions.filter(s => s.aiVerified).length / localSubmissions.length) * 100 
  //   : 0;

  // no users not verified / total users
  const completionRate = localSubmissions.length > 0 
    ? (localSubmissions.filter(s => s.aiVerified).length / localSubmissions.length) * 100 
    : 0;
  
  return (
    <Card className="mb-4 w-full max-w-full" ref={ref as React.RefObject<HTMLDivElement>}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <div>
                  <CardTitle className="text-lg">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <Globe className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {displayLanguage === 'en' ? 'Original' : `Translated from English`}
                        </span>
                        {translationProgress.title && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
                      </div>
                      <div className="flex items-center space-x-2">
                        {translationProgress.title ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                            <span className="text-muted-foreground">Translating title...</span>
                          </>
                        ) : (
                          <span>{displayLanguage === 'en' ? milestone.title : translatedMilestone.title}</span>
                        )}
                        {translatingMilestone && !translationProgress.title && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                      </div>
                    </div>
                  </CardTitle>
                  <CardDescription className="flex items-center space-x-2 mt-1">
                    <Clock className="h-3 w-3" />
                    <span>Due: {milestone.dueDate ? formatDate(milestone.dueDate) : 'No due date'}</span>
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={milestone.completed ? "default" : "outline"}>
                  {milestone.completed ? "Completed" : "In Progress"}
                </Badge>
                <Badge variant="secondary">{localSubmissions.length} submissions {milestone.id}</Badge>
                {isTranslationEnabled && (
                  <TranslationToggle
                    currentLanguage={displayLanguage}
                    onLanguageChange={setDisplayLanguage}
                  />
                )}
                {onEdit && (
                  <Button variant="ghost" size="sm" onClick={() => onEdit(milestone as Milestone)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button variant="ghost" size="sm" onClick={() => onDelete(milestone.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Description */}
            <div className="bg-muted/30 p-3 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm font-medium">Description</span>
                {translationProgress.description && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
              </div>
              {translationProgress.description ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-sm text-muted-foreground">Translating description...</span>
                </div>
              ) : (
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Globe className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {displayLanguage === 'en' ? 'Original' : 'Translated from English'}
                    </span>
                  </div>
                                     <p className="text-sm break-words whitespace-pre-wrap overflow-hidden">{displayLanguage === 'en' ? milestone.description : translatedMilestone.description}</p>
                </div>
              )}
            </div>

            {/* Progress */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Completion Progress</span>
                <span>{Math.round(completionRate)}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>

            {/* Submissions */}
            <div className="space-y-3">
                              <h4 className="font-medium text-sm">Submissions ({localSubmissions.length})</h4>
              
              {localSubmissions.map((submission) => {
                // Create individual useInView hook for each submission
                const SubmissionInViewComponent = () => {
                  const [submissionRef, submissionInView] = useInView({ threshold: 0.1 });
                  
                  useEffect(() => {
                    if (submissionInView) {
                      handleSubmissionInView(submission);
                    }
                  }, [submissionInView, submission.id]);
                  
                  return (
                    <div key={submission.id} className="border rounded-lg p-3 space-y-2" ref={submissionRef as React.RefObject<HTMLDivElement>}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">{submission.user.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">{submission.user}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(submission.submittedAt)}
                          </span>
                          {translatingSubmissions.has(submission.id) && (
                            <div className="flex items-center space-x-1">
                              <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                              <span className="text-xs text-blue-500">Translating...</span>
                            </div>
                          )}
                        </div>
                        <Badge variant={submission.aiVerified ? "default" : "secondary"} className="text-xs">
                          {submission.aiVerified ? (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              AI Verified
                            </>
                          ) : processingSubmissions.has(submission.id) ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              AI Processing...
                            </>
                          ) : (
                            "Pending Review"
                          )}
                        </Badge>
                      </div>
                      
                                             <div className="bg-muted/30 p-2 rounded overflow-hidden">
                         {translatingSubmissions.has(submission.id) ? (
                           <div className="flex items-center space-x-2">
                             <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                             <span className="text-sm text-muted-foreground">Translating submission...</span>
                           </div>
                         ) : (
                           <TranslationContent
                             originalContent={submission.content}
                             translatedContent={getStoredTranslation(submission.contentTranslationMetadata, displayLanguage)}
                             currentLanguage={displayLanguage}
                             sourceLanguage="en"
                           />
                         )}
                       </div>
                      
                      {submission.files.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {submission.files.map((file, index) => (
                            <a
                              key={index}
                              href={file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                            >
                              <Paperclip className="h-3 w-3 mr-1" />
                              {file.split('/').pop() || 'File'}
                            </a>
                          ))}
                        </div>
                      )}

                      {submission.aiComment && (
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-2 rounded">
                          <div className="flex items-center space-x-1 mb-1">
                            <Brain className="h-3 w-3 text-blue-600" />
                            <span className="text-xs font-medium text-blue-600">AI Feedback</span>
                            {translatingSubmissions.has(submission.id) && (
                              <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                            )}
                          </div>
                                                     <div className="text-xs text-blue-800 overflow-hidden">
                             {translatingSubmissions.has(submission.id) ? (
                               <div className="flex items-center space-x-2">
                                 <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                                 <span className="text-muted-foreground">Translating AI feedback...</span>
                               </div>
                             ) : (
                               <TranslationContent
                                 originalContent={submission.aiComment}
                                 translatedContent={getStoredTranslation(submission.aiTranslationMetadata, displayLanguage)}
                                 currentLanguage={displayLanguage}
                                 sourceLanguage="en"
                               />
                             )}
                           </div>
                        </div>
                      )}
                    </div>
                  );
                };
                
                return <SubmissionInViewComponent key={submission.id} />;
              })}
            </div>

            {/* Submit Work */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-sm mb-3">Submit Your Work</h4>
              
              <div className="space-y-3">
                <Textarea
                  placeholder="Describe what you've completed for this milestone..."
                  value={submission}
                  onChange={(e) => setSubmission(e.target.value)}
                  className="min-h-[80px]"
                  disabled={milestone.completed ||  milestone.userVerified}
                />
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      multiple
                      onChange={(e) => {
                        const selectedFiles = Array.from(e.target.files || []);
                        setFiles(selectedFiles);
                      }}
                      className="hidden"
                      id={`file-upload-${milestone.id}`}
                      accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                    />
                    <label htmlFor={`file-upload-${milestone.id}`}>
                      <Button variant="outline" size="sm" asChild disabled={milestone.completed || milestone.userVerified}>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Files
                        </span>
                      </Button>
                    </label>
                    <span className="text-xs text-muted-foreground">
                      Attach images, documents, or screenshots
                    </span>
                  </div>
                  
                  {files.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">Selected files:</span>
                      <div className="flex flex-wrap gap-1">
                        {files.map((file, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            <Paperclip className="h-3 w-3 mr-1" />
                            {file.name}
                            <button
                              onClick={() => setFiles(files.filter((_, i) => i !== index))}
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <Button onClick={handleSubmission} disabled={!submission.trim() || isSubmitting || milestone.completed || milestone.userVerified}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Submit for AI Review'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
