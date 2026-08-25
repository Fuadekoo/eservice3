"use client";

import Image from "next/image";
import { Edit, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import type { AboutSection } from "@/lib/stores/about-store";
import { getUploadUrl } from "@/lib/axios";
import { useTranslation } from "@/lib/i18n";

interface AboutSectionCardProps {
  section: AboutSection;
  onEdit: (section: AboutSection) => void;
  onDelete: (id: string) => void;
}

export function AboutSectionCard({
  section,
  onEdit,
  onDelete,
}: AboutSectionCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="overflow-hidden bg-card border border-border rounded-2xl group hover:shadow-lg transition-all duration-300">
      <CardContent className="p-5 flex flex-col gap-4">
        <div className="overflow-hidden rounded-xl bg-muted aspect-[16/9] relative">
          <Image
            src={getUploadUrl(section.image) || "/placeholder.png"}
            alt={section.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>

        <div className="space-y-1.5 flex-1">
          <h3 className="font-bold text-foreground text-lg leading-tight truncate">
            {section.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {section.description || t("No description provided for this section.")}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border mt-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onEdit(section)}
            className="rounded-xl font-semibold"
          >
            <Edit className="size-4 mr-2" />
            {t("Edit")}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(section.id)}
            className="rounded-xl font-semibold shadow-sm"
          >
            <Trash2 className="size-4 mr-2" />
            {t("Delete")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
