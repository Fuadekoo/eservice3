"use client";

import { useSession } from "@/lib/auth-client";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { useTranslation } from "@/lib/i18n";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Building,
  User,
  Shield,
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar,
  Lock,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function DashboardPage() {
  const { data, isPending } = useSession();
  const { permissions } = usePermissions();
  const { t } = useTranslation();
  const session = data?.session;

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const user = session?.user;
  const officeId = session?.officeId || user?.officeId || session?.office?.id;
  const office = session?.office;
  const role = session?.role;

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("Dashboard")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("Welcome back, ")}
          {user?.name}
          {t(". Here is an overview of your account and organization.")}
        </p>
      </div>

      {/* Quick Stats / Highlights */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:border-primary/50 transition-colors bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("User Role")}
            </CardTitle>
            <div className="p-1.5 bg-primary/10 rounded-md">
              <Shield className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {role?.name ? t(role.name) : t("Member")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("Primary designation at ")}
              {office?.name}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("Permissions")}
            </CardTitle>
            <div className="p-1.5 bg-primary/10 rounded-md">
              <Lock className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{permissions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("Active system access rights")}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-emerald-500/50 transition-colors bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("Org Status")}
            </CardTitle>
            <div className="p-1.5 bg-emerald-500/10 rounded-md">
              <Building className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-emerald-600">
                {t("Active")}
              </div>
              <Badge
                variant="outline"
                className="bg-emerald-50 text-emerald-700 border-emerald-200"
              >
                {t("Verified")}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("Subscription is currently active")}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("System Health")}
            </CardTitle>
            <div className="p-1.5 bg-primary/10 rounded-md">
              <UserCheck className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{t("Good")}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("Security protocols active")}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Information */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-primary">
              <User className="h-5 w-5" />
              {t("Account Profile")}
            </CardTitle>
            <CardDescription>
              {t("Your personal account details and identification.")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{t("Full Name")}</span>
                </div>
                <span className="text-sm font-semibold">{user?.name}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{t("Username")}</span>
                </div>
                <span className="text-sm text-primary font-mono">
                  @{user?.username}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {t("Phone Number")}
                  </span>
                </div>
                <span className="text-sm">{user?.phone || "N/A"}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {t("Email Address")}
                  </span>
                </div>
                <span className="text-sm truncate max-w-[200px] text-muted-foreground">
                  {user?.email || "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Office Information */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-primary">
              <Building className="h-5 w-5" />
              {t("Office Identity")}
            </CardTitle>
            <CardDescription>
              {t("Details about your registered office unit.")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{t("Office")}</span>
                </div>
                <span className="text-sm font-bold">{office?.name}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{t("Address")}</span>
                </div>
                <span className="text-sm text-right max-w-[200px] text-muted-foreground">
                  {office?.address}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="size-2 bg-emerald-500 rounded-full" />
                  <span className="text-sm font-medium">
                    {t("Network Access")}
                  </span>
                </div>
                <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                  {office?.subdomain || t("default")}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/10">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary-foreground/90">
                    {t("Subscription Term")}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-primary/70 uppercase font-black">
                    {t("Valid Thru")}
                  </p>
                  <p className="text-sm font-black text-primary">
                    {formatDate(office?.subscriptionExpiry)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Permissions Section */}
      <Card className="bg-muted/40 border-border/80">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            {t("Security & Access Mapping")}
          </CardTitle>
          <CardDescription>
            {t(
              "Modules and operational features currently authorized for your session.",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {permissions.length > 0 ? (
              permissions.map((permission) => (
                <Badge
                  key={permission}
                  variant="outline"
                  className="bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-primary transition-colors cursor-default"
                >
                  {permission.replace(/_/g, " ")}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {t("No specific permissions assigned.")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
