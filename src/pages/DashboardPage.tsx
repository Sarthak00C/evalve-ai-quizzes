import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Users, Brain } from "lucide-react";

export default function DashboardPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const actions = [
    ...(profile?.role === "teacher"
      ? [{ title: "Organize a Quiz", description: "Create and share a quiz with your students", icon: PlusCircle, url: "/create-quiz", color: "bg-primary/10 text-primary" }]
      : []),
    { title: "Join a Quiz", description: "Enter a quiz code to participate", icon: Users, url: "/join-quiz", color: "bg-accent text-accent-foreground" },
    { title: "AI Practice Quiz", description: "Generate a practice quiz with AI", icon: Brain, url: "/create-quiz?ai=true", color: "bg-secondary text-secondary-foreground" },
  ];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h2 className="font-heading text-3xl font-bold tracking-tight">
            Welcome back, {profile?.name || "User"} 👋
          </h2>
          <p className="text-muted-foreground mt-1">
            {profile?.role === "teacher" ? "Manage and organize your quizzes" : "Join quizzes and track your progress"}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map((action) => (
            <Card
              key={action.title}
              className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1"
              onClick={() => navigate(action.url)}
            >
              <CardHeader>
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${action.color}`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <CardTitle className="font-heading text-lg">{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
