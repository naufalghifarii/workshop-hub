import { cn } from '@/lib/utils';
import { Button } from './button';
import { LucideIcon, Plus } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
}

export const PageHeader = ({
  title,
  description,
  icon: Icon,
  action,
  className,
}: PageHeaderProps) => {
  const ActionIcon = action?.icon || Plus;

  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8', className)}>
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground">
            <Icon className="w-6 h-6" />
          </div>
        )}
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>
      {action && (
        <Button onClick={action.onClick} className="gap-2">
          <ActionIcon className="w-4 h-4" />
          {action.label}
        </Button>
      )}
    </div>
  );
};
