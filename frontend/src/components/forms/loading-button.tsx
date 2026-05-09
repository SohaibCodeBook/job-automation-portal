import * as React from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type LoadingButtonProps = React.ComponentProps<typeof Button> & {
  loading?: boolean;
  loadingText?: string;
};

export function LoadingButton({
  loading,
  loadingText = "Loading...",
  children,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <Button disabled={disabled || loading} {...props}>
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
