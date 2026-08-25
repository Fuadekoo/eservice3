"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/lib/i18n";

export function ThemeToggle() {
  const { t } = useTranslation();

  const { setTheme, theme } = useTheme();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const items: Array<{ label: string; value: "light" | "dark" | "system" }> = [
    { label: t("Light"), value: "light" },
    { label: t("Dark"), value: "dark" },
    { label: t("System"), value: "system" },
  ];

  const renderIcon = () => {
    if (!isMounted) {
      return <Sun className="size-4" />;
    }

    if (theme === "dark") {
      return <Moon className="size-4" />;
    }

    return <Sun className="size-4" />;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          aria-label={t("Toggle theme")}
        >
          {renderIcon()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {items.map((item) => (
          <DropdownMenuItem
            key={item.value}
            onClick={() => setTheme(item.value)}
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
