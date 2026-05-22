import { Button } from "@/components/ui/button";

type JobListErrorProps = {
  message: string;
  onRetry?: () => void;
};

export function JobListError({ message, onRetry }: JobListErrorProps) {
  return (
    <div
      className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-center"
      role="alert"
    >
      <p className="text-sm text-destructive">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
