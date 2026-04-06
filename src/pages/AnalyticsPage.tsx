import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Target, BookOpen } from "lucide-react";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttempts = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("attempts")
        .select("*, quizzes(title, topic)")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: true });
      setAttempts(data || []);
      setLoading(false);
    };
    fetchAttempts();
  }, [user]);

  const totalAttempts = attempts.length;
  const totalCorrect = attempts.reduce((sum, a) => sum + a.score, 0);
  const totalQuestions = attempts.reduce((sum, a) => sum + a.total_questions, 0);
  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const scoreHistory = attempts.map((a, i) => ({
    name: `Quiz ${i + 1}`,
    score: a.total_questions > 0 ? Math.round((a.score / a.total_questions) * 100) : 0,
  }));

  const pieData = [
    { name: "Correct", value: totalCorrect },
    { name: "Wrong", value: totalQuestions - totalCorrect },
  ];

  // Using CSS custom properties for chart colors
  const COLORS = ["hsl(var(--chart-correct))", "hsl(var(--chart-wrong))"];

  const stats = [
    { label: "Quizzes Taken", value: totalAttempts, icon: BookOpen, bg: "bg-primary/10 text-primary" },
    { label: "Accuracy", value: `${accuracy}%`, icon: Target, bg: "bg-accent/10 text-accent" },
    { label: "Total Score", value: `${totalCorrect}/${totalQuestions}`, icon: TrendingUp, bg: "bg-secondary/10 text-secondary" },
  ];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="font-heading text-3xl font-bold tracking-tight">Performance Analytics</h2>
          <p className="text-muted-foreground mt-1">Track your quiz performance over time</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.label} className="rounded-2xl shadow-card">
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="font-heading text-2xl font-bold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {attempts.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-2xl shadow-card">
              <CardHeader>
                <CardTitle className="font-heading">Score History</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={scoreHistory}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis domain={[0, 100]} className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "0.75rem",
                        border: "1px solid hsl(var(--border))",
                        backgroundColor: "hsl(var(--card))",
                        color: "hsl(var(--card-foreground))",
                      }}
                    />
                    <Bar dataKey="score" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="rounded-2xl shadow-card">
              <CardHeader>
                <CardTitle className="font-heading">Accuracy Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={pieData} innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "0.75rem",
                        border: "1px solid hsl(var(--border))",
                        backgroundColor: "hsl(var(--card))",
                        color: "hsl(var(--card-foreground))",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="rounded-2xl shadow-card">
            <CardContent className="py-16 text-center text-muted-foreground">
              <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-30" />
              <p className="text-lg font-medium">No quizzes attempted yet</p>
              <p className="text-sm mt-1">Join a quiz to see your analytics here!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
