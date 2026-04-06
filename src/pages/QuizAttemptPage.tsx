import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Clock, CheckCircle2, ArrowLeft, ArrowRight } from "lucide-react";

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
    const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto mt-12 text-center animate-fade-in">
          <div className="mx-auto mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <h2 className="font-heading text-3xl font-bold">Quiz Complete!</h2>
          <p className="text-muted-foreground mt-3 text-lg">
            You scored <span className="font-bold text-primary">{score}</span> out of <span className="font-bold">{questions.length}</span>
          </p>
          <div className="mt-4 mx-auto max-w-xs">
            <div className="flex justify-between text-sm text-muted-foreground mb-1.5">
              <span>Accuracy</span>
              <span className="font-medium">{pct}%</span>
            </div>
            <Progress value={pct} className="h-3 rounded-full" />
          </div>
          <div className="mt-8 flex gap-3 justify-center">
            <Button onClick={() => navigate("/leaderboard")} className="rounded-xl">View Leaderboard</Button>
            <Button variant="outline" onClick={() => navigate("/dashboard")} className="rounded-xl">Dashboard</Button>
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
          <div className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium ${
            timeLeft < 60 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
          }`}>
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </div>
        </div>

        <Progress value={((currentIdx + 1) / questions.length) * 100} className="h-2 rounded-full" />

        {currentQ && (
          <Card className="rounded-2xl shadow-card animate-fade-in">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-lg leading-relaxed">{currentQ.question_text}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentQ.options.map((opt, oIdx) => (
                <button
                  key={oIdx}
                  onClick={() => setAnswers({ ...answers, [currentQ.id]: oIdx })}
                  className={`w-full text-left rounded-xl border-2 p-4 transition-all duration-200 ${
                    answers[currentQ.id] === oIdx
                      ? "border-primary bg-primary/5 shadow-soft"
                      : "border-border hover:border-primary/30 hover:bg-muted/50"
                  }`}
                >
                  <span className={`mr-3 inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold ${
                    answers[currentQ.id] === oIdx
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {String.fromCharCode(65 + oIdx)}
                  </span>
                  {opt}
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0} className="rounded-xl gap-2">
            <ArrowLeft className="h-4 w-4" /> Previous
          </Button>
          {currentIdx < questions.length - 1 ? (
            <Button onClick={() => setCurrentIdx(currentIdx + 1)} className="rounded-xl gap-2">
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="rounded-xl">Submit Quiz</Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
