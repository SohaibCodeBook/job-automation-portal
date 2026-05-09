import { Input } from "@/components/ui/input";

import { FormFieldWrapper } from "./form-field-wrapper";

type SalaryRangeValue = {
  min?: number;
  max?: number;
};

type SalaryRangeInputProps = {
  id: string;
  label: string;
  required?: boolean;
  value: SalaryRangeValue;
  onChange: (nextValue: SalaryRangeValue) => void;
  description?: string;
  error?: string;
  disabled?: boolean;
  minPlaceholder?: string;
  maxPlaceholder?: string;
  className?: string;
};

export function SalaryRangeInput({
  id,
  label,
  required,
  value,
  onChange,
  description,
  error,
  disabled,
  minPlaceholder = "Minimum",
  maxPlaceholder = "Maximum",
  className,
}: SalaryRangeInputProps) {
  return (
    <FormFieldWrapper
      label={label}
      htmlFor={`${id}-min`}
      required={required}
      description={description}
      error={error}
      className={className}
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Input
          id={`${id}-min`}
          type="number"
          inputMode="numeric"
          placeholder={minPlaceholder}
          disabled={disabled}
          value={value.min ?? ""}
          aria-invalid={Boolean(error)}
          onChange={(event) =>
            onChange({
              ...value,
              min: event.target.value ? Number(event.target.value) : undefined,
            })
          }
        />
        <Input
          id={`${id}-max`}
          type="number"
          inputMode="numeric"
          placeholder={maxPlaceholder}
          disabled={disabled}
          value={value.max ?? ""}
          aria-invalid={Boolean(error)}
          onChange={(event) =>
            onChange({
              ...value,
              max: event.target.value ? Number(event.target.value) : undefined,
            })
          }
        />
      </div>
    </FormFieldWrapper>
  );
}

export type { SalaryRangeValue };
