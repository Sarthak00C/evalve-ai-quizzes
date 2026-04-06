import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Users, Brain } from "lucide-react";

export default function DashboardPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const actions = [
    ...(profile?.role === "teacher"
      ? [{ title: "Organize a Quiz", description: "Create and share a quiz with your students", icon: PlusCircle, url: "/create-quiz", iconBg: "bg-primary/10 text-primary" }]
      : []),
    { title: "Join a Quiz", description: "Enter a quiz code to participate", icon: Users, url: "/join-quiz", iconBg: "bg-secondary/10 text-secondary" },
    { title: "AI Practice Quiz", description: "Generate a practice quiz with AI", icon: Brain, url: "/create-quiz?ai=true", iconBg: "bg-accent/10 text-accent" },
  ];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h2 className="font-heading text-3xl font-bold tracking-tight">
            Welcome back, {profile?.name || "User"} 👋
          </h2>
          <p className="text-muted-foreground mt-1.5">
            {profile?.role === "teacher" ? "Manage and organize your quizzes" : "Join quizzes and track your progress"}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map((action) => (
            <Card
              key={action.title}
              className="cursor-pointer rounded-2xl shadow-card transition-all duration-200 hover:shadow-elevated hover:-translate-y-1"
              onClick={() => navigate(action.url)}
            >
              <CardHeader className="p-6">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${action.iconBg}`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <CardTitle className="font-heading text-lg mt-3">{action.title}</CardTitle>
                <CardDescription className="text-sm">{action.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
