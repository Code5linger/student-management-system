import { Badge, type BadgeProps } from '@/components/ui/badge';

const STATUS_VARIANTS: Record<string, BadgeProps['variant']> = {
  ENROLLED: 'default',
  DEFERRED: 'gold',
  WITHDRAWN: 'destructiveSoft',
  COMPLETED: 'secondary',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={STATUS_VARIANTS[status] ?? 'secondary'}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  );
}

const CLASSIFICATION_VARIANTS: Record<string, BadgeProps['variant']> = {
  Distinction: 'default',
  Merit: 'gold',
  Pass: 'secondary',
  Fail: 'destructiveSoft',
};

export function ClassificationBadge({
  classification,
}: {
  classification: string;
}) {
  return (
    <Badge variant={CLASSIFICATION_VARIANTS[classification] ?? 'secondary'}>
      {classification}
    </Badge>
  );
}

export function OverdueBadge() {
  return <Badge variant="destructive">Overdue</Badge>;
}

export function LateBadge() {
  return <Badge variant="goldSoft">Late</Badge>;
}
