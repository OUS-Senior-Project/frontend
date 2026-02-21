import { AlertTriangle } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Spinner } from '@/shared/ui/spinner';

interface PanelLoadingStateProps {
  message: string;
}

export function PanelLoadingState({ message }: PanelLoadingStateProps) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="flex h-[320px] items-center justify-center">
        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="h-4 w-4" />
          {message}
        </span>
      </CardContent>
    </Card>
  );
}

interface PanelProcessingStateProps {
  message?: string;
  status?: string | null;
  onRefresh: () => void;
}

export function PanelProcessingState({
  message = 'Dataset processing is in progress. Analytics will refresh automatically when ready.',
  status,
  onRefresh,
}: PanelProcessingStateProps) {
  const statusLabel = status ? `Current status: ${status}.` : null;

  return (
    <Card className="border-border bg-card">
      <CardContent className="flex h-[320px] flex-col items-center justify-center gap-3 text-center">
        <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="h-4 w-4" />
          {message}
        </p>
        {statusLabel && <p className="text-xs text-muted-foreground">{statusLabel}</p>}
        <Button
          variant="outline"
          className="cursor-pointer bg-transparent"
          onClick={onRefresh}
        >
          Refresh status
        </Button>
      </CardContent>
    </Card>
  );
}

interface PanelErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function PanelErrorState({ message, onRetry }: PanelErrorStateProps) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="flex h-[320px] flex-col items-center justify-center gap-3 text-center">
        <p className="inline-flex items-center gap-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" />
          {message}
        </p>
        <Button
          variant="outline"
          className="cursor-pointer bg-transparent"
          onClick={onRetry}
        >
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}

interface PanelFailedStateProps {
  message: string;
  onRefresh: () => void;
}

export function PanelFailedState({ message, onRefresh }: PanelFailedStateProps) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="flex h-[320px] flex-col items-center justify-center gap-3 text-center">
        <p className="inline-flex items-center gap-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" />
          {message}
        </p>
        <p className="text-xs text-muted-foreground">
          Upload a new dataset from the Overview tab, then refresh status.
        </p>
        <Button
          variant="outline"
          className="cursor-pointer bg-transparent"
          onClick={onRefresh}
        >
          Refresh status
        </Button>
      </CardContent>
    </Card>
  );
}

interface PanelEmptyStateProps {
  title: string;
  description: string;
}

export function PanelEmptyState({ title, description }: PanelEmptyStateProps) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="flex h-[320px] flex-col items-center justify-center text-center">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
