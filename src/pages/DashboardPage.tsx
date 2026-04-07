import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PlusCircle, Users, Brain, Trophy, Target, TrendingUp,
  BookOpen, Clock, Medal, AlertTriangle,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

interface Attempt {
  id: string;
  score: number;
  total_questions: number;
  completed_at: string;
  quiz_id: string;
  user_id: string;
  answers: any;
  quizzes: { title: string; topic: string } | null;
}

interface LeaderboardUser {
  name: string;
  totalScore: number;
  totalQuestions: number;
}

export default function DashboardPage() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [leaderboard, setLeaderboard] = useState<{ rank: number; name: string; score: number }[]>([]);
  const [activeQuizzes, setActiveQuizzes] = useState<{ id: string; title: string; quiz_code: string; time_limit: number }[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Fetch user attempts, all attempts for leaderboard, and active quizzes in parallel
      const [attemptsRes, allAttemptsRes, activeRes] = await Promise.all([
        supabase
          .from("attempts")
          .select("*, quizzes(title, topic)")
          .eq("user_id", user.id)
          .order("completed_at", { ascending: true }),
        supabase
          .from("attempts")
          .select("score, total_questions, user_id")
          .order("score", { ascending: false }),
        supabase
          .from("quizzes")
          .select("id, title, quiz_code, time_limit")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(3),
      ]);

      setAttempts((attemptsRes.data as Attempt[]) || []);
      setActiveQuizzes(activeRes.data || []);

      // Build global leaderboard from all attempts
      if (allAttemptsRes.data) {
        const userScores = new Map<string, { total: number; questions: number }>();
        allAttemptsRes.data.forEach((a) => {
          const prev = userScores.get(a.user_id) || { total: 0, questions: 0 };
          userScores.set(a.user_id, {
            total: prev.total + a.score,
            questions: prev.questions + a.total_questions,
          });
        });

        const userIds = [...userScores.keys()];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", userIds);
        const nameMap = new Map(profiles?.map((p) => [p.id, p.name]) ?? []);

        const sorted = Array.from(userScores.entries())
          .map(([uid, s]) => ({
            uid,
            name: nameMap.get(uid) || "Unknown",
            score: s.questions > 0 ? Math.round((s.total / s.questions) * 100) : 0,
          }))
          .sort((a, b) => b.score - a.score);

        setLeaderboard(sorted.slice(0, 5).map((e, i) => ({ rank: i + 1, name: e.name, score: e.score })));
        const myIdx = sorted.findIndex((e) => e.uid === user.id);
        setUserRank(myIdx >= 0 ? myIdx + 1 : null);
      }

      setLoading(false);
    };
    load();
  }, [user]);

  // Stats
  const totalQuizzes = attempts.length;
  const totalCorrect = attempts.reduce((s, a) => s + a.score, 0);
  const totalQ = attempts.reduce((s, a) => s + a.total_questions, 0);
  const avgScore = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0;
  const bestScore = attempts.length > 0
    ? Math.max(...attempts.map((a) => (a.total_questions > 0 ? Math.round((a.score / a.total_questions) * 100) : 0)))
    : 0;

  // Performance chart data
  const chartData = attempts.map((a, i) => ({
    name: format(new Date(a.completed_at), "MMM d"),
    score: a.total_questions > 0 ? Math.round((a.score / a.total_questions) * 100) : 0,
  }));

  // Recent activity (last 5)
  const recentActivity = [...attempts].reverse().slice(0, 5);

  // Weak topics — find topics where avg score < 60%
  const topicScores = new Map<string, { correct: number; total: number }>();
  attempts.forEach((a) => {
    const topic = a.quizzes?.topic || "General";
    const prev = topicScores.get(topic) || { correct: 0, total: 0 };
    topicScores.set(topic, { correct: prev.correct + a.score, total: prev.total + a.total_questions });
  });
  const weakTopics = Array.from(topicScores.entries())
    .filter(([, v]) => v.total > 0 && (v.correct / v.total) < 0.6)
    .map(([t]) => t);

  const stats = [
    { label: "Quizzes Attempted", value: totalQuizzes, icon: BookOpen, color: "bg-primary/10 text-primary" },
    { label: "Average Score", value: `${avgScore}%`, icon: Target, color: "bg-secondary/10 text-secondary" },
    { label: "Best Score", value: `${bestScore}%`, icon: TrendingUp, color: "bg-accent/10 text-accent" },
    { label: "Current Rank", value: userRank ? `#${userRank}` : "—", icon: Trophy, color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" },
  ];

  const quickActions = [
    ...(profile?.role === "teacher"
      ? [{ title: "Create Quiz", icon: PlusCircle, url: "/create-quiz", color: "bg-primary/10 text-primary" }]
      : []),
    { title: "Join Quiz", icon: Users, url: "/join-quiz", color: "bg-secondary/10 text-secondary" },
    { title: "AI Practice", icon: Brain, url: "/create-quiz?ai=true", color: "bg-accent/10 text-accent" },
  ];

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-4 w-4 text-muted-foreground" />;
    if (rank === 3) return <Medal className="h-4 w-4 text-orange-500" />;
    return <span className="text-xs font-medium text-muted-foreground">#{rank}</span>;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h2 className="font-heading text-3xl font-bold tracking-tight">
            Welcome back, {profile?.name || "User"} 👋
          </h2>
          <p className="text-muted-foreground mt-1">
            {profile?.role === "teacher" ? "Manage quizzes and track student progress" : "Your performance at a glance"}
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label} className="rounded-2xl shadow-card">
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{s.label}</p>
                  <p className="font-heading text-2xl font-bold leading-tight">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Performance Chart */}
        {chartData.length > 1 && (
          <Card className="rounded-2xl shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-lg">Performance Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis domain={[0, 100]} className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "0.75rem",
                      border: "1px solid hsl(var(--border))",
                      backgroundColor: "hsl(var(--card))",
                      color: "hsl(var(--card-foreground))",
                    }}
                    formatter={(value: number) => [`${value}%`, "Score"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "hsl(var(--primary))" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Middle row: Recent Activity + Leaderboard */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <Card className="rounded-2xl shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" /> Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No quizzes attempted yet.</p>
              ) : (
                <div className="divide-y divide-border">
                  {recentActivity.map((a) => {
                    const pct = a.total_questions > 0 ? Math.round((a.score / a.total_questions) * 100) : 0;
                    return (
                      <div key={a.id} className="flex items-center justify-between py-3">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{a.quizzes?.title || "Quiz"}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(a.completed_at), "MMM d, yyyy")}</p>
                        </div>
                        <Badge variant={pct >= 70 ? "default" : pct >= 40 ? "secondary" : "destructive"} className="ml-2 shrink-0">
                          {pct}%
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Leaderboard Preview */}
          <Card className="rounded-2xl shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" /> Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No data yet.</p>
              ) : (
                <div className="divide-y divide-border">
                  {leaderboard.map((e) => (
                    <div key={e.rank} className={`flex items-center justify-between py-3 ${e.rank === 1 ? "bg-yellow-500/5 -mx-6 px-6 rounded-lg" : ""}`}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center">
                          {getRankIcon(e.rank)}
                        </div>
                        <span className="text-sm font-medium">{e.name}</span>
                      </div>
                      <span className="font-heading font-bold text-primary text-sm">{e.score}%</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom row: Weak Topics + Active Quizzes + Quick Actions */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Weak Topics */}
          <Card className="rounded-2xl shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" /> Weak Topics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weakTopics.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  {attempts.length === 0 ? "Take some quizzes first!" : "Great job — no weak topics! 🎉"}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {weakTopics.map((t) => (
                    <Badge key={t} variant="outline" className="rounded-lg border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Quizzes */}
          <Card className="rounded-2xl shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent" /> Active Quizzes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeQuizzes.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No active quizzes right now.</p>
              ) : (
                <div className="space-y-3">
                  {activeQuizzes.map((q) => (
                    <div
                      key={q.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => navigate(`/join-quiz`)}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{q.title}</p>
                        <p className="text-xs text-muted-foreground">Code: {q.quiz_code}</p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">{q.time_limit}m</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="rounded-2xl shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickActions.map((a) => (
                <div
                  key={a.title}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => navigate(a.url)}
                >
                  <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${a.color}`}>
                    <a.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">{a.title}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
