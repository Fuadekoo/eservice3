"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, User, Shield, Phone, Key, Mail, Info } from "lucide-react";

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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStaffStore, type StaffMember } from "@/lib/stores/staff-store";
import { useSecurityStore } from "@/lib/stores/security-store";
import { useTranslation } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const staffSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  fatherName: z.string().min(2, "Father name is required"),
  lastName: z.string().min(2, "Last name is required"),
  phone: z.string().min(10, "Phone number is required"),
  username: z.string().min(2, "Username is required"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional()
    .or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  roleId: z.string().min(1, "Role is required"),
  status: z
    .enum(["ACTIVE", "INACTIVE", "PENDING", "BLOCKED"])
    .default("ACTIVE"),
});

type StaffFormValues = z.infer<typeof staffSchema>;

interface StaffCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: StaffMember | null;
  officeId?: string;
}

export function StaffCreateDialog({
  open,
  onOpenChange,
  member,
  officeId,
}: StaffCreateDialogProps) {
  const { t } = useTranslation();
  const { createStaff, updateStaff } = useStaffStore();
  const { roles, fetchRoles } = useSecurityStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      firstName: "",
      fatherName: "",
      lastName: "",
      phone: "",
      username: "",
      password: "",
      gender: "MALE",
      roleId: "",
      status: "ACTIVE",
    },
  });

  React.useEffect(() => {
    if (open) {
      fetchRoles();
    }
  }, [open, fetchRoles]);

  React.useEffect(() => {
    if (member) {
      form.reset({
        firstName: member.firstName || "",
        fatherName: member.fatherName || "",
        lastName: member.lastName || "",
        phone: member.phone,
        username: member.username,
        password: "",
        gender: member.gender,
        roleId: member.role.id,
        status: member.status,
      });
    } else {
      form.reset({
        firstName: "",
        fatherName: "",
        lastName: "",
        phone: "",
        username: "",
        password: "",
        gender: "MALE",
        roleId: "",
        status: "ACTIVE",
      });
    }
  }, [member, form, open]);

  const onSubmit = async (values: StaffFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        officeId,
        password: values.password || undefined,
      };

      if (member) {
        await updateStaff(member.id, payload as any);
        toast.success(t("Staff member updated successfully"));
      } else {
        if (!values.password) {
          toast.error(t("Password is required for new staff members"));
          setIsSubmitting(false);
          return;
        }
        await createStaff(payload as any);
        toast.success(t("Staff member created successfully"));
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.message || t("Failed to save staff member"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl rounded-2xl">
        <DialogHeader className="p-6 pb-4 bg-primary/5 border-b border-primary/10">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <User className="size-5" />
            </div>
            <DialogTitle className="text-xl font-black">
              {member ? t("Edit Staff Member") : t("Add New Staff")}
            </DialogTitle>
          </div>
          <DialogDescription className="font-medium text-muted-foreground ml-11">
            {member
              ? t("Update the details and permissions for this staff member.")
              : t("Create a new staff account and assign them to this office.")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
            <div className="p-6 space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-muted-foreground/70">
                  <Info className="size-4" />
                  {t("Personal Information")}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-xs uppercase tracking-tighter">
                          {t("First Name")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Abebe"
                            className="h-11 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20"
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fatherName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-xs uppercase tracking-tighter">
                          {t("Father Name")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Bekele"
                            className="h-11 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20"
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-xs uppercase tracking-tighter">
                          {t("Last Name")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Kebede"
                            className="h-11 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20"
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator className="bg-border/50" />

              {/* Account Credentials */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-muted-foreground/70">
                  <Key className="size-4" />
                  {t("Account Credentials")}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-xs uppercase tracking-tighter">
                          {t("Username")}
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                              {...field}
                              placeholder="abebe.bekele"
                              className="h-11 pl-9 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20"
                            />
                          </div>
                        </FormControl>
                        <FormDescription className="text-[10px]">
                          {t("This will be used for system login.")}
                        </FormDescription>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-xs uppercase tracking-tighter">
                          {member ? t("New Password") : t("Password")}
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                              {...field}
                              type="password"
                              placeholder="••••••••"
                              className="h-11 pl-9 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20"
                            />
                          </div>
                        </FormControl>
                        {member && (
                          <FormDescription className="text-[10px]">
                            {t("Leave blank to keep current password.")}
                          </FormDescription>
                        )}
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator className="bg-border/50" />

              {/* Role & Status */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-muted-foreground/70">
                  <Shield className="size-4" />
                  {t("Permissions & Status")}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-xs uppercase tracking-tighter">
                          {t("Gender")}
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-border/50 focus:ring-primary/20">
                              <SelectValue placeholder={t("Select gender")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl border-border/50 shadow-xl">
                            <SelectItem value="MALE" className="rounded-lg">
                              {t("Male")}
                            </SelectItem>
                            <SelectItem value="FEMALE" className="rounded-lg">
                              {t("Female")}
                            </SelectItem>
                            <SelectItem value="OTHER" className="rounded-lg">
                              {t("Other")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="roleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-xs uppercase tracking-tighter">
                          {t("Assign Role")}
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-border/50 focus:ring-primary/20">
                              <SelectValue placeholder={t("Select role")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl border-border/50 shadow-xl">
                            {roles.map((role) => (
                              <SelectItem
                                key={role.id}
                                value={role.id}
                                className="rounded-lg"
                              >
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-xs uppercase tracking-tighter">
                          {t("Account Status")}
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-border/50 focus:ring-primary/20">
                              <SelectValue placeholder={t("Select status")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl border-border/50 shadow-xl">
                            <SelectItem value="ACTIVE" className="rounded-lg">
                              {t("Active")}
                            </SelectItem>
                            <SelectItem value="INACTIVE" className="rounded-lg">
                              {t("Inactive")}
                            </SelectItem>
                            <SelectItem value="PENDING" className="rounded-lg">
                              {t("Pending")}
                            </SelectItem>
                            <SelectItem value="BLOCKED" className="rounded-lg">
                              {t("Blocked")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Phone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-xs uppercase tracking-tighter">
                      {t("Phone Number")}
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          {...field}
                          placeholder="+251 911 223 344"
                          className="h-11 pl-9 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
            </div>

            <div className="p-6 bg-muted/20 border-t border-border/50 flex flex-col sm:flex-row gap-3 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-11 px-8 rounded-xl font-bold border-border/50 hover:bg-muted/50 uppercase text-[10px] tracking-widest transition-all"
              >
                {t("Cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 px-10 rounded-xl font-black uppercase text-xs tracking-wider shadow-lg shadow-primary/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    {t("Saving...")}
                  </>
                ) : member ? (
                  t("Update Staff")
                ) : (
                  t("Create Staff")
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
