"use client";

import { PageHeader } from "@/components/dashboard/page-header";
import axios from "axios";
import { axiosInstance } from "@/lib/axios";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Appointment = {
  id: string;
  date: string;
  time?: string;
  status: string;
  notes?: string;
  request?: {
    service?: { name: string; office?: { name: string } };
  };
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> =
  {
    approved: "default",
    completed: "default",
    pending: "secondary",
    rejected: "destructive",
  };

export default function AppointmentsPage() {
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const controller = new AbortController();

    const loadAppointments = async () => {
      try {
        const response = await axiosInstance.get<{
          success: boolean;
          data: Appointment[];
        }>("/appointments", {
          signal: controller.signal,
        });

        setAppointments(response.data?.data ?? []);
      } catch (error) {
        if (axios.isCancel(error)) {
          return;
        }

        console.error("Failed to load appointments", error);
        toast.error("Unable to fetch appointments.");
      } finally {
        setIsLoading(false);
      }
    };

    loadAppointments();

    return () => controller.abort();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments"
        description="View and manage your scheduled appointments"
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          No appointments yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {appointments.map((appt) => (
            <Card key={appt.id}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm">
                    {appt.request?.service?.name ?? "Appointment"}
                  </h3>
                  <Badge
                    variant={STATUS_VARIANT[appt.status] ?? "secondary"}
                    className="capitalize text-xs shrink-0"
                  >
                    {appt.status}
                  </Badge>
                </div>
                {appt.request?.service?.office?.name && (
                  <p className="text-xs text-muted-foreground">
                    {appt.request.service.office.name}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3" />
                    {new Date(appt.date).toLocaleDateString()}
                  </span>
                  {appt.time && (
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {appt.time}
                    </span>
                  )}
                </div>
                {appt.notes && (
                  <p className="text-xs text-muted-foreground border-t pt-2">
                    {appt.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
