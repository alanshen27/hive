import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Target, Users, Rocket, CheckCircle } from "lucide-react";

export default function HowItWorksSection() {
  const steps = [
    { 
      title: "Find Your Perfect Group", 
      desc: "Browse study groups by subject, level, and schedule. Use AI-powered recommendations to find the ideal match for your learning goals.",
      icon: Search,
      color: "blue"
    },
    { 
      title: "Set Smart Milestones", 
      desc: "Create personalized learning milestones with AI assistance. Break down complex topics into manageable, trackable goals.",
      icon: Target,
      color: "green"
    },
    { 
      title: "Collaborate & Learn", 
      desc: "Join real-time study sessions, chat with peers, and share resources. Get instant AI feedback on your progress.",
      icon: Users,
      color: "purple"
    },
    { 
      title: "Track & Celebrate", 
      desc: "Monitor your progress with detailed analytics. Celebrate achievements and stay motivated with your study group.",
      icon: CheckCircle,
      color: "orange"
    },
  ];
  
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            🎯 How It Works
          </Badge>
          <h2 className="text-4xl font-bold mb-4">
            Get started in 
            <span className="text-primary"> 4 simple steps</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Your journey to better learning starts here. Simple, effective, and designed for success.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.title} className="relative">
              <Card className="text-center h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <div className={`p-4 rounded-full bg-${step.color}-100 dark:bg-${step.color}-900/30`}>
                      <step.icon className={`h-8 w-8 text-${step.color}-600 dark:text-${step.color}-400`} />
                    </div>
                  </div>
                  <div className="flex items-center justify-center mb-2">
                    <Badge variant="secondary" className="text-xs">
                      Step {index + 1}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                </CardContent>
              </Card>
              
              {/* Connection line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary/50 to-primary/20 transform -translate-y-1/2" />
              )}
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 rounded-full">
            <Rocket className="h-5 w-5 text-primary" />
            <span className="text-primary font-medium">Ready to start your learning journey?</span>
          </div>
        </div>
      </div>
    </section>
  );
}


