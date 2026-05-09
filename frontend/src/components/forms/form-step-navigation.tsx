import { Button } from "@/components/ui/button";

import { SubmitButton } from "./submit-button";

type FormStepNavigationProps = {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  isNextDisabled?: boolean;
  isSubmitting?: boolean;
};

export function FormStepNavigation({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  isNextDisabled,
  isSubmitting,
}: FormStepNavigationProps) {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="rounded-xl border bg-card p-4 sm:p-5">
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isFirstStep || isSubmitting}
          className="w-full sm:w-auto"
        >
          Back
        </Button>
        {isLastStep ? (
          <SubmitButton
            loading={isSubmitting}
            loadingText="Submitting..."
            size="lg"
            className="w-full sm:w-auto"
          >
            Save Job Search Specifications
          </SubmitButton>
        ) : (
          <Button
            type="button"
            onClick={onNext}
            disabled={isNextDisabled || isSubmitting}
            className="w-full sm:w-auto"
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
