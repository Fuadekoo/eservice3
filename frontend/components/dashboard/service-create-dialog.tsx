"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Plus,
  Trash2,
  Users,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useServiceStore, type Service } from "@/lib/stores/service-store";
import { useTranslation } from "@/lib/i18n";

const serviceSchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  timeToTake: z.string().min(1, "Estimated time is required"),
  officeId: z.string().optional(),
  requirements: z
    .array(
      z.object({
        name: z.string().min(1, "Requirement name is required"),
        description: z.string().optional(),
      }),
    )
    .optional(),
  serviceFors: z
    .array(
      z.object({
        name: z.string().min(1, "Target group name is required"),
        description: z.string().optional(),
      }),
    )
    .optional(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

interface ServiceCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: Service | null;
  defaultOfficeId?: string;
  isAdmin?: boolean;
}

export function ServiceCreateDialog({
  open,
  onOpenChange,
  service,
  defaultOfficeId,
  isAdmin,
}: ServiceCreateDialogProps) {
  const { t } = useTranslation();
  const { createService, updateService } = useServiceStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      description: "",
      timeToTake: "",
      officeId: defaultOfficeId || "",
      requirements: [],
      serviceFors: [],
    },
  });

  const {
    fields: requirementFields,
    append: appendRequirement,
    remove: removeRequirement,
  } = useFieldArray({
    control: form.control,
    name: "requirements",
  });

  const {
    fields: serviceForFields,
    append: appendServiceFor,
    remove: removeServiceFor,
  } = useFieldArray({
    control: form.control,
    name: "serviceFors",
  });

  React.useEffect(() => {
    if (service) {
      form.reset({
        name: service.name,
        description: service.description,
        timeToTake: service.timeToTake,
        officeId: service.officeId,
        requirements: service.requirements.map((r) => ({
          name: r.name,
          description: r.description || "",
        })),
        serviceFors: service.serviceFors.map((sf) => ({
          name: sf.name,
          description: sf.description || "",
        })),
      });
    } else {
      form.reset({
        name: "",
        description: "",
        timeToTake: "",
        officeId: defaultOfficeId || "",
        requirements: [],
        serviceFors: [],
      });
    }
  }, [service, defaultOfficeId, form]);

  const onSubmit = async (values: ServiceFormValues) => {
    setIsSubmitting(true);
    try {
      if (service) {
        await updateService(service.id, values);
        toast.success(t("Service updated successfully"));
      } else {
        await createService(values);
        toast.success(t("Service created successfully"));
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.message || t("Something went wrong"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full! max-w-none! gap-0 overflow-hidden bg-background p-0 text-foreground sm:w-[92vw]! sm:rounded-l-2xl lg:w-152!"
      >
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex h-full min-h-0 flex-col"
          >
            {/* ── Header ── */}
            <div className="shrink-0 border-b border-border/60 bg-muted/30 px-5 py-4 pr-14 sm:px-6 sm:py-5">
              <SheetHeader className="gap-1 p-0">
                <SheetTitle className="flex items-center gap-2.5 text-lg font-bold sm:text-xl">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="size-4" />
                  </span>
                  {service ? t("Edit Service") : t("Create New Service")}
                </SheetTitle>
                <SheetDescription className="pl-10.5">
                  {service
                    ? t("Update the service details below.")
                    : t(
                        "Fill in the details to add a new service to this office.",
                      )}
                </SheetDescription>
              </SheetHeader>
            </div>

            {/* ── Scrollable body ── */}
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Service Name")}</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-11 rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Description")}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        className="min-h-24 resize-none rounded-xl"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timeToTake"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <Clock className="size-3.5 text-primary" />
                      {t("Estimated Time to Complete")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("e.g. 2 hours, 1 day")}
                        className="h-11 rounded-xl"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* ── Requirements ── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <FormLabel className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-primary" />
                    {t("Requirements")}
                    {requirementFields.length > 0 && (
                      <span className="text-xs font-normal text-muted-foreground">
                        ({requirementFields.length})
                      </span>
                    )}
                  </FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      appendRequirement({ name: "", description: "" })
                    }
                    className="h-8 shrink-0 rounded-lg text-xs font-semibold"
                  >
                    <Plus className="mr-1 size-3" /> {t("Add")}
                  </Button>
                </div>

                {requirementFields.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border px-3 py-3 text-xs text-muted-foreground">
                    {t(
                      "No requirements yet. Add the documents applicants must bring.",
                    )}
                  </p>
                ) : (
                  requirementFields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-2">
                      {/* FormItem + FormMessage so per-row validation is visible */}
                      <FormField
                        control={form.control}
                        name={`requirements.${index}.name`}
                        render={({ field: rowField }) => (
                          <FormItem className="min-w-0 flex-1">
                            <FormControl>
                              <Input
                                {...rowField}
                                placeholder={t("Requirement name")}
                                className="h-10 rounded-xl text-sm"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRequirement(index)}
                        className="size-10 shrink-0 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                        <span className="sr-only">{t("Remove")}</span>
                      </Button>
                    </div>
                  ))
                )}
              </div>

              <Separator />

              {/* ── Target groups ── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <FormLabel className="flex items-center gap-1.5">
                    <Users className="size-3.5 text-primary" />
                    {t("Service For (Target Groups)")}
                    {serviceForFields.length > 0 && (
                      <span className="text-xs font-normal text-muted-foreground">
                        ({serviceForFields.length})
                      </span>
                    )}
                  </FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      appendServiceFor({ name: "", description: "" })
                    }
                    className="h-8 shrink-0 rounded-lg text-xs font-semibold"
                  >
                    <Plus className="mr-1 size-3" /> {t("Add")}
                  </Button>
                </div>

                {serviceForFields.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border px-3 py-3 text-xs text-muted-foreground">
                    {t("No target groups yet. Add who this service is for.")}
                  </p>
                ) : (
                  serviceForFields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-2">
                      <FormField
                        control={form.control}
                        name={`serviceFors.${index}.name`}
                        render={({ field: rowField }) => (
                          <FormItem className="min-w-0 flex-1">
                            <FormControl>
                              <Input
                                {...rowField}
                                placeholder={t("Target group")}
                                className="h-10 rounded-xl text-sm"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeServiceFor(index)}
                        className="size-10 shrink-0 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                        <span className="sr-only">{t("Remove")}</span>
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ── Sticky footer ── */}
            <div className="shrink-0 border-t border-border/60 bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-4">
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                  className="h-11 flex-1 rounded-xl font-semibold"
                >
                  {t("Cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-11 flex-[2] rounded-xl font-bold"
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  {service ? t("Update Service") : t("Create Service")}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
