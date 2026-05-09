import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function JobSearchFormShell() {
  return (
    <Card className="w-full border-dashed">
      <CardHeader>
        <CardTitle>Job Search Form</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Form implementation is intentionally deferred. This shell preserves
          layout and architecture while the workflow fields are defined.
        </p>
      </CardContent>
    </Card>
  );
}
