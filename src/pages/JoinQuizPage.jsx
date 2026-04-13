import { useState } from "react";
import { useNavigate } from "react-router-dom";

// FIXED: removed @ alias
import { apiClient } from "../integrations/api/client";
import { AppLayout } from "../components/AppLayout";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";

import { useToast } from "../hooks/use-toast";
import { Users } from "lucide-react";

function JoinQuizPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleJoin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await apiClient.getQuizByCode(code.trim());

      if (!data || !data.quiz) {
        toast({
          title: "Quiz not found",
          description: "Check the code and try again.",
          variant: "destructive",
        });
        return;
      }

      navigate(`/quiz/${data.quiz.id}`);
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-md mx-auto mt-12">
        <Card className="rounded-2xl shadow-card animate-fade-in">
          
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-3 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
              <Users className="h-8 w-8" />
            </div>

            <CardTitle className="font-heading text-2xl">
              Join a Quiz
            </CardTitle>

            <CardDescription>
              Enter the quiz code shared by your teacher
            </CardDescription>
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
                  className="text-center text-lg tracking-widest font-heading rounded-xl h-12"
                  maxLength={10}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 rounded-xl font-medium"
                disabled={loading || !code.trim()}
              >
                {loading ? "Joining..." : "Join Quiz"}
              </Button>

            </form>
          </CardContent>

        </Card>
      </div>
    </AppLayout>
  );
}

export default JoinQuizPage;