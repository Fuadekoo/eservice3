"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import {
  NAVIGATION,
  NAVIGATION_LOOKUP,
  BREADCRUMB_ROOT,
} from "@/config/navigation";
import { useLanguagesStore } from "@/lib/stores/languages-store";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User, Settings } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { LanguageToggle } from "../language-toggle";
import { logout, isAuthenticated } from "@/lib/auth-client";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { useTranslation } from "@/lib/i18n";

function getBreadcrumbs(pathname: string) {
  const trail = [];
  let current = pathname === "/" ? "/" : pathname;

  if (current.length > 1 && current.endsWith("/")) {
    current = current.slice(0, -1);
  }

  while (current) {
    const entry = NAVIGATION_LOOKUP[current];
    if (!entry) {
      break;
    }
    trail.push(entry);

    // If parent has no href but has a title, add it as a non-clickable breadcrumb
    if (entry.parentTitleKey && !entry.parent) {
      trail.push({
        titleKey: entry.parentTitleKey,
        href: "#",
      });
      break;
    }

    if (!entry.parent) {
      break;
    }
    current = entry.parent;
  }

  trail.reverse();

  const breadcrumbs = [
    BREADCRUMB_ROOT,
    ...trail.filter((crumb, index, array) => {
      if (crumb.href === "/" && index !== array.length - 1) {
        return false;
      }
      return true;
    }),
  ];

  const last = breadcrumbs[breadcrumbs.length - 1];
  return {
    items: breadcrumbs.slice(0, -1),
    current: last,
  };
}

