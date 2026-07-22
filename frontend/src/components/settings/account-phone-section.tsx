"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { Phone } from "lucide-react";

import { PhoneNumberInput } from "@/components/forms/phone-number-input";
import { LoadingButton } from "@/components/forms/loading-button";
import { Label } from "@/components/ui/label";
import { updateProfile, type UserMe } from "@/lib/api/users";
import {
  formatPhoneNumber,
  isValidPhoneInput,
  normalizeStoredPhone,
  parseStoredPhone,
} from "@/lib/phone-countries";
import { validationMessages } from "@/schemas/shared";

type AccountPhoneSectionProps = {
  profile: UserMe | null;
  onProfileUpdated: (user: UserMe) => void;
};

function phoneFieldsFromProfile(phone: string | null | undefined): {
  phoneCountryCode: string;
  phoneNumber: string;
} {
  const parsed = parseStoredPhone(normalizeStoredPhone(phone));
  if (parsed) {
    return {
      phoneCountryCode: parsed.isoCode,
      phoneNumber: parsed.localNumber,
    };
  }
  return {
    phoneCountryCode: "",
    phoneNumber: "",
  };
}

export function AccountPhoneSection({
  profile,
  onProfileUpdated,
}: AccountPhoneSectionProps) {
  const { data: session } = useSession();
  const [phoneCountryCode, setPhoneCountryCode] = React.useState("");
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [countryError, setCountryError] = React.useState<string | null>(null);
  const [numberError, setNumberError] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const next = phoneFieldsFromProfile(profile?.phone);
    setPhoneCountryCode(next.phoneCountryCode);
    setPhoneNumber(next.phoneNumber);
  }, [profile?.phone]);

  const currentPhone = normalizeStoredPhone(profile?.phone);
  const formattedNext = React.useMemo(() => {
    if (!isValidPhoneInput(phoneCountryCode, phoneNumber)) return "";
    try {
      return formatPhoneNumber(phoneCountryCode, phoneNumber);
    } catch {
      return "";
    }
  }, [phoneCountryCode, phoneNumber]);

  const isDirty =
    formattedNext.length > 0 && formattedNext !== currentPhone;

  function validateFields(): boolean {
    setCountryError(null);
    setNumberError(null);

    let valid = true;
    if (phoneCountryCode.length !== 2) {
      setCountryError(validationMessages.required);
      valid = false;
    }
    const digits = phoneNumber.replace(/\D/g, "");
    if (digits.length < 6 || digits.length > 15) {
      setNumberError(validationMessages.invalidPhone);
      valid = false;
    }
    return valid;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const token = session?.accessToken;
    if (!token) {
      setError("You must be signed in to update your phone number.");
      return;
    }
    if (!validateFields()) {
      return;
    }
    if (!isDirty) {
      setSuccess("Phone number is already up to date.");
      return;
    }

    setLoading(true);
    try {
      const phone = formatPhoneNumber(phoneCountryCode, phoneNumber);
      const result = await updateProfile(token, { phone });
      if (!result.ok) {
        setError(result.message);
        setLoading(false);
        return;
      }
      onProfileUpdated(result.user);
      const saved = phoneFieldsFromProfile(result.user.phone);
      setPhoneCountryCode(saved.phoneCountryCode);
      setPhoneNumber(saved.phoneNumber);
      setSuccess("Phone number updated.");
      setLoading(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
      setLoading(false);
    }
  }

  return (
    <section
      className="portal-dashboard-panel"
      aria-labelledby="account-phone-heading"
    >
      <div className="portal-dashboard-panel-header">
        <div className="flex items-start gap-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground"
            aria-hidden
          >
            <Phone className="size-5" />
          </div>
          <div className="min-w-0 space-y-1">
            <h2
              id="account-phone-heading"
              className="portal-dashboard-panel-title"
            >
              Phone number
            </h2>
            <p className="text-sm text-muted-foreground">
              Used so we can contact you if needed. This is saved on your
              account, not in Job Specs.
            </p>
          </div>
        </div>
      </div>

      <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
        <div className="space-y-2">
          <Label htmlFor="settings-phone-number">Phone number</Label>
          <PhoneNumberInput
            idPrefix="settings-phone"
            phoneCountryCode={phoneCountryCode}
            phoneNumber={phoneNumber}
            onPhoneCountryCodeChange={setPhoneCountryCode}
            onPhoneNumberChange={setPhoneNumber}
            disabled={loading || !profile}
            countryInvalid={Boolean(countryError)}
            numberInvalid={Boolean(numberError)}
          />
          {countryError ? (
            <p className="text-sm text-destructive" role="alert">
              {countryError}
            </p>
          ) : null}
          {numberError ? (
            <p className="text-sm text-destructive" role="alert">
              {numberError}
            </p>
          ) : null}
          {currentPhone ? (
            <p className="text-xs text-muted-foreground">
              Current saved number: {currentPhone}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              No phone number saved yet.
            </p>
          )}
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {success ? (
          <p
            className="text-sm text-emerald-600 dark:text-emerald-400"
            role="status"
          >
            {success}
          </p>
        ) : null}

        <LoadingButton
          type="submit"
          loading={loading}
          loadingText="Saving…"
          disabled={!profile || !isDirty}
        >
          Save phone number
        </LoadingButton>
      </form>
    </section>
  );
}
