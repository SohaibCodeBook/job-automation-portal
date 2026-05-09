import * as React from "react";

import { LoadingButton } from "./loading-button";

type SubmitButtonProps = Omit<React.ComponentProps<typeof LoadingButton>, "type">;

export function SubmitButton(props: SubmitButtonProps) {
  return <LoadingButton type="submit" {...props} />;
}
