"use client";

import Image from "next/image";
import { Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import type { Administration } from "@/lib/stores/administration-store";
import { getUploadUrl } from "@/lib/axios";
import { useTranslation } from "@/lib/i18n";

interface AdministratorCardProps {
  administrator: Administration;
  onEdit: (administrator: Administration) => void;
  onDelete: (id: string) => void;
}

export function AdministratorCard({
  administrator,
  onEdit,
  onDelete,
}: AdministratorCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="overflow-hidden bg-card border border-border rounded-2xl group hover:shadow-lg transition-all duration-300">
      <CardContent className="p-5 flex flex-col gap-4">
        <div className="overflow-hidden rounded-xl bg-muted aspect-[1/1.1] relative">
          <Image
            src={getUploadUrl(administrator.image) || "/placeholder.png"}
            alt={administrator.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>

        <div className="space-y-1.5 flex-1">
          <h3 className="font-bold text-foreground text-lg leading-tight truncate">
            {administrator.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {administrator.description || t("No description provided.")}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border mt-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onEdit(administrator)}
            className="rounded-xl font-semibold"
          >
            <Edit className="size-4 mr-2" />
            {t("Edit")}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(administrator.id)}
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
