import { useState } from "react";

// FIXED: removed @ alias
import { useAuth } from "../contexts/AuthContext";
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
} from "../components/ui/card";

import { useToast } from "../hooks/use-toast";
import { useTheme } from "../contexts/ThemeContext";
import { Switch } from "../components/ui/switch";

import { User, Sun, Moon, Shield } from "lucide-react";

function ProfilePage() {
  const { profile, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const [name, setName] = useState(profile?.name || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);

    try {
      await apiClient.updateProfile(user.id, name);
      toast({ title: "Profile updated!" });
    } catch (err) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto mt-4 space-y-6">

        {/* Header */}
        <div>
          <h2 className="font-heading text-3xl font-bold tracking-tight">
            Profile
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage your account settings
          </p>
        </div>

        {/* Profile Card */}
        <Card className="rounded-2xl shadow-card animate-fade-in">
          <CardHeader className="text-center pb-2">

            <div className="mx-auto mb-2 inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-10 w-10" />
            </div>

            <CardTitle className="font-heading text-xl">
              {profile?.name || "User"}
            </CardTitle>

            <p className="text-sm text-muted-foreground capitalize flex items-center justify-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              {profile?.role}
            </p>

          </CardHeader>

          <CardContent className="space-y-4 pt-4">

            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl h-11"
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={profile?.email || ""}
                disabled
                className="rounded-xl h-11"
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-11 rounded-xl font-medium"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>

          </CardContent>
        </Card>

        {/* Theme Card */}
        <Card className="rounded-2xl shadow-card animate-fade-in">
          <CardHeader>
            <CardTitle className="font-heading text-lg">
              Appearance
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex items-center justify-between rounded-xl border p-4">

              <div className="flex items-center gap-3">

                {theme === "light" ? (
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Sun className="h-5 w-5" />
                  </div>
                ) : (
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Moon className="h-5 w-5" />
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium">Dark Mode</p>
                  <p className="text-xs text-muted-foreground">
                    {theme === "light"
                      ? "Currently using light theme"
                      : "Currently using dark theme"}
                  </p>
                </div>

              </div>

              <Switch
                checked={theme === "dark"}
                onCheckedChange={toggleTheme}
              />

            </div>
          </CardContent>
        </Card>

      </div>
    </AppLayout>
  );
}

export default ProfilePage;