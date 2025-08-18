'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Search, Users, MessageSquare, Video, Target, Brain, Filter, Plus, Bell, Settings, Star, TrendingUp, Clock, X, Loader2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { toast } from "sonner";

interface Group {
  id: string;
  name: string;
  description: string;
  subject: string;
  level: string;
  isPrivate: boolean;
  maxMembers: number;
  createdAt: string;
  owner: {
    id: string;
    name: string;
    avatar?: string;
  };
  _count: {
    members: number;
    messages: number;
  };
  role?: string;
}


const subjects = ["All", "Mathematics", "Chemistry", "Computer Science", "Physics", "Psychology", "Literature", "Biology"];
const levels = ["All", "High School", "Undergraduate", "Graduate", "Professional"];

// Loading skeleton components
const GroupCardSkeleton = () => (
  <Card className="hover:shadow-glow transition-all duration-300">
    <CardHeader>
      <div className="flex items-start justify-between mb-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="flex items-center space-x-2 mb-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-24" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </CardHeader>
    <CardContent>
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
      <div className="flex space-x-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 flex-1" />
      </div>
    </CardContent>
  </Card>
);

const SearchSuggestionsSkeleton = () => (
  <div className="absolute top-full left-0 right-0 mt-2 bg-card border rounded-xl shadow-lg z-50 overflow-hidden">
    <div className="p-4">
      <div className="text-xs font-semibold text-muted-foreground mb-3 tracking-wide">SUGGESTIONS</div>
      <div className="space-y-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center px-3 py-2">
            <Skeleton className="h-3 w-3 mr-3" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function ExplorePage() {
  const { data: session, status } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");

  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const [groups, setGroups] = useState<Group[]>([]);
  const [userPreferences, setUserPreferences] = useState<{
    subjects: string[];
    interests: string[];
    level: string;
    preferredLanguage: { code: string; name: string };
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch groups
        const groupsResponse = await fetch('/api/groups');
        if (!groupsResponse.ok) throw new Error('Failed to fetch groups');
        const groupsData = await groupsResponse.json();
        setGroups(groupsData.groups);

        // Fetch user preferences if logged in
        if (session?.user?.id) {
          try {
            const prefsResponse = await fetch('/api/user-preferences');
            if (prefsResponse.ok) {
              const prefsData = await prefsResponse.json();
              setUserPreferences(prefsData);
            }
          } catch (prefsErr) {
            console.error('Failed to load user preferences:', prefsErr);
          }
        }
      } catch (err) {
        console.error('Failed to load groups:', err);
        toast.error('Failed to load groups. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [session?.user?.id]);

  // Simulate search delay for better UX
  useEffect(() => {
    if (searchQuery.length > 2) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        setIsSearching(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setIsSearching(false);
    }
  }, [searchQuery]);

  // Generate recommendations based on user preferences
  const recommendedGroups = groups.filter(group => {
    // Don't recommend groups the user is already in
    if (group.role) return false;
    
    // Don't recommend full groups
    if (group._count.members >= group.maxMembers) return false;
    
    // If no user preferences, just recommend any available group
    if (!userPreferences) return true;
    
    // Calculate recommendation score based on preferences
    let score = 0;
    
    // Subject match (highest weight)
    if (userPreferences.subjects.includes(group.subject)) {
      score += 10;
    }
    
    // Level match (high weight)
    if (userPreferences.level === group.level) {
      score += 8;
    }
    
    // Interest keywords in description (medium weight)
    const descriptionLower = group.description.toLowerCase();
    userPreferences.interests.forEach(interest => {
      if (descriptionLower.includes(interest.toLowerCase())) {
        score += 3;
      }
    });
    
    // Newer groups get slight boost
    const daysSinceCreated = Math.floor((Date.now() - new Date(group.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceCreated <= 7) score += 2;
    
    // Return groups with a score above threshold
    return score >= 5;
  }).sort((a, b) => {
    // Sort by recommendation score (simplified calculation)
    const getScore = (group: Group) => {
      if (!userPreferences) return 0;
      let score = 0;
      if (userPreferences.subjects.includes(group.subject)) score += 10;
      if (userPreferences.level === group.level) score += 8;
      return score;
    };
    return getScore(b) - getScore(a);
  });

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         group.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === "All" || group.subject === selectedSubject;
    const matchesLevel = selectedLevel === "All" || group.level === selectedLevel;
    const matchesAvailability = !showOnlyAvailable || group._count.members < group.maxMembers;
    
    return matchesSearch && matchesSubject && matchesLevel && matchesAvailability;
  }).sort((a, b) => {
    switch (sortBy) {
      case "members":
        return b._count.members - a._count.members;
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      default:
        return 0;
    }
  });

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedSubject("All");
    setSelectedLevel("All");
    setShowOnlyAvailable(false);
    setSortBy("newest");
    setActiveFilters([]);
  };

  const hasActiveFilters = searchQuery || selectedSubject !== "All" || selectedLevel !== "All" || showOnlyAvailable;

  const [joiningGroups, setJoiningGroups] = useState<Set<string>>(new Set());

  const handleJoinGroup = async (groupId: string) => {
    if (!session?.user?.id) {
      // Redirect to login or show login modal
      return;
    }

    setJoiningGroups(prev => new Set(prev).add(groupId));
    
    try {
      const response = await fetch(`/api/groups/${groupId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to join group');
      }

      // Update the group in the list to show as joined
      setGroups(prev => prev.map(g => 
        g.id === groupId 
          ? { ...g, role: 'member' }
          : g
      ));

      // Show success message
      toast.success('Successfully joined the group!');
    } catch (error) {
      console.error('Error joining group:', error);
      toast.error('Failed to join group. Please try again.');
    } finally {
      setJoiningGroups(prev => {
        const newSet = new Set(prev);
        newSet.delete(groupId);
        return newSet;
      });
    }
  };

  const GroupCard = ({ group }: { group: Group }) => (
    <Card key={group.id} className="hover:shadow-glow transition-all duration-300 relative">
      {recommendedGroups.some(recGroup => recGroup.id === group.id) && (
        <div className="absolute top-2 right-2 z-10">
          <Badge variant="secondary" className="bg-gradient-hero text-white">
            <TrendingUp className="h-3 w-3 mr-1" />
            Recommended
          </Badge>
        </div>
      )}
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <CardTitle className="text-lg pr-16">{group.name}</CardTitle>
          {group.role && (
            <Badge variant="secondary">Joined</Badge>
          )}
        </div>
        <div className="flex items-center space-x-2 mb-2">
          <Badge variant="outline">{group.subject}</Badge>
          <Badge variant="outline">{group.level}</Badge>
        </div>
        <CardDescription>{group.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {group._count.members}/{group.maxMembers} members
            </span>
            <span className={`font-medium ${group._count.members === group.maxMembers ? 'text-destructive' : 'text-green-600'}`}>
              {group._count.members === group.maxMembers ? 'Full' : `${group.maxMembers - group._count.members} spots`}
            </span>
          </div>
        </div>

        <div className="flex space-x-2">
          {group.role ? (
            <>
              <Button variant="default" size="sm" className="flex-1" asChild>
                <Link href={`/group/${group.id}`}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Open
                </Link>
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1" asChild>
                        <Link href={`/group-detail/${group.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="flex-1"
                        disabled={group._count.members === group.maxMembers || joiningGroups.has(group.id)}
                        onClick={() => handleJoinGroup(group.id)}
                      >
                        {joiningGroups.has(group.id) ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Joining...
                          </>
                        ) : (
                          'Join Group'
                        )}
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1" asChild>
                        <Link href={`/group-detail/${group.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
  );

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Explore Study Groups</h1>
          <p className="text-muted-foreground">
            Discover and join study groups that match your interests
          </p>
        </div>
        <Button variant="default">
          <Plus className="h-4 w-4 mr-2" />
          Create Group
        </Button>
      </div>

      {/* Enhanced Search Bar */}
      <div className="relative mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            placeholder="Search study groups, topics, or subjects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-12 h-14 text-base bg-card border-2 focus:border-primary transition-all duration-200 shadow-sm"
            disabled={isLoading}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Search Suggestions */}
        {searchQuery && searchQuery.length > 2 && !isSearching && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-card border rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="p-4">
              <div className="text-xs font-semibold text-muted-foreground mb-3 tracking-wide">SUGGESTIONS</div>
              <div className="space-y-1">
                {["Advanced Calculus", "Organic Chemistry", "Computer Science", "Linear Algebra", "Physics"].filter(term => 
                  term.toLowerCase().includes(searchQuery.toLowerCase()) && term.toLowerCase() !== searchQuery.toLowerCase()
                ).slice(0, 4).map(suggestion => (
                  <button
                    key={suggestion}
                    className="flex items-center w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-lg transition-colors"
                    onClick={() => setSearchQuery(suggestion)}
                  >
                    <Search className="h-3 w-3 mr-3 text-muted-foreground" />
                    <span className="font-medium">{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Search Suggestions Loading */}
        {searchQuery && searchQuery.length > 2 && isSearching && (
          <SearchSuggestionsSkeleton />
        )}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex flex-wrap gap-2">
              <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={isLoading}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedLevel} onValueChange={setSelectedLevel} disabled={isLoading}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy} disabled={isLoading}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="members">Most Members</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="available" 
                  checked={showOnlyAvailable}
                  onCheckedChange={(checked) => setShowOnlyAvailable(checked === true)}
                  disabled={isLoading}
                />
                <Label htmlFor="available" className="text-sm font-medium">
                  Available spots only
                </Label>
              </div>

              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearAllFilters} disabled={isLoading}>
                  <X className="h-3 w-3 mr-1" />
                  Clear all
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-6">
          {/* Results Summary Skeleton */}
          <Skeleton className="h-4 w-48" />
          
          {/* Recommended Groups Skeleton */}
          <div>
            <div className="flex items-center mb-4">
              <Skeleton className="h-5 w-5 mr-2" />
              <Skeleton className="h-6 w-48" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((i) => (
                <GroupCardSkeleton key={i} />
              ))}
            </div>
            <Separator className="my-8" />
          </div>

          {/* All Groups Skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-10 w-96" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <GroupCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content when loaded */}
      {!isLoading && (
        <>
          {/* Results Summary */}
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              {filteredGroups.length} groups found {searchQuery && `for "${searchQuery}"`}
            </p>
          </div>

          {/* Recommended Groups */}
          {!hasActiveFilters && (
            <div>
              <div className="flex items-center mb-4">
                <TrendingUp className="h-5 w-5 text-primary mr-2" />
                <h2 className="text-xl font-semibold">
                  {userPreferences ? 'Recommended for You' : 'Popular Groups'}
                </h2>
                {!userPreferences && session?.user?.id && (
                  <Badge variant="outline" className="ml-2">
                    <Link href="/onboarding" className="text-xs">
                      Set preferences
                    </Link>
                  </Badge>
                )}
              </div>
              {recommendedGroups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {recommendedGroups.slice(0, 3).map((group) => (
                    <GroupCard key={group.id} group={group} />
                  ))}
                </div>
              ) : (
                <Card className="mb-8">
                  <CardContent className="p-6 text-center">
                    <Brain className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      {userPreferences 
                        ? "No groups match your current preferences. Try adjusting your filters or check back later!"
                        : "Complete your profile to get personalized recommendations."
                      }
                    </p>
                    {!userPreferences && session?.user?.id && (
                      <Button variant="outline" className="mt-3" asChild>
                        <Link href="/onboarding">
                          Set Your Preferences
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
              <Separator className="my-8" />
            </div>
          )}

          {/* All Groups */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4 max-w-md">
              <TabsTrigger value="all">All Groups</TabsTrigger>
              <TabsTrigger value="joined">My Groups</TabsTrigger>
              <TabsTrigger value="available">Available</TabsTrigger>
              <TabsTrigger value="new">New</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGroups.map((group) => (
                  <GroupCard key={group.id} group={group} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="joined" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGroups.filter(group => group.role).map((group) => (
                  <GroupCard key={group.id} group={group} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="available" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGroups.filter(group => !group.role && group._count.members < group.maxMembers).map((group) => (
                  <GroupCard key={group.id} group={group} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="new" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGroups.filter(group => {
                  const groupDate = new Date(group.createdAt);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return groupDate > weekAgo;
                }).map((group) => (
                  <GroupCard key={group.id} group={group} />
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Empty State */}
          {filteredGroups.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No groups found</h3>
                <p className="text-muted-foreground mb-6">
                Try adjusting your filters or search terms, or create a new group to get started.
                </p>
                <div className="flex justify-center space-x-4">
                  <Button variant="default">Create Your Own Group</Button>
                  {hasActiveFilters && (
                    <Button variant="outline" onClick={clearAllFilters}>
                      Clear Filters
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}


