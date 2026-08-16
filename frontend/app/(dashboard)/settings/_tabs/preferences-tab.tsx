"use client";

import * as React from "react";
import { Save } from "lucide-react";
import { useLocale } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";
import { PushSettingsCard } from "@/components/notifications/push-settings-card";
import { useLanguagesStore } from "@/lib/stores/languages-store";
import { useTheme } from "@/components/providers/theme-provider";

export function PreferencesTab() {
  const { selectedLanguage, setSelectedLanguage, availableLanguages } =
    useLanguagesStore();
  const { theme, setTheme } = useTheme();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [preferences, setPreferences] = React.useState({
    language: selectedLanguage,
    theme: theme || "system",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
  });

  React.useEffect(() => {
    // Load preferences from localStorage
    const saved = localStorage.getItem("userPreferences");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPreferences((prev) => ({ ...prev, ...parsed }));
      } catch {
        // Use defaults
      }
    }
  }, []);

  React.useEffect(() => {
    setPreferences((prev) => ({ ...prev, language: selectedLanguage }));
  }, [selectedLanguage]);

  const currentLanguage = availableLanguages.find(
    (lang) => lang.code === preferences.language,
  );

  const handlePreferenceChange = React.useCallback(
    (field: string, value: string | boolean) => {
      setPreferences((prev) => ({ ...prev, [field]: value }));
      if (field === "language") {
        setSelectedLanguage(value as string);
      }
      if (field === "theme") {
        setTheme(value as "light" | "dark" | "system");
      }
    },
    [setSelectedLanguage, setTheme],
  );

  const handleSubmit = React.useCallback(async () => {
    setIsSubmitting(true);
    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      localStorage.setItem("userPreferences", JSON.stringify(preferences));
      toast.success("Preferences saved successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save preferences");
    } finally {
      setIsSubmitting(false);
    }
  }, [preferences]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Language & Region</CardTitle>
          <CardDescription>
            Configure your language and regional settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="language">Language</Label>
            <Select
              value={preferences.language}
              onValueChange={(value) =>
                handlePreferenceChange("language", value)
              }
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {availableLanguages.map((language) => (
                  <SelectItem key={language.code} value={language.code}>
                    <div className="flex items-center gap-2">
                      <span>{language.nativeName}</span>
                      <span className="text-muted-foreground text-xs">
                        ({language.name})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="dateFormat">Date Format</Label>
            <Select
              value={preferences.dateFormat}
              onValueChange={(value) =>
                handlePreferenceChange("dateFormat", value)
              }
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="timeFormat">Time Format</Label>
            <Select
              value={preferences.timeFormat}
              onValueChange={(value) =>
                handlePreferenceChange("timeFormat", value)
              }
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12h">12-hour</SelectItem>
                <SelectItem value="24h">24-hour</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize the look and feel of the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="theme">Theme</Label>
            <div className="flex items-center gap-4">
              <Select
                value={preferences.theme}
                onValueChange={(value) =>
                  handlePreferenceChange("theme", value)
                }
                disabled={isSubmitting}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
              <ThemeToggle />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Browser notifications are real state — permission granted, subscription
          stored server-side — so they get their own component rather than a
          switch saved to localStorage alongside the display preferences. */}
      <PushSettingsCard />

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner className="mr-2 size-4" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 size-4" />
              Save Preferences
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
