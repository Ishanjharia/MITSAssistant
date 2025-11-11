import { GraduationCap, BookOpen, Calendar, Mail, MapPin, Users, Building2, Trophy, Briefcase, Coffee } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface EmptyStateProps {
  onQuestionClick: (question: string) => void;
}

const exampleQuestions = [
  {
    icon: GraduationCap,
    text: "What are the admission requirements?",
    question: "What are the admission requirements for B.Tech at MITS?",
  },
  {
    icon: BookOpen,
    text: "Tell me about courses offered",
    question: "What courses and programs are offered at MITS?",
  },
  {
    icon: Calendar,
    text: "Important dates and events",
    question: "What are the important academic dates and upcoming events at MITS?",
  },
  {
    icon: Mail,
    text: "How do I contact the college?",
    question: "What is the contact information for MITS Gwalior?",
  },
];

const quickActions = [
  { label: "Admissions", icon: GraduationCap, question: "Tell me about the admission process for B.Tech" },
  { label: "Contact Info", icon: Mail, question: "How can I contact MITS Gwalior?" },
  { label: "Departments", icon: Building2, question: "What departments and branches are available?" },
  { label: "Placements", icon: Briefcase, question: "What are the placement statistics and top recruiters?" },
  { label: "Facilities", icon: MapPin, question: "What facilities are available on campus?" },
  { label: "Campus Life", icon: Coffee, question: "What is campus life like at MITS? Tell me about student activities and culture" },
  { label: "Fee Structure", icon: BookOpen, question: "What is the fee structure for B.Tech programs?" },
  { label: "Hostel", icon: Users, question: "Tell me about hostel facilities and accommodation" },
];

export function EmptyState({ onQuestionClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-12" data-testid="empty-state">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary mb-2">
            <GraduationCap className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold font-serif text-foreground">
            Welcome to MITS Assistant
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
            Ask me anything about Madhav Institute of Technology & Science, Gwalior. 
            I'll provide accurate answers with sources from the official website.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {exampleQuestions.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Card
                key={idx}
                className="p-4 hover-elevate active-elevate-2 cursor-pointer transition-all"
                onClick={() => onQuestionClick(item.question)}
                data-testid={`example-question-${idx}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground leading-snug">
                      {item.text}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Quick Actions</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="px-3 py-2 cursor-pointer hover-elevate active-elevate-2 gap-1.5"
                  onClick={() => onQuestionClick(action.question)}
                  data-testid={`quick-action-${idx}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{action.label}</span>
                </Badge>
              );
            })}
          </div>
        </div>

        <div className="pt-4 text-center">
          <p className="text-xs text-muted-foreground">
            All answers are sourced from official MITS web pages and include citations.
          </p>
        </div>
      </div>
    </div>
  );
}
