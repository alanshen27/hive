import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Star, ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function CTASection() {
  return (
    <section className="py-24 bg-gradient-to-br from-primary/5 via-background to-secondary/20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            🚀 Join Thousands of Students
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to transform your 
            <span className="text-primary"> learning experience</span>?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Join thousands of students who are already studying smarter with AI-powered groups, 
            real-time collaboration, and personalized learning paths.
          </p>
          
          <div className="flex items-center justify-center gap-8 mb-12">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>10,000+ Active Students</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="h-4 w-4" />
              <span>4.9/5 Rating</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4" />
              <span>95% Success Rate</span>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-4 mb-8">
            <Button size="lg" className="text-lg px-8 py-6" asChild>
              <Link href="/auth">
                Start Learning Together
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6" asChild>
              <Link href="/explore">Explore Groups</Link>
            </Button>
          </div>
        </div>
        
        {/* Testimonial cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="text-center border-0 shadow-lg bg-background/80 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex justify-center mb-4">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">S</div>
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">M</div>
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">A</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                "The AI milestones helped me stay on track and the group collaboration made studying fun!"
              </p>
              <p className="text-xs font-medium">Sarah M. - Computer Science</p>
            </CardContent>
          </Card>
          
          <Card className="text-center border-0 shadow-lg bg-background/80 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex justify-center mb-4">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">M</div>
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">A</div>
                  <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">T</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                "Found my perfect study group in minutes. The video sessions are game-changing!"
              </p>
              <p className="text-xs font-medium">Mike A. - Mathematics</p>
            </CardContent>
          </Card>
          
          <Card className="text-center border-0 shadow-lg bg-background/80 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex justify-center mb-4">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">E</div>
                  <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white text-xs font-bold">L</div>
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold">I</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                "The translation feature helped me study with international students. Amazing platform!"
              </p>
              <p className="text-xs font-medium">Elena L. - Language Learning</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}


