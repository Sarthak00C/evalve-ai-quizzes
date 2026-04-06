import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, Search } from "lucide-react";

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

    const userIds = [...new Set(attempts.map((a) => a.user_id))];
    const { data: profiles } = await supabase.from("profiles").select("id, name").in("id", userIds);
    const profileMap = new Map(profiles?.map((p) => [p.id, p.name]) ?? []);

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

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-500/20"><Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-400" /></div>;
    if (rank === 2) return <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted"><Medal className="h-4 w-4 text-muted-foreground" /></div>;
    if (rank === 3) return <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-500/20"><Medal className="h-4 w-4 text-orange-600 dark:text-orange-400" /></div>;
    return <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-sm font-medium text-muted-foreground">#{rank}</div>;
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="font-heading text-3xl font-bold tracking-tight">Leaderboard</h2>
          <p className="text-muted-foreground mt-1">Enter a quiz code to see rankings</p>
        </div>

        <div className="flex gap-3">
          <Input
            value={quizCode}
            onChange={(e) => setQuizCode(e.target.value)}
            placeholder="Enter quiz code..."
            className="tracking-widest font-heading rounded-xl h-11"
            onKeyDown={(e) => e.key === "Enter" && fetchLeaderboard(quizCode)}
          />
          <Button onClick={() => fetchLeaderboard(quizCode)} className="rounded-xl h-11 px-6" disabled={!quizCode.trim()}>
            <Search className="h-4 w-4 mr-2" /> Search
          </Button>
        </div>

        {quizTitle && (
          <h3 className="font-heading text-xl font-semibold">{quizTitle}</h3>
        )}

        {entries.length > 0 && (
          <Card className="rounded-2xl shadow-card overflow-hidden">
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {entries.map((entry) => (
                  <div key={entry.rank} className={`flex items-center justify-between p-4 transition-colors ${entry.rank <= 3 ? "bg-muted/30" : ""}`}>
                    <div className="flex items-center gap-4">
                      {getRankDisplay(entry.rank)}
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
          <Card className="rounded-2xl shadow-card">
            <CardContent className="py-12 text-center text-muted-foreground">
              No attempts yet for this quiz.
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
