"use client";

import * as React from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useUserStore, type User } from "@/lib/stores/user-store";
import { useSecurityStore } from "@/lib/stores/security-store";
import { useOfficeStore } from "@/lib/stores/office-store";

const userSchema = z.object({
  username: z.string().min(2, "Username is required"),
  phoneNumber: z.string().min(10, "Phone number is required"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  roleId: z.string().min(1, "Role is required"),
  officeId: z.string().optional().or(z.literal("")),
  isActive: z.boolean(),
});

type UserFormValues = z.infer<typeof userSchema>;

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
  const { createUser, updateUser } = useUserStore();
  const { roles, fetchRoles } = useSecurityStore();
  const { offices, fetchOffices } = useOfficeStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema) as Resolver<UserFormValues>,
    defaultValues: {
      username: "",
      phoneNumber: "",
      password: "",
      roleId: "",
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
        roleId: user.role?.id || "",
        officeId: user.staff?.officeId || "",
        isActive: user.isActive,
      });
    } else {
      form.reset({
        username: "",
        phoneNumber: "",
        password: "",
        roleId: "",
        officeId: "",
        isActive: true,
      });
    }
  }, [user, form, open]);

  const onSubmit = async (values: UserFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        officeId: values.officeId || undefined,
        password: values.password || undefined,
      };

      if (user) {
        await updateUser(user.id, payload);
        toast.success("User updated successfully");
      } else {
        if (!values.password) {
          toast.error("Password is required for new users");
          setIsSubmitting(false);
          return;
        }
        await createUser(payload as any);
        toast.success("User created successfully");
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.message || "Failed to save user");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{user ? "Edit User" : "Add User"}</DialogTitle>
          <DialogDescription>
            {user ? "Update user details and permissions." : "Create a new user account."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
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
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="+251..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{user ? "New Password (optional)" : "Password"}</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="******" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="roleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
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
                    <FormLabel>Office (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select office" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No office</SelectItem>
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
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Enable or disable this user account.
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
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                {user ? "Update User" : "Create User"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