function UserAvatarDropdown() {
  const router = useRouter();
  const [user, setUser] = React.useState<{
    name: string;
    username: string;
    phone: string;
    image?: string;
  } | null>(null);

  React.useEffect(() => {
    // Get user from localStorage
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        setUser({
          name: parsedUser.name || "User",
          username: parsedUser.username || "",
          phone: parsedUser.phone || "",
        });
      } catch {
        setUser({ name: "Administrator", username: "admin", phone: "" });
      }
    } else {
      setUser({ name: "Administrator", username: "admin", phone: "" });
    }
  }, []);

  const handleLogout = React.useCallback(async () => {
    logout();
    router.refresh();
  }, [router]);

  const initials =
    user?.name
      ?.trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "AD";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.image} alt={user?.name || "User"} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user?.name || "Administrator"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.phone || user?.username || "No phone"}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <User className="mr-2 size-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <Settings className="mr-2 size-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} variant="destructive">
          <LogOut className="mr-2 size-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { getTranslationForKey, selectedLanguage } = useTranslation();
  const { loadTranslations } = useLanguagesStore();
  const {
    role,
    isLoading: isLoadingPermissions,
    hasAnyPermission,
  } = usePermissions();
  const [openMenus, setOpenMenus] = React.useState<Record<string, boolean>>({});

  const getNavTitle = (i: any) => i?.title ?? i?.label ?? i?.name ?? "";

  // Check authentication and redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated()) {
      console.log(
        "[DashboardShell] User not authenticated, redirecting to signin",
      );
      const search = window.location.search;
      const fullPath = window.location.pathname + search;
      router.replace(`/signin?callbackUrl=${encodeURIComponent(fullPath)}`);
    }
  }, [router]);

  // Debug: Log role information
  React.useEffect(() => {
    console.log("[DashboardShell] Role state:", {
      role,
      roleName: role?.name,
      roleNameUpper: role?.name?.toUpperCase(),
      isLoadingPermissions,
      hasRole: !!role,
      allNavigationItems: NAVIGATION.flatMap((s) => s.items).map((i) => ({
        title: getNavTitle(i),
        roles: i.roles,
      })),
    });
  }, [role, isLoadingPermissions]);

  React.useEffect(() => {
    // Always load translations on mount to pick up new keys
    loadTranslations();
  }, [loadTranslations]);

  React.useEffect(() => {
    // Auto-open menus that contain the active page
    const newOpenMenus: Record<string, boolean> = {};
    NAVIGATION.forEach((section) => {
      section.items.forEach((item) => {
        if (item.items) {
          const hasActiveSubItem = item.items.some(
            (subitem) =>
              pathname === subitem.href ||
              pathname.startsWith(`${subitem.href}/`),
          );
          if (hasActiveSubItem) {
            newOpenMenus[getNavTitle(item)] = true;
          }
        }
      });
    });
    setOpenMenus((prev) => ({ ...prev, ...newOpenMenus }));
  }, [pathname]);

  const matchPath = React.useCallback(
    (href: string) => {
      if (href === "/") {
        return pathname === "/";
      }

      return pathname === href || pathname.startsWith(`${href}/`);
    },
    [pathname],
  );
  const { items: breadcrumbItems, current } = React.useMemo(
    () => getBreadcrumbs(pathname),
    [pathname],
  );

  return (
    <SidebarProvider className="h-dvh overflow-hidden">
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader className="border-b border-sidebar-border pb-3">
          <div className="flex items-center gap-3 overflow-hidden group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
            <div className="shrink-0 size-8 flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="e-service Logo"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <div className="overflow-hidden group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-semibold leading-tight truncate uppercase tracking-wider">
                {getTranslationForKey("e-service", selectedLanguage)}
              </p>
              <p className="text-[10px] font-bold text-primary truncate">
                {getTranslationForKey("Government Portal", selectedLanguage)}
              </p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          {isLoadingPermissions ? (
            <div className="px-4 py-2 text-sm text-muted-foreground">
              Loading navigation...
            </div>
          ) : !role?.name ? (
            <div className="px-4 py-2 space-y-2">
              <div className="text-sm font-medium text-destructive">
                ⚠️ No role detected
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>isLoading: {String(isLoadingPermissions)}</div>
                <div>role: {JSON.stringify(role)}</div>
                <div className="mt-2">Please check:</div>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>Are you logged in?</li>
                  <li>Check browser console for errors</li>
                  <li>Check Network tab for /auth/me response</li>
                </ul>
              </div>
            </div>
          ) : (
            NAVIGATION.map((section) => {
              const roleNameUpper = role.name?.toUpperCase() || "";

              const filteredItems = section.items
                .filter((item) => {
                  const itemRolesUpper =
                    item.roles?.map((r) => r.toUpperCase()) ?? [];
                  const hasRoleRestriction = itemRolesUpper.length > 0;

                  const itemPermissions = item.permissions ?? [];
                  const hasPermissionRestriction = itemPermissions.length > 0;

                  const hasRoleMatch =
                    !hasRoleRestriction ||
                    itemRolesUpper.includes(roleNameUpper);

                  // If the item is already gated by a role the user has,
                  // the role match is sufficient — skip the permission check.
                  const hasPermissionMatch =
                    !hasPermissionRestriction ||
                    (hasRoleRestriction && hasRoleMatch) ||
                    hasAnyPermission(itemPermissions);

                  return hasRoleMatch && hasPermissionMatch;
                })
                .map((item) => {
                  // Filter sub-items based on permissions
                  if (item.items && item.items.length > 0) {
                    const filteredSubItems = item.items.filter((subitem) => {
                      const subPerms = subitem.permissions ?? [];
                      if (subPerms.length === 0) return true;
                      return hasAnyPermission(subPerms);
                    });

                    // Return item with filtered sub-items
                    return { ...item, items: filteredSubItems };
                  }
                  return item;
                })
                .filter((item) => {
                  // Hide parent items that have no visible sub-items
                  if (item.items && item.items.length === 0 && !item.href) {
                    return false;
                  }
                  return true;
                });

              // Don't render section if it has no items after filtering
              if (filteredItems.length === 0) {
                console.log(
                  `[Nav] Section "${section.labelKey}" has no items after filtering, hiding section`,
                );
                return null;
              }

              console.log(
                `[Nav] Section "${section.labelKey}" has ${filteredItems.length} items after filtering`,
              );

              return (
                <SidebarGroup key={section.labelKey}>
                  <SidebarGroupLabel>
                    {getTranslationForKey(section.labelKey, selectedLanguage)}
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {filteredItems.map((item, i) => {
                        const isActive = matchPath(item.href || "");
                        const hasSubItems = (item.items?.length ?? 0) > 0;
                        const hasActiveSubItem =
                          hasSubItems &&
                          item.items?.some(
                            (subitem) =>
                              pathname === subitem.href ||
                              pathname.startsWith(`${subitem.href}/`),
                          );
                        const shouldBeOpen =
                          openMenus[item.titleKey] ??
                          (i === 0 || hasActiveSubItem);

                        return (
                          <Collapsible
                            key={item.titleKey}
                            open={shouldBeOpen}
                            onOpenChange={(open) =>
                              setOpenMenus((prev) => ({
                                ...prev,
                                [item.titleKey]: open,
                              }))
                            }
                            className="group/collapsible"
                          >
                            <SidebarMenuItem>
                              <CollapsibleTrigger asChild>
                                <SidebarMenuButton
                                  asChild={!hasSubItems && !!item.href}
                                  isActive={isActive || hasActiveSubItem}
                                  tooltip={getTranslationForKey(
                                    item.titleKey,
                                    selectedLanguage,
                                  )}
                                >
                                  {hasSubItems ? (
                                    <div className="flex w-full items-center gap-2 cursor-pointer">
                                      <item.icon className="size-4 shrink-0" />
                                      <span className="truncate group-data-[collapsible=icon]:hidden">
                                        {getTranslationForKey(
                                          item.titleKey,
                                          selectedLanguage,
                                        )}
                                      </span>
                                      <ChevronLeft className="ml-auto size-4 shrink-0 group-data-[state=open]/collapsible:-rotate-90 transition-transform group-data-[collapsible=icon]:hidden" />
                                    </div>
                                  ) : (
                                    <Link
                                      href={item.href || "#"}
                                      className="flex w-full items-center gap-2"
                                    >
                                      <item.icon className="size-4 shrink-0" />
                                      <span className="truncate group-data-[collapsible=icon]:hidden">
                                        {getTranslationForKey(
                                          item.titleKey,
                                          selectedLanguage,
                                        )}
                                      </span>
                                    </Link>
                                  )}
                                </SidebarMenuButton>
                              </CollapsibleTrigger>
                              {hasSubItems ? (
                                <CollapsibleContent>
                                  <SidebarMenuSub>
                                    {item.items?.map((subitem) => (
                                      <SidebarMenuSubItem key={subitem.href}>
                                        <SidebarMenuSubButton
                                          asChild
                                          isActive={
                                            pathname === subitem.href ||
                                            pathname.startsWith(
                                              `${subitem.href}/`,
                                            )
                                          }
                                        >
                                          <Link href={subitem.href}>
                                            {getTranslationForKey(
                                              subitem.titleKey,
                                              selectedLanguage,
                                            )}
                                          </Link>
                                        </SidebarMenuSubButton>
                                      </SidebarMenuSubItem>
                                    ))}
                                  </SidebarMenuSub>
                                </CollapsibleContent>
                              ) : null}
                            </SidebarMenuItem>
                          </Collapsible>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              );
            })
          )}
        </SidebarContent>
        <SidebarFooter></SidebarFooter>
      </Sidebar>

      <SidebarInset className="grid grid-rows-[auto_1fr] overflow-hidden ">
        <header className="p-2 border-b bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/60 flex gap-2 items-center ">
          <SidebarTrigger />
          <Separator orientation="vertical" className="max-h-6 max-md:hidden" />
          <div className="flex-1 flex items-center gap-3">
            <Breadcrumb className="max-md:hidden">
              <BreadcrumbList>
                {breadcrumbItems.map((breadcrumb) => (
                  <React.Fragment key={breadcrumb.href}>
                    <BreadcrumbItem>
                      {breadcrumb.href === "#" ? (
                        <span className="text-muted-foreground">
                          {getTranslationForKey(
                            breadcrumb.href,
                            selectedLanguage,
                          )}
                        </span>
                      ) : (
                        <BreadcrumbLink href={breadcrumb.href}>
                          {getTranslationForKey(
                            breadcrumb.href,
                            selectedLanguage,
                          )}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                  </React.Fragment>
                ))}
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {getTranslationForKey(current.href, selectedLanguage)}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <ThemeToggle />
          <Separator orientation="vertical" className="max-h-6" />
          <LanguageToggle />
          <Separator orientation="vertical" className="max-h-6" />
          <UserAvatarDropdown />
        </header>

        <main className="grid overflow-x-hidden overflow-y-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
