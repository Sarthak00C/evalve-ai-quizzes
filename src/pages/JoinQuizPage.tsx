import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Users } from "lucide-react";

export default function JoinQuizPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("quizzes")
        .select("id")
        .eq("quiz_code", code.trim().toLowerCase())
        .eq("is_active", true)
        .single();

      if (error || !data) {
        toast({ title: "Quiz not found", description: "Check the code and try again.", variant: "destructive" });
        return;
      }
      navigate(`/quiz/${data.id}`);
    } catch {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-md mx-auto mt-12">
        <Card className="animate-fade-in">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Users className="h-7 w-7" />
            </div>
            <CardTitle className="font-heading text-2xl">Join a Quiz</CardTitle>
            <CardDescription>Enter the quiz code shared by your teacher</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="space-y-2">
                <Label>Quiz Code</Label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  placeholder="e.g. abc123"
                  className="text-center text-lg tracking-widest font-heading"
                  maxLength={10}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || !code.trim()}>
                {loading ? "Joining..." : "Join Quiz"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
