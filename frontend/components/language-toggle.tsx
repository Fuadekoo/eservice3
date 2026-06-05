"use client";

import * as React from "react";
import { useLocale } from "next-intl";

import { useLanguagesStore } from "@/lib/stores/languages-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export function LanguageToggle() {
  const { selectedLanguage, setSelectedLanguage, availableLanguages } =
    useLanguagesStore();

  const currentLanguage = availableLanguages.find(
    (lang) => lang.code === selectedLanguage,
  );

  const handleLanguageChange = React.useCallback(
    (languageCode: string) => {
      setSelectedLanguage(languageCode);
    },
    [setSelectedLanguage],
  );

  return (
    <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
      <SelectTrigger size="sm" className="w-fit min-w-[120px] rounded-full">
        <SelectValue
          placeholder={
            currentLanguage?.nativeName ||
            currentLanguage?.name ||
            selectedLanguage
          }
        />
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
  );
}
