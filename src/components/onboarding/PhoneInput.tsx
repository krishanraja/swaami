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
        const displayDigits = "0" + localDigits;
        setDisplayValue(formatAustralianPhone(displayDigits));
      } else {
        setDisplayValue(formatUSPhone(localDigits));
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
      const formatted = formatAustralianPhone(digits);
      setDisplayValue(formatted);
      
      // Convert to E.164: 04XXXXXXXX -> +614XXXXXXXX
      if (digits.startsWith("0") && digits.length >= 2) {
        const e164 = `+61${digits.slice(1)}`;
        onChange(e164);
      } else if (digits.length >= 1) {
        onChange(`+61${digits}`);
      } else {
        onChange("");
      }
    } else {
      // US format: display as (XXX) XXX-XXXX, store as +1XXXXXXXXXX
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
