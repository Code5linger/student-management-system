import * as React from 'react';
import { cn } from '@/lib/utils';

const Table = React.forwardRef<HTMLTableElement, React.ComponentProps<'table'>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto rounded-sm border border-border">
      <table
        ref={ref}
        className={cn('w-full text-sm caption-bottom', className)}
        {...props}
      />
    </div>
  ),
);
Table.displayName = 'Table';

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.ComponentProps<'thead'>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      'bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground',
      className,
    )}
    {...props}
  />
));
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.ComponentProps<'tbody'>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('divide-y divide-border', className)}
    {...props}
  />
));
TableBody.displayName = 'TableBody';

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.ComponentProps<'tr'>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn('hover:bg-accent/50 transition-colors', className)}
    {...props}
  />
));
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ComponentProps<'th'>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn('px-4 py-3 text-left align-middle font-medium', className)}
    {...props}
  />
));
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.ComponentProps<'td'>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn('px-4 py-3 align-middle', className)}
    {...props}
  />
));
TableCell.displayName = 'TableCell';

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
