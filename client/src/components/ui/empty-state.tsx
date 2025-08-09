import { ReactNode } from "react";
import { Button } from "./button";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
}

/**
 * EmptyState component for displaying helpful empty states with optional actions.
 * Provides consistent styling and messaging when no data is available.
 */
export function EmptyState({ icon, title, description, action, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className="mb-4 text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-muted max-w-sm mb-6">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
      {children}
    </div>
  );
}