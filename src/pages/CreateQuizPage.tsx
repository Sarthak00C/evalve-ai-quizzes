import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/integrations/api/client";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Plus, Trash2 } from "lucide-react";

interface QuestionForm {
  question_text: string;
  options: string[];
  correct_answer: number;
}

export default function CreateQuizPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const isAI = searchParams.get("ai") === "true";

  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [timeLimit, setTimeLimit] = useState(30);
  const [questions, setQuestions] = useState<QuestionForm[]>([
    { question_text: "", options: ["", "", "", ""], correct_answer: 0 },
  ]);
  const [loading, setLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const addQuestion = () => {
    setQuestions([...questions, { question_text: "", options: ["", "", "", ""], correct_answer: 0 }]);
  };

  const removeQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, field: string, value: any) => {
    const updated = [...questions];
    (updated[idx] as any)[field] = value;
    setQuestions(updated);
  };

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    const updated = [...questions];
    updated[qIdx].options[oIdx] = value;
    setQuestions(updated);
  };

  const generateWithAI = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const data = await apiClient.generateQuiz(aiPrompt, topic, difficulty, 5);
      if (data?.questions) {
        const mapped = data.questions.map((q: any) => ({
          question_text: q.question,
          options: q.options,
          correct_answer: q.correctAnswer ?? 0,
        }));
        setQuestions(mapped);
        if (data.title) setTitle(data.title);
        if (data.topic) setTopic(data.topic);
        toast({ title: "AI generated questions!", description: `${mapped.length} questions created.` });
      }
    } catch (err: any) {
      toast({ title: "AI generation failed", description: err.message, variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const quizResponse = await apiClient.createQuiz(title, topic, difficulty, timeLimit);
      const quizId = quizResponse.quiz.id;

      const questionsToInsert = questions.map((q) => ({
        questionText: q.question_text,
        options: q.options,
        correctAnswer: q.correct_answer,
      }));

      await apiClient.addQuestions(quizId, questionsToInsert);

      toast({
        title: "Quiz created!",
        description: `Quiz code: ${quizResponse.quiz.quizCode}. Share it with your students!`,
      });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Error creating quiz", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="font-heading text-3xl font-bold tracking-tight">Create Quiz</h2>
          <p className="text-muted-foreground mt-1">Build a quiz manually or generate with AI</p>
        </div>

        {/* AI Section */}
        <Card className="border-primary/20 bg-primary/5 rounded-2xl shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Quiz Generator
            </CardTitle>
            <CardDescription>Describe a topic and let AI create questions for you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="e.g. Generate 5 multiple choice questions about World War II for high school students..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={3}
            />
            <Button onClick={generateWithAI} disabled={aiLoading || !aiPrompt.trim()}>
              {aiLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</> : <><Sparkles className="mr-2 h-4 w-4" />Generate Questions</>}
            </Button>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="rounded-2xl shadow-card">
            <CardHeader>
              <CardTitle className="font-heading">Quiz Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Quiz title" />
                </div>
                <div className="space-y-2">
                  <Label>Topic</Label>
                  <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Mathematics" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Time Limit (minutes)</Label>
                  <Input type="number" min={1} max={180} value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))} />
                </div>
              </div>
            </CardContent>
          </Card>

          {questions.map((q, qIdx) => (
            <Card key={qIdx}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-heading text-base">Question {qIdx + 1}</CardTitle>
                {questions.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeQuestion(qIdx)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Question</Label>
                  <Textarea
                    value={q.question_text}
                    onChange={(e) => updateQuestion(qIdx, "question_text", e.target.value)}
                    required
                    placeholder="Enter your question..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Options</Label>
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${qIdx}`}
                        checked={q.correct_answer === oIdx}
                        onChange={() => updateQuestion(qIdx, "correct_answer", oIdx)}
                        className="accent-primary"
                      />
                      <Input
                        value={opt}
                        onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                        required
                        placeholder={`Option ${oIdx + 1}`}
                      />
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">Select the radio button next to the correct answer</p>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={addQuestion}>
              <Plus className="mr-2 h-4 w-4" /> Add Question
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Create Quiz"}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
