"use client";

import { PageHeader } from "@/components/dashboard/page-header";
import axios from "axios";
import { axiosInstance } from "@/lib/axios";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Clock, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Service = {
  id: string;
  name: string;
  description: string;
  timeToTake: string;
  office: { id: string; name: string };
};

type ServiceListResponse = {
  data: Service[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export default function ApplyServicePage() {
  const router = useRouter();
  const [services, setServices] = React.useState<Service[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    const controller = new AbortController();

    const loadServices = async () => {
      try {
        const response = await axiosInstance.get<ServiceListResponse>(
          "/services",
          {
            params: { page: 1, pageSize: 100 },
            signal: controller.signal,
          },
        );

        setServices(response.data?.data ?? []);
      } catch (error) {
        if (axios.isCancel(error)) {
          return;
        }

        console.error("Failed to fetch services", error);
        toast.error("Failed to load services.");
      } finally {
        setIsLoading(false);
      }
    };

    loadServices();

    return () => controller.abort();
  }, []);

  const filtered = services.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.description.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Apply Service"
        description="Browse available services and submit your application"
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search services..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          No services found.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((service) => (
            <Card
              key={service.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-5 space-y-3">
                <div className="space-y-1">
                  <h3 className="font-semibold text-base">{service.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {service.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {service.office.name}
                  </Badge>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    {service.timeToTake}
                  </span>
                </div>
                <Button
                  size="sm"
                  className="w-full gap-1"
                  onClick={() =>
                    router.push(`/requests?serviceId=${service.id}`)
                  }
                >
                  Apply Now <ArrowRight className="size-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
