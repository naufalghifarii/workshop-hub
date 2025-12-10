import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  iconClassName?: string;
}

export const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  className,
  iconClassName,
}: StatCardProps) => {
  return (
    <div className={cn(
      'relative overflow-hidden rounded-xl bg-card p-6 shadow-sm border transition-all duration-300 hover:shadow-md',
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-display font-bold">{value}</p>
          {trend && (
            <p className={cn(
              'text-sm font-medium',
              trend.isPositive ? 'text-success' : 'text-destructive'
            )}>
              {trend.isPositive ? '+' : ''}{trend.value}%
              <span className="text-muted-foreground ml-1">dari bulan lalu</span>
            </p>
          )}
        </div>
        <div className={cn(
          'flex items-center justify-center w-12 h-12 rounded-xl',
          iconClassName || 'bg-primary/10 text-primary'
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-gradient-to-br from-primary/5 to-transparent" />
    </div>
  );
};
