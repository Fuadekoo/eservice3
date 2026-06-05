"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
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
import { useStaffStore, type StaffMember } from "@/lib/stores/staff-store";
import { useSecurityStore } from "@/lib/stores/security-store";

const staffSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  fatherName: z.string().min(2, "Father name is required"),
  lastName: z.string().min(2, "Last name is required"),
  phone: z.string().min(10, "Phone number is required"),
  username: z.string().min(2, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  roleId: z.string().min(1, "Role is required"),
  status: z.enum(["ACTIVE", "INACTIVE", "PENDING", "BLOCKED"]).default("ACTIVE"),
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
        toast.success("Staff member updated successfully");
      } else {
        if (!values.password) {
          toast.error("Password is required for new staff members");
          setIsSubmitting(false);
          return;
        }
        await createStaff(payload as any);
        toast.success("Staff member created successfully");
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.message || "Failed to save staff member");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-[#121212] text-white border-gray-800">
        <DialogHeader>
          <DialogTitle>{member ? "Edit Staff Member" : "Add Staff Member"}</DialogTitle>
          <DialogDescription className="text-gray-400">
            {member ? "Update staff details and status." : "Create a new staff account for your office."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="John" className="bg-[#1e1e1e] border-gray-800" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fatherName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Father Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Doe" className="bg-[#1e1e1e] border-gray-800" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Smith" className="bg-[#1e1e1e] border-gray-800" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+251..." className="bg-[#1e1e1e] border-gray-800" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="johndoe" className="bg-[#1e1e1e] border-gray-800" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{member ? "New Password (optional)" : "Password"}</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="******" className="bg-[#1e1e1e] border-gray-800" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-[#1e1e1e] border-gray-800">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#1e1e1e] border-gray-800 text-white">
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="roleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-[#1e1e1e] border-gray-800">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#1e1e1e] border-gray-800 text-white">
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-[#1e1e1e] border-gray-800">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#1e1e1e] border-gray-800 text-white">
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="BLOCKED">Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                {member ? "Update Member" : "Create Member"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
