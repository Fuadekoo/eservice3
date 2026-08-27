"use client";

import * as React from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { optionalStrongPasswordSchema } from "@/lib/password-strength";
import { toast } from "sonner";
import { Building2, Key, Loader2, Phone, Shield, User } from "lucide-react";

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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  useUserStore,
  type CreateUserPayload,
  type UpdateUserPayload,
  type User as UserRecord,
} from "@/lib/stores/user-store";
import { useSecurityStore } from "@/lib/stores/security-store";
import { dedupeRolesByName, isOfficeAssignableRole } from "@/lib/roles";
import { useOfficeStore } from "@/lib/stores/office-store";
import {
  ethiopianMobilePhoneSchema,
  normalizeEthiopianMobilePhone,
} from "@/lib/phone";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Sentinel for "no office" — Radix Select cannot hold an empty string value. */
const NO_OFFICE = "none";

const userSchema = z.object({
  // Trimmed before the length check so a whitespace-only name is rejected.
  firstName: z.string().trim().min(1, "First name is required"),
  fatherName: z.string().trim().min(1, "Father name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  username: z.string().trim().min(2, "Username is required"),
  phoneNumber: ethiopianMobilePhoneSchema,
  password: optionalStrongPasswordSchema,
  // Holds a de-duplicated role name (lower-cased); the backend resolves it to a
  // concrete role. Avoids listing the same role name once per office.
  roleName: z.string().min(1, "Role is required"),
  officeId: z.string().optional().or(z.literal("")),
  isActive: z.boolean(),
});

type UserFormValues = z.infer<typeof userSchema>;

function getErrorMessage(error: unknown): string | undefined {
  return error instanceof Error ? error.message : undefined;
}

interface UserCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserRecord | null;
}

/** Small uppercase heading used to group the fields in the sheet. */
function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-muted-foreground/70">
      <Icon className="size-4 text-primary" />
      {children}
    </div>
  );
}

