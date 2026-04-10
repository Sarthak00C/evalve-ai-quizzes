const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem("auth_token");
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem("auth_token", token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem("auth_token");
  }

  private async request(path: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(body.error || `Request failed: ${res.status}`);
    }

    return res.json();
  }

  // Auth
  async signup(email: string, password: string, name: string, role: string) {
    const data = await this.request("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, name, role }),
    });
    if (data.token) this.setToken(data.token);
    return data;
  }

  async signin(email: string, password: string) {
    const data = await this.request("/auth/signin", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (data.token) this.setToken(data.token);
    return data;
  }

  async getMe() {
    return this.request("/auth/me");
  }

  // Quizzes
  async createQuiz(title: string, topic: string, difficulty: string, timeLimit: number) {
    return this.request("/quizzes", {
      method: "POST",
      body: JSON.stringify({ title, topic, difficulty, timeLimit }),
    });
  }

  async getQuiz(id: string) {
    return this.request(`/quizzes/${id}`);
  }

  async getQuizByCode(code: string) {
    return this.request(`/quizzes/code/${code}`);
  }

  async getMyQuizzes() {
    return this.request("/quizzes/my-quizzes");
  }

  // Questions
  async addQuestions(quizId: string, questions: any[]) {
    return this.request("/questions", {
      method: "POST",
      body: JSON.stringify({ quizId, questions }),
    });
  }

  // Attempts
  async submitAttempt(quizId: string, answers: any[]) {
    return this.request("/attempts", {
      method: "POST",
      body: JSON.stringify({ quizId, answers }),
    });
  }

  async getMyAttempts() {
    return this.request("/attempts");
  }

  async getLeaderboard(quizCode: string) {
    return this.request(`/attempts/quiz/${quizCode}/leaderboard`);
  }

  // Profiles
  async updateProfile(id: string, name: string) {
    return this.request(`/profiles/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name }),
    });
  }

  async getProfile(id: string) {
    return this.request(`/profiles/${id}`);
  }

  async getBatchProfiles(ids: string[]) {
    return this.request("/profiles/batch", {
      method: "POST",
      body: JSON.stringify({ ids }),
    });
  }

  // AI
  async generateQuiz(prompt: string, topic: string, difficulty: string, count: number) {
    return this.request("/ai/generate-quiz", {
      method: "POST",
      body: JSON.stringify({ prompt, topic, difficulty, count }),
    });
  }
}

export const apiClient = new ApiClient();
