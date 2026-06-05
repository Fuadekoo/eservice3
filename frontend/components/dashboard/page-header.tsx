import type { ReactNode, ElementType } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  icon?: ElementType;
};

export function PageHeader({ title, description, actions, icon: Icon }: PageHeaderProps) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 items-start gap-3 sm:items-center">
        {Icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-10 sm:w-10">
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl md:text-2xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

