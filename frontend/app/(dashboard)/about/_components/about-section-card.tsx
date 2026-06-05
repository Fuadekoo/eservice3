"use client";

import Image from "next/image";
import { Edit, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import type { AboutSection } from "../_stores/about-store";

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
  return (
    <Card className="overflow-hidden bg-[#121212] border-none">
      <CardContent className="p-4 flex flex-col gap-4">
        <div className="overflow-hidden rounded-xl bg-[#1e1e1e]">
          <AspectRatio ratio={16 / 9}>
            <Image
              src={
                section.image
                  ? section.image.startsWith("http")
                    ? section.image
                    : `/api/uploads/${section.image}`
                  : "/placeholder.png"
              }
              alt={section.name}
              fill
              className="object-cover"
            />
          </AspectRatio>
        </div>

        <div className="space-y-1">
          <h3 className="font-semibold text-white text-base">{section.name}</h3>
          <p className="text-sm text-gray-400 line-clamp-3">
            {section.description || "No description"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(section)}
            className="bg-transparent border-gray-800 text-white hover:bg-gray-800 hover:text-white"
          >
            <Edit className="size-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(section.id)}
            className="bg-[#f05252] hover:bg-[#d94444]"
          >
            <Trash2 className="size-4 mr-2" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
