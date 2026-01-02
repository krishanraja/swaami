import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { City, CITY_CONFIG } from "@/hooks/useNeighbourhoods";

interface PhoneInputProps {
  city: City;
  value: string;
  onChange: (phone: string) => void;
  disabled?: boolean;
}

function formatAustralianPhone(digits: string): string {
  // Format: 04XX XXX XXX
  const cleaned = digits.replace(/\D/g, "").slice(0, 10);
  if (cleaned.length <= 4) return cleaned;
  if (cleaned.length <= 7) return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
  return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
}

function formatUSPhone(digits: string): string {
  // Format: (XXX) XXX-XXXX
  const cleaned = digits.replace(/\D/g, "").slice(0, 10);
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
}

export function PhoneInput({ city, value, onChange, disabled }: PhoneInputProps) {
  const config = CITY_CONFIG[city];
  const [displayValue, setDisplayValue] = useState("");

  // Extract digits from stored E.164 format
  useEffect(() => {
    if (value.startsWith(config.phonePrefix)) {
      const localDigits = value.slice(config.phonePrefix.length);
      if (city === "sydney") {
        // For AU, we store +614XXXXXXXX but display 04XX XXX XXX
        // Only format when we have complete digits (9 digits for AU)
        // Don't prepend "0" if localDigits is empty to prevent auto-insert UX issue
        if (localDigits.length === 0) {
          setDisplayValue("");
        } else if (localDigits.length >= 9) {
          // Only format when we have complete number (9 digits after +61)
          const displayDigits = "0" + localDigits;
          setDisplayValue(formatAustralianPhone(displayDigits));
        } else {
          // For partial input, show digits without formatting to avoid "0" appearing
          // User is still typing, so we'll let handleChange manage the display
          // This prevents the annoying auto-insert "0" when field is empty or partially filled
          setDisplayValue(localDigits);
        }
      } else {
        // US format: only format when we have complete digits (10 digits)
        if (localDigits.length >= 10) {
          setDisplayValue(formatUSPhone(localDigits));
        } else if (localDigits.length > 0) {
          setDisplayValue(localDigits);
        } else {
          setDisplayValue("");
        }
      }
    } else {
      setDisplayValue("");
    }
  }, [value, city, config.phonePrefix]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    const digits = rawInput.replace(/\D/g, "");

    if (city === "sydney") {
      // Australian format: display as 04XX XXX XXX, store as +614XXXXXXXX
      // Only format when we have enough digits to avoid premature "0" insertion
      if (digits.length === 0) {
        setDisplayValue("");
        onChange("");
        return;
      }
      
      // Format display value - show formatting as user types
      const formatted = formatAustralianPhone(digits);
      setDisplayValue(formatted);
      
      // Convert to E.164: 04XXXXXXXX -> +614XXXXXXXX
      // Handle both cases: user types with or without leading "0"
      if (digits.startsWith("0") && digits.length >= 2) {
        // User typed with leading 0: 04XXXXXXXX -> +614XXXXXXXX
        const e164 = `+61${digits.slice(1)}`;
        onChange(e164);
      } else if (digits.length >= 1) {
        // User typing without leading 0: 4XXXXXXXX -> +614XXXXXXXX
        onChange(`+61${digits}`);
      } else {
        onChange("");
      }
    } else {
      // US format: display as (XXX) XXX-XXXX, store as +1XXXXXXXXXX
      if (digits.length === 0) {
        setDisplayValue("");
        onChange("");
        return;
      }
      
      // Format display value
      const formatted = formatUSPhone(digits);
      setDisplayValue(formatted);
      
      if (digits.length >= 1) {
        onChange(`+1${digits}`);
      } else {
        onChange("");
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm font-medium shrink-0">
          <span>{config.flag}</span>
          <span>{config.phonePrefix}</span>
        </div>
        <Input
          type="tel"
          placeholder={config.phoneFormat}
          value={displayValue}
          onChange={handleChange}
          disabled={disabled}
          className="text-lg h-12 flex-1"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        We'll send a verification code to this number
      </p>
    </div>
  );
}

export function isValidPhone(phone: string, city: City): boolean {
  if (city === "sydney") {
    // +61 + 9 digits (e.g., +614XXXXXXXX)
    return /^\+61[0-9]{9}$/.test(phone);
  } else {
    // +1 + 10 digits
    return /^\+1[0-9]{10}$/.test(phone);
  }
}
