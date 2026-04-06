import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trophy, Medal } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  total: number;
}

export default function LeaderboardPage() {
  const [quizCode, setQuizCode] = useState("");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [quizTitle, setQuizTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchLeaderboard = async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    const { data: quiz } = await supabase.from("quizzes").select("id, title").eq("quiz_code", code.trim().toLowerCase()).single();
    if (!quiz) { setEntries([]); setQuizTitle(""); setLoading(false); return; }
    setQuizTitle(quiz.title);

    const { data: attempts } = await supabase
      .from("attempts")
      .select("score, total_questions, user_id")
      .eq("quiz_id", quiz.id)
      .order("score", { ascending: false });

    if (!attempts) { setEntries([]); setLoading(false); return; }

    // Fetch profiles for users
    const userIds = [...new Set(attempts.map((a) => a.user_id))];
    const { data: profiles } = await supabase.from("profiles").select("id, name").in("id", userIds);
    const profileMap = new Map(profiles?.map((p) => [p.id, p.name]) ?? []);

    // Best score per user
    const bestScores = new Map<string, { score: number; total: number }>();
    attempts.forEach((a) => {
      const existing = bestScores.get(a.user_id);
      if (!existing || a.score > existing.score) {
        bestScores.set(a.user_id, { score: a.score, total: a.total_questions });
      }
    });

    const sorted = Array.from(bestScores.entries())
      .sort((a, b) => b[1].score - a[1].score)
      .map(([userId, { score, total }], idx) => ({
        rank: idx + 1,
        name: profileMap.get(userId) || "Unknown",
        score,
        total,
      }));

    setEntries(sorted);
    setLoading(false);
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />;
    return <span className="text-sm font-medium text-muted-foreground">#{rank}</span>;
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="font-heading text-3xl font-bold tracking-tight">Leaderboard</h2>
          <p className="text-muted-foreground mt-1">Enter a quiz code to see rankings</p>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 space-y-2">
            <Input
              value={quizCode}
              onChange={(e) => setQuizCode(e.target.value)}
              placeholder="Enter quiz code..."
              className="tracking-widest font-heading"
              onKeyDown={(e) => e.key === "Enter" && fetchLeaderboard(quizCode)}
            />
          </div>
        </div>

        {quizTitle && (
          <h3 className="font-heading text-xl font-semibold">{quizTitle}</h3>
        )}

        {entries.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {entries.map((entry) => (
                  <div key={entry.rank} className={`flex items-center justify-between p-4 ${entry.rank <= 3 ? "bg-accent/30" : ""}`}>
                    <div className="flex items-center gap-4">
                      <div className="flex h-8 w-8 items-center justify-center">{getRankIcon(entry.rank)}</div>
                      <span className="font-medium">{entry.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-heading font-bold text-primary">{entry.score}</span>
                      <span className="text-muted-foreground">/{entry.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && entries.length === 0 && quizTitle && (
          <p className="text-center text-muted-foreground py-8">No attempts yet for this quiz.</p>
        )}
      </div>
    </AppLayout>
  );
}
