"use client";

import * as React from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { optionalStrongPasswordSchema } from "@/lib/password-strength";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  useUserStore,
  type CreateUserPayload,
  type UpdateUserPayload,
  type User,
} from "@/lib/stores/user-store";
import { useSecurityStore } from "@/lib/stores/security-store";
import { dedupeRolesByName } from "@/lib/roles";
import { useOfficeStore } from "@/lib/stores/office-store";
import {
  ethiopianMobilePhoneSchema,
  normalizeEthiopianMobilePhone,
} from "@/lib/phone";
import { useTranslation } from "@/lib/i18n";

const userSchema = z.object({
  username: z.string().min(2, "Username is required"),
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
  user?: User | null;
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

  const distinctRoles = React.useMemo(() => dedupeRolesByName(roles), [roles]);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema) as Resolver<UserFormValues>,
    defaultValues: {
      username: "",
      phoneNumber: "",
      password: "",
      roleName: "",
      officeId: "",
      isActive: true,
    },
  });

  React.useEffect(() => {
    if (open) {
      fetchRoles();
      fetchOffices();
    }
  }, [open, fetchRoles, fetchOffices]);

  React.useEffect(() => {
    if (user) {
      form.reset({
        username: user.username,
        phoneNumber: user.phoneNumber,
        password: "",
        roleName: user.role?.name?.toLowerCase() || "",
        officeId: user.staff?.officeId || "",
        isActive: user.isActive,
      });
    } else {
      form.reset({
        username: "",
        phoneNumber: "",
        password: "",
        roleName: "",
        officeId: "",
        isActive: true,
      });
    }
  }, [user, form, open]);

  const onSubmit = async (values: UserFormValues) => {
    setIsSubmitting(true);
    try {
      const normalizedPhone =
        normalizeEthiopianMobilePhone(values.phoneNumber) ?? values.phoneNumber;
      const payload: UpdateUserPayload = {
        username: values.username,
        phoneNumber: normalizedPhone,
        roleName: values.roleName,
        officeId: values.officeId || undefined,
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
          username: values.username,
          phoneNumber: normalizedPhone,
          password: values.password,
          roleName: values.roleName,
          officeId: values.officeId || undefined,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{user ? t("Edit User") : t("Add User")}</DialogTitle>
          <DialogDescription>
            {user ? t("Update user details and permissions.") : t("Create a new user account.")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Username")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="johndoe" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Phone Number")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="0912345678 or 251912345678" />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{user ? t("New Password (optional)") : t("Password")}</FormLabel>
                  <FormControl>
                    <PasswordInput
                      {...field}
                      showStrength
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="roleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Role")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("Select role")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {distinctRoles.map((role) => (
                          <SelectItem key={role.key} value={role.key}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="officeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Office (Optional)")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("Select office")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">{t("No office")}</SelectItem>
                        {offices.map((office) => (
                          <SelectItem key={office.id} value={office.id}>
                            {office.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">{t("Active Status")}</FormLabel>
                    <p className="text-sm text-muted-foreground">
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

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t("Cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                {user ? t("Update User") : t("Create User")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
