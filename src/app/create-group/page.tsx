'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Plus, 
  Loader2, 
  Users, 
  Lock, 
  Globe, 
  BookOpen, 
  Target,
  Sparkles,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const subjects = [
  "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science",
  "Engineering", "Literature", "History", "Psychology", "Economics",
  "Art", "Music", "Philosophy", "Language Learning", "Medicine"
];

const levels = [
  { value: "high-school", label: "High School" },
  { value: "undergraduate", label: "Undergraduate" },
  { value: "graduate", label: "Graduate" },
  { value: "professional", label: "Professional" }
];

const maxMembersOptions = [5, 10, 15, 20, 25, 30, 50];

export default function CreateGroupPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    subject: "",
    level: "",
    isPrivate: false,
    maxMembers: 10
  });

  // Form validation - only show errors after first submission
  const formErrors = hasSubmitted ? {
    name: formData.name.length < 3 ? "Group name must be at least 3 characters" : "",
    description: formData.description.length < 10 ? "Description must be at least 10 characters" : "",
    subject: !formData.subject ? "Please select a subject" : "",
    level: !formData.level ? "Please select an academic level" : ""
  } : {
    name: "",
    description: "",
    subject: "",
    level: ""
  };


  // Calculate form completion percentage
  const completedFields = [
    formData.name.length >= 3,
    formData.description.length >= 10,
    !!formData.subject,
    !!formData.level
  ].filter(Boolean).length;
  
  const completionPercentage = (completedFields / 4) * 100;
  
  // Calculate remaining fields for display
  const remainingFields = 4 - completedFields;

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Set hasSubmitted to true to show validation errors
    setHasSubmitted(true);
    
    if (!session?.user?.id) {
      setError("You must be logged in to create a group");
      return;
    }

    // Check for validation errors
    const validationErrors = {
      name: formData.name.length < 3 ? "Group name must be at least 3 characters" : "",
      description: formData.description.length < 10 ? "Description must be at least 10 characters" : "",
      subject: !formData.subject ? "Please select a subject" : "",
      level: !formData.level ? "Please select an academic level" : ""
    };

    const hasErrors = Object.values(validationErrors).some(error => error);
    const isFormValid = formData.name.trim() && 
                       formData.description.trim() && 
                       formData.subject && 
                       formData.level && 
                       !hasErrors;

    // If there are validation errors, don't submit
    if (hasErrors) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create group');
      }

      const result = await response.json();
      toast.success('Group created successfully!');
      router.push(`/group/${result.id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">


      <div className="max-w-3xl mx-auto">
        {/* Progress Indicator */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Group</CardTitle>
            <CardDescription>Start a new study group and invite others to join</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Form Completion</span>
              <span className="text-sm text-muted-foreground">{Math.round(completionPercentage)}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
            <div className="flex items-center space-x-2 mt-2">
              {completedFields === 4 ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">All fields completed!</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-muted-foreground">
                    {remainingFields} field{remainingFields !== 1 ? 's' : ''} remaining
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Group Details
            </CardTitle>
            <CardDescription>
              Fill in the details below to create your study group. All fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Group Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  Group Name *
                  {formErrors.name && <Badge variant="destructive" className="text-xs">Required</Badge>}
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Advanced Calculus Study Group"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={formErrors.name ? 'border-destructive' : ''}
                />
                {formErrors.name && (
                  <p className="text-sm text-destructive">{formErrors.name}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Choose a descriptive name that reflects your group's focus
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center gap-2">
                  Description *
                  {formErrors.description && <Badge variant="destructive" className="text-xs">Required</Badge>}
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this group will focus on, study goals, meeting schedule, and expectations for members..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className={formErrors.description ? 'border-destructive' : ''}
                />
                <div className="flex items-center justify-between">
                  {formErrors.description && (
                    <p className="text-sm text-destructive">{formErrors.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground ml-auto">
                    {formData.description.length}/500 characters
                  </p>
                </div>
              </div>

              {/* Subject and Level */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject" className="flex items-center gap-2">
                    Subject *
                    {formErrors.subject && <Badge variant="destructive" className="text-xs">Required</Badge>}
                  </Label>
                  <Select value={formData.subject} onValueChange={(value) => handleInputChange('subject', value)}>
                    <SelectTrigger className={formErrors.subject ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.subject && (
                    <p className="text-sm text-destructive">{formErrors.subject}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level" className="flex items-center gap-2">
                    Academic Level *
                    {formErrors.level && <Badge variant="destructive" className="text-xs">Required</Badge>}
                  </Label>
                  <Select value={formData.level} onValueChange={(value) => handleInputChange('level', value)}>
                    <SelectTrigger className={formErrors.level ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {levels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.level && (
                    <p className="text-sm text-destructive">{formErrors.level}</p>
                  )}
                </div>
              </div>

              {/* Group Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Group Settings
                </h3>
                
                {/* Max Members */}
                <div className="space-y-2">
                  <Label htmlFor="maxMembers">Maximum Members</Label>
                  <Select 
                    value={formData.maxMembers.toString()} 
                    onValueChange={(value) => handleInputChange('maxMembers', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {maxMembersOptions.map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {num} members
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Choose the maximum number of members for your group
                  </p>
                </div>

                {/* Privacy Setting */}
                <div className="flex items-start space-x-3 p-4 border rounded-lg">
                  <Checkbox
                    id="isPrivate"
                    checked={formData.isPrivate}
                    onCheckedChange={(checked) => handleInputChange('isPrivate', checked as boolean)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="isPrivate" className="text-sm font-medium flex items-center gap-2">
                      {formData.isPrivate ? (
                        <>
                          <Lock className="h-4 w-4 text-orange-600" />
                          Private Group
                        </>
                      ) : (
                        <>
                          <Globe className="h-4 w-4 text-green-600" />
                          Public Group
                        </>
                      )}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {formData.isPrivate 
                        ? "Only invited members can join. You'll need to approve join requests."
                        : "Anyone can discover and join your group. You can still moderate membership."
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button variant="outline" type="button" asChild>
                  <Link href="/dashboard">Cancel</Link>
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="min-w-[140px]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Group
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Tips for a Great Study Group
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Group Name</h4>
                <p className="text-xs text-muted-foreground">
                  Be specific and descriptive. Include the subject and level to help others find your group.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Description</h4>
                <p className="text-xs text-muted-foreground">
                  Explain your study goals, meeting schedule, and what members can expect.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Privacy</h4>
                <p className="text-xs text-muted-foreground">
                  Start with public if you want to grow quickly, or private for more control over membership.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Group Size</h4>
                <p className="text-xs text-muted-foreground">
                  Smaller groups (5-15) work better for focused discussions, larger groups for diverse perspectives.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
