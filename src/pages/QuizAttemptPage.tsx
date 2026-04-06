import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Clock, CheckCircle2 } from "lucide-react";

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  order_index: number;
}

export default function QuizAttemptPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!quizId) return;
      const { data: quizData } = await supabase.from("quizzes").select("*").eq("id", quizId).single();
      if (!quizData) { navigate("/join-quiz"); return; }
      setQuiz(quizData);
      setTimeLeft(quizData.time_limit * 60);

      const { data: qData } = await supabase
        .from("questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("order_index");
      if (qData) {
        setQuestions(qData.map((q) => ({ ...q, options: q.options as unknown as string[] })));
      }
      setLoading(false);
    };
    fetchQuiz();
  }, [quizId, navigate]);

  // Timer
  useEffect(() => {
    if (submitted || loading || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { handleSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted, loading]);

  const handleSubmit = useCallback(async () => {
    if (submitted || !user || !quizId) return;
    setSubmitted(true);

    let correct = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correct_answer) correct++;
    });
    setScore(correct);

    await supabase.from("attempts").insert({
      user_id: user.id,
      quiz_id: quizId,
      score: correct,
      total_questions: questions.length,
      answers: answers as any,
    });

    toast({ title: "Quiz submitted!", description: `You scored ${correct}/${questions.length}` });
  }, [submitted, user, quizId, questions, answers, toast]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  if (submitted) {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto mt-12 text-center animate-fade-in">
          <CheckCircle2 className="mx-auto h-16 w-16 text-primary mb-4" />
          <h2 className="font-heading text-3xl font-bold">Quiz Complete!</h2>
          <p className="text-muted-foreground mt-2 text-lg">
            You scored <span className="font-bold text-primary">{score}</span> out of <span className="font-bold">{questions.length}</span>
          </p>
          <p className="text-muted-foreground">
            Accuracy: {questions.length > 0 ? Math.round((score / questions.length) * 100) : 0}%
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            <Button onClick={() => navigate("/leaderboard")}>View Leaderboard</Button>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const currentQ = questions[currentIdx];

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-xl font-bold">{quiz?.title}</h2>
            <p className="text-sm text-muted-foreground">Question {currentIdx + 1} of {questions.length}</p>
          </div>
          <div className={`flex items-center gap-2 text-sm font-medium ${timeLeft < 60 ? "text-destructive" : "text-muted-foreground"}`}>
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </div>
        </div>

        <Progress value={((currentIdx + 1) / questions.length) * 100} className="h-2" />

        {currentQ && (
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="font-heading text-lg">{currentQ.question_text}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentQ.options.map((opt, oIdx) => (
                <button
                  key={oIdx}
                  onClick={() => setAnswers({ ...answers, [currentQ.id]: oIdx })}
                  className={`w-full text-left rounded-lg border p-4 transition-all ${
                    answers[currentQ.id] === oIdx
                      ? "border-primary bg-primary/10 font-medium"
                      : "border-border hover:border-primary/50 hover:bg-muted"
                  }`}
                >
                  <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs font-medium">
                    {String.fromCharCode(65 + oIdx)}
                  </span>
                  {opt}
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0}>
            Previous
          </Button>
          {currentIdx < questions.length - 1 ? (
            <Button onClick={() => setCurrentIdx(currentIdx + 1)}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit}>Submit Quiz</Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