export function UserCreateDialog({
  open,
  onOpenChange,
  user,
}: UserCreateDialogProps) {
  const { t } = useTranslation();

  const { createUser, updateUser } = useUserStore();
  const { roles, fetchRoles } = useSecurityStore();
  const { offices, fetchOffices } = useOfficeStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Every role is listed here — unlike the office-assignment dialog, this screen
  // legitimately creates customers too.
  const distinctRoles = React.useMemo(() => dedupeRolesByName(roles), [roles]);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema) as Resolver<UserFormValues>,
    defaultValues: {
      firstName: "",
      fatherName: "",
      lastName: "",
      username: "",
      phoneNumber: "",
      password: "",
      roleName: "",
      officeId: "",
      isActive: true,
    },
  });

  const roleName = useWatch({ control: form.control, name: "roleName" });

  // A customer belongs to no office — they apply to any of them. Same rule as
  // the office assignment dropdown, kept in one place in lib/roles.
  const isCustomerRole = Boolean(roleName) && !isOfficeAssignableRole(roleName);
  // The office cannot be chosen before the role, because the role decides
  // whether an office applies at all.
  const isOfficeLocked = !roleName || isCustomerRole;

  React.useEffect(() => {
    if (open) {
      fetchRoles();
      fetchOffices();
    }
  }, [open, fetchRoles, fetchOffices]);

  React.useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName ?? "",
        fatherName: user.fatherName ?? "",
        lastName: user.lastName ?? "",
        username: user.username,
        phoneNumber: user.phoneNumber,
        password: "",
        roleName: user.role?.name?.toLowerCase() || "",
        officeId: user.staff?.officeId || "",
        isActive: user.isActive,
      });
    } else {
      form.reset({
        firstName: "",
        fatherName: "",
        lastName: "",
        username: "",
        phoneNumber: "",
        password: "",
        roleName: "",
        officeId: "",
        isActive: true,
      });
    }
  }, [user, form, open]);

  // Switching to a role that has no office must not leave a stale selection
  // behind, or the user would submit an office they can no longer see.
  React.useEffect(() => {
    if (isOfficeLocked && form.getValues("officeId")) {
      form.setValue("officeId", "", { shouldDirty: true });
    }
  }, [isOfficeLocked, form]);

  const officePlaceholder = !roleName
    ? t("Select a role first")
    : isCustomerRole
      ? t("Not applicable to customers")
      : t("Select office");

  const officeHint = !roleName
    ? t("Choose a role first — it decides whether an office applies.")
    : isCustomerRole
      ? t("Customers apply to any office, so they are not assigned to one.")
      : t("Optional. Leave empty for a user who is not tied to one office.");

  const onSubmit = async (values: UserFormValues) => {
    setIsSubmitting(true);
    try {
      const normalizedPhone =
        normalizeEthiopianMobilePhone(values.phoneNumber) ?? values.phoneNumber;
      // A locked office is never sent, and the "no office" sentinel is not a real id.
      const officeId =
        isOfficeLocked || !values.officeId || values.officeId === NO_OFFICE
          ? undefined
          : values.officeId;

      const payload: UpdateUserPayload = {
        firstName: values.firstName,
        fatherName: values.fatherName,
        lastName: values.lastName,
        username: values.username,
        phoneNumber: normalizedPhone,
        roleName: values.roleName,
        officeId,
        password: values.password || undefined,
        isActive: values.isActive,
      };

      if (user) {
        await updateUser(user.id, payload);
        toast.success(t("User updated successfully"));
      } else {
        if (!values.password) {
          toast.error(t("Password is required for new users"));
          setIsSubmitting(false);
          return;
        }
        const createPayload: CreateUserPayload = {
          firstName: values.firstName,
          fatherName: values.fatherName,
          lastName: values.lastName,
          username: values.username,
          phoneNumber: normalizedPhone,
          password: values.password,
          roleName: values.roleName,
          officeId,
          isActive: values.isActive,
        };
        await createUser(createPayload);
        toast.success(t("User created successfully"));
      }
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || t("Failed to save user"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full! max-w-none! gap-0 overflow-hidden border-none bg-background p-0 shadow-2xl sm:w-[94vw]! sm:rounded-l-2xl lg:w-160!"
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
                  {user ? t("Edit User") : t("Add User")}
                </SheetTitle>
                <SheetDescription className="font-medium text-muted-foreground sm:ml-14">
                  {user
                    ? t("Update user details and permissions.")
                    : t("Create a new user account.")}
                </SheetDescription>
              </SheetHeader>
            </div>

            {/* ── Scrollable body ── */}
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
              {/* Personal information */}
              <div className="space-y-4">
                <SectionTitle icon={User}>
                  {t("Personal Information")}
                </SectionTitle>

                <div className="grid gap-4 sm:grid-cols-3">
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
                            placeholder={t("First name")}
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
                            placeholder={t("Father name")}
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
                            placeholder={t("Last name")}
                            className="h-11 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20"
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-xs uppercase tracking-tighter">
                        {t("Username")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="johndoe"
                          className="h-11 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="bg-border/50" />

              {/* Account access */}
              <div className="space-y-4">
                <SectionTitle icon={Key}>{t("Account Access")}</SectionTitle>

                <FormField
                  control={form.control}
                  name="phoneNumber"
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

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-xs uppercase tracking-tighter">
                        {user ? t("New Password (optional)") : t("Password")}
                      </FormLabel>
                      <FormControl>
                        <PasswordInput
                          {...field}
                          showStrength
                          placeholder="••••••••"
                          autoComplete="new-password"
                          className="h-11 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20"
                        />
                      </FormControl>
                      {user && (
                        <FormDescription className="text-[10px]">
                          {t("Leave blank to keep current password.")}
                        </FormDescription>
                      )}
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="bg-border/50" />

              {/* Role, then office — in that order, because the role decides
                  whether an office applies at all. */}
              <div className="space-y-4">
                <SectionTitle icon={Shield}>
                  {t("Role & Office")}
                </SectionTitle>

                <FormField
                  control={form.control}
                  name="roleName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-xs uppercase tracking-tighter">
                        <span className="flex items-center gap-1.5">
                          <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-black text-primary-foreground">
                            1
                          </span>
                          {t("Role")}
                        </span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
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
                              {t(role.label)}
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
                  name="officeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        className={cn(
                          "font-bold text-xs uppercase tracking-tighter",
                          isOfficeLocked && "text-muted-foreground/60",
                        )}
                        aria-disabled={isOfficeLocked}
                      >
                        <span className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "flex size-4 items-center justify-center rounded-full text-[9px] font-black",
                              isOfficeLocked
                                ? "bg-muted text-muted-foreground"
                                : "bg-primary text-primary-foreground",
                            )}
                          >
                            2
                          </span>
                          {t("Office")}
                        </span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                        disabled={isOfficeLocked}
                      >
                        <FormControl>
                          <SelectTrigger
                            className="h-11 rounded-xl bg-muted/30 border-border/50 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                            aria-label={t("Office")}
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <Building2 className="size-4 shrink-0 text-muted-foreground" />
                              <SelectValue placeholder={officePlaceholder} />
                            </span>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-border/50 shadow-xl">
                          <SelectItem value={NO_OFFICE} className="rounded-lg">
                            {t("No office")}
                          </SelectItem>
                          {offices.map((office) => (
                            <SelectItem
                              key={office.id}
                              value={office.id}
                              className="rounded-lg"
                            >
                              {office.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-[10px]">
                        {officeHint}
                      </FormDescription>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/50 bg-muted/30 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-bold">
                          {t("Active Status")}
                        </FormLabel>
                        <p className="text-xs text-muted-foreground">
                          {t("Enable or disable this user account.")}
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
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
                  ) : user ? (
                    t("Update User")
                  ) : (
                    t("Create User")
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

