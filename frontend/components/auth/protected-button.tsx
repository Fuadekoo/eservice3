"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProtectedButtonProps extends React.ComponentProps<typeof Button> {
  requiredPermission?: string;
  requiredPermissions?: string[];
  requireAll?: boolean;
  tooltipMessage?: string;
}

/**
 * Button component that is disabled if user doesn't have required permissions
 */
export function ProtectedButton({
  requiredPermission,
  requiredPermissions,
  requireAll = false,
  children,
  disabled,
  tooltipMessage = "You do not have permission to perform this action",
  ...props
}: ProtectedButtonProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = usePermissions();

  if (isLoading) {
    return <Button {...props} disabled>{children}</Button>;
  }

  let hasAccess = true;

  if (requiredPermission) {
    hasAccess = hasPermission(requiredPermission);
  } else if (requiredPermissions) {
    hasAccess = requireAll
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);
  }

  const isDisabled = disabled || !hasAccess;

  if (isDisabled && !hasAccess) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-block">
              <Button {...props} disabled={true}>
                {children}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipMessage}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return <Button {...props} disabled={isDisabled}>{children}</Button>;
}

