"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Loader2, Trash2 } from "lucide-react";

import { PageLayout } from "@/components/dashboard/page-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { NotificationItem } from "@/components/notifications/notification-item";
import {
  useNotificationStore,
  type AppNotification,
} from "@/lib/stores/notification-store";

const PAGE_SIZE = 20;

type Filter = "all" | "unread";

export default function NotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = React.useState<Filter>("all");

  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const pagination = useNotificationStore((state) => state.pagination);
  const isLoading = useNotificationStore((state) => state.isLoading);
  const isLoadingMore = useNotificationStore((state) => state.isLoadingMore);
  const error = useNotificationStore((state) => state.error);

  const fetchNotifications = useNotificationStore(
    (state) => state.fetchNotifications,
  );
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  const removeNotification = useNotificationStore(
    (state) => state.removeNotification,
  );
  const clearAll = useNotificationStore((state) => state.clearAll);

  React.useEffect(() => {
    void fetchNotifications({
      page: 1,
      pageSize: PAGE_SIZE,
      unreadOnly: filter === "unread",
    });
  }, [filter, fetchNotifications]);

  const handleSelect = React.useCallback(
    (notification: AppNotification) => {
      void markAsRead(notification.id);
      if (notification.url) router.push(notification.url);
    },
    [markAsRead, router],
  );

  const handleLoadMore = React.useCallback(() => {
    if (!pagination?.hasNextPage) return;
    void fetchNotifications({
      page: pagination.page + 1,
      pageSize: PAGE_SIZE,
      unreadOnly: filter === "unread",
      append: true,
    });
  }, [fetchNotifications, filter, pagination]);

  return (
    <PageLayout
      title="Notifications"
      description="Everything that happened on your requests, appointments and reports."
      icon={Bell}
      tabs={[
        { label: "All", value: "all" },
        { label: "Unread", value: "unread", badge: unreadCount || undefined },
      ]}
      activeTab={filter}
      onTabChange={(value) => setFilter(value as Filter)}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={unreadCount === 0}
            onClick={() => void markAllAsRead()}
          >
            <CheckCheck className="mr-2 size-4" />
            Mark all read
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={notifications.length === 0}
              >
                <Trash2 className="mr-2 size-4" />
                Clear all
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all notifications?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently deletes your notification history. The
                  requests and appointments they refer to are not affected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => void clearAll()}>
                  Clear all
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      }
    >
      <Card className="min-w-0 overflow-hidden p-0">
        {isLoading && notifications.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading notifications…
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <p className="text-sm font-medium text-destructive">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                void fetchNotifications({
                  page: 1,
                  pageSize: PAGE_SIZE,
                  unreadOnly: filter === "unread",
                })
              }
            >
              Try again
            </Button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Bell className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">
              {filter === "unread"
                ? "No unread notifications"
                : "Nothing here yet"}
            </p>
            <p className="max-w-sm text-xs text-muted-foreground">
              {filter === "unread"
                ? "You've read everything. Switch to All to see your history."
                : "When a request is reviewed or an appointment is confirmed, you'll see it here."}
            </p>
          </div>
        ) : (
          <div className="min-w-0">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onSelect={handleSelect}
                onDelete={(id) => void removeNotification(id)}
              />
            ))}

            {pagination?.hasNextPage && (
              <div className="flex justify-center border-t border-border/50 p-3">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isLoadingMore}
                  onClick={handleLoadMore}
                >
                  {isLoadingMore && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  Load more
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </PageLayout>
  );
}
