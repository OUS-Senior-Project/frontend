import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export function MigrationFlowEmptyState() {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-foreground">
          Major Migration Flow
        </CardTitle>
        <p className="text-xs text-muted-foreground">Student movement between majors</p>
      </CardHeader>
      <CardContent>
        <div className="flex h-[400px] items-center justify-center text-muted-foreground">
          No migration data available for the selected semester.
        </div>
      </CardContent>
    </Card>
  );
}
