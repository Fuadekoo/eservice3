"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, User, Shield, Phone, Key, Mail, Info } from "lucide-react";

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
import {
  useStaffStore,
  type CreateStaffMemberPayload,
  type StaffMember,
  type UpdateStaffMemberPayload,
} from "@/lib/stores/staff-store";
import { useSecurityStore } from "@/lib/stores/security-store";
import { dedupeRolesByName } from "@/lib/roles";
import { useTranslation } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
  ethiopianMobilePhoneSchema,
  normalizeEthiopianMobilePhone,
} from "@/lib/phone";

const staffSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  fatherName: z.string().min(2, "Father name is required"),
  lastName: z.string().min(2, "Last name is required"),
  phone: ethiopianMobilePhoneSchema,
  username: z.string().min(2, "Username is required"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional()
    .or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  // Holds a de-duplicated role name (lower-cased); the backend resolves it to
  // this office's role. Avoids repeating the same role name once per office.
  roleName: z.string().min(1, "Role is required"),
  status: z.enum(["ACTIVE", "INACTIVE", "PENDING", "BLOCKED"]),
});

type StaffFormValues = z.infer<typeof staffSchema>;

function getErrorMessage(error: unknown): string | undefined {
  return error instanceof Error ? error.message : undefined;
}

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

  const distinctRoles = React.useMemo(() => dedupeRolesByName(roles), [roles]);

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
      roleName: "",
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
        roleName: member.role?.name?.toLowerCase() || "",
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
        roleName: "",
        status: "ACTIVE",
      });
    }
  }, [member, form, open]);

  const onSubmit = async (values: StaffFormValues) => {
    setIsSubmitting(true);
    try {
      const normalizedPhone =
        normalizeEthiopianMobilePhone(values.phone) ?? values.phone;
      const payload: UpdateStaffMemberPayload = {
        firstName: values.firstName,
        fatherName: values.fatherName,
        lastName: values.lastName,
        phone: normalizedPhone,
        username: values.username,
        gender: values.gender,
        roleName: values.roleName,
        status: values.status,
        officeId,
        password: values.password || undefined,
      };

      if (member) {
        await updateStaff(member.id, payload);
        toast.success(t("Staff member updated successfully"));
      } else {
        if (!values.password) {
          toast.error(t("Password is required for new staff members"));
          setIsSubmitting(false);
          return;
        }
        const createPayload: CreateStaffMemberPayload = {
          firstName: values.firstName,
          fatherName: values.fatherName,
          lastName: values.lastName,
          phone: normalizedPhone,
          username: values.username,
          password: values.password,
          gender: values.gender,
          roleName: values.roleName,
          status: values.status,
          officeId,
        };
        await createStaff(createPayload);
        toast.success(t("Staff member created successfully"));
      }
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || t("Failed to save staff member"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full! max-w-none! gap-0 overflow-hidden border-none bg-background p-0 shadow-2xl sm:w-[94vw]! sm:rounded-l-2xl lg:w-184!"
      >
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex h-full min-h-0 flex-col"
          >
            {/* ── Header ── */}
            <div className="shrink-0 border-b border-primary/10 bg-primary/5 px-5 py-4 pr-14 sm:px-6 sm:py-5">
              <SheetHeader className="gap-1 p-0">
                <SheetTitle className="flex items-center gap-3 text-lg font-black sm:text-xl">
                  <span className="rounded-xl bg-primary/10 p-2 text-primary">
                    <User className="size-5" />
                  </span>
                  {member ? t("Edit Staff Member") : t("Add New Staff")}
                </SheetTitle>
                <SheetDescription className="font-medium text-muted-foreground sm:ml-14">
                  {member
                    ? t(
                        "Update the details and permissions for this staff member.",
                      )
                    : t(
                        "Create a new staff account and assign them to this office.",
                      )}
                </SheetDescription>
              </SheetHeader>
            </div>

            {/* ── Scrollable body ── */}
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
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
                    name="roleName"
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
                            {distinctRoles.map((role) => (
                              <SelectItem
                                key={role.key}
                                value={role.key}
                                className="rounded-lg"
                              >
                                {role.label}
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
                          placeholder="0912345678 or 251912345678"
                          className="h-11 pl-9 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
            </div>

            {/* ── Sticky footer ── */}
            <div className="shrink-0 border-t border-border/50 bg-muted/20 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-4">
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                  className="h-11 flex-1 rounded-xl border-border/50 text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-muted/50"
                >
                  {t("Cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-11 flex-[2] rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-primary/20"
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
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
