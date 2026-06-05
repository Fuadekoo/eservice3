"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  requirements: z.array(z.object({
    name: z.string().min(1, "Requirement name is required"),
    description: z.string().optional(),
  })).optional(),
  serviceFors: z.array(z.object({
    name: z.string().min(1, "Target group name is required"),
    description: z.string().optional(),
  })).optional(),
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

  const { fields: requirementFields, append: appendRequirement, remove: removeRequirement } = useFieldArray({
    control: form.control,
    name: "requirements",
  });

  const { fields: serviceForFields, append: appendServiceFor, remove: removeServiceFor } = useFieldArray({
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
        requirements: service.requirements.map(r => ({ name: r.name, description: r.description || "" })),
        serviceFors: service.serviceFors.map(sf => ({ name: sf.name, description: sf.description || "" })),
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
        toast.success("Service updated successfully");
      } else {
        await createService(values);
        toast.success("Service created successfully");
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-[#121212] text-white border-gray-800">
        <DialogHeader>
          <DialogTitle>{service ? "Edit Service" : "Create New Service"}</DialogTitle>
          <DialogDescription className="text-gray-400">
            {service ? "Update the service details below." : "Fill in the details to add a new service to this office."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Name</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-[#1e1e1e] border-gray-800 text-white" />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="bg-[#1e1e1e] border-gray-800 text-white min-h-[100px]" />
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
                  <FormLabel>Estimated Time to Complete</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. 2 hours, 1 day" className="bg-[#1e1e1e] border-gray-800 text-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Requirements Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>Requirements</FormLabel>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => appendRequirement({ name: "", description: "" })}
                  className="bg-transparent border-gray-700 text-xs"
                >
                  <Plus className="size-3 mr-1" /> Add
                </Button>
              </div>
              {requirementFields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <FormField
                      control={form.control}
                      name={`requirements.${index}.name`}
                      render={({ field }) => (
                        <Input {...field} placeholder="Requirement name" className="bg-[#1e1e1e] border-gray-800 text-white h-8 text-sm" />
                      )}
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="icon-sm" 
                    onClick={() => removeRequirement(index)}
                    className="size-8"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Target Groups Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>Service For (Target Groups)</FormLabel>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => appendServiceFor({ name: "", description: "" })}
                  className="bg-transparent border-gray-700 text-xs"
                >
                  <Plus className="size-3 mr-1" /> Add
                </Button>
              </div>
              {serviceForFields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <FormField
                      control={form.control}
                      name={`serviceFors.${index}.name`}
                      render={({ field }) => (
                        <Input {...field} placeholder="Target group" className="bg-[#1e1e1e] border-gray-800 text-white h-8 text-sm" />
                      )}
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="icon-sm" 
                    onClick={() => removeServiceFor(index)}
                    className="size-8"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="bg-transparent border-gray-800 text-white hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90"
              >
                {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                {service ? "Update Service" : "Create Service"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
