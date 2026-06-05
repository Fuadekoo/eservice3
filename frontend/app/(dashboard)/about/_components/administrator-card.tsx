"use client";

import Image from "next/image";
import { Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import type { Administration } from "@/lib/stores/administration-store";

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
  return (
    <Card className="overflow-hidden bg-[#121212] border-none">
      <CardContent className="p-4 flex flex-col gap-4">
        <div className="overflow-hidden rounded-xl bg-[#1e1e1e]">
          <AspectRatio ratio={1 / 1.1}>
            <Image
              src={
                administrator.image
                  ? administrator.image.startsWith("http")
                    ? administrator.image
                    : `/api/uploads/${administrator.image}`
                  : "/placeholder.png"
              }
              alt={administrator.name}
              fill
              className="object-cover"
            />
          </AspectRatio>
        </div>

        <div className="space-y-1">
          <h3 className="font-semibold text-white text-base">
            {administrator.name}
          </h3>
          <p className="text-sm text-gray-400 line-clamp-2">
            {administrator.description || "No description"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(administrator)}
            className="bg-transparent border-gray-800 text-white hover:bg-gray-800 hover:text-white"
          >
            <Edit className="size-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(administrator.id)}
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
