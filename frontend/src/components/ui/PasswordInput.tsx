"use client";

import { useState } from "react";
import Input from "./Input";
import { IconButton } from "./Button";

interface PasswordInputProps {
  id?: string;
  required?: boolean;
  minLength?: number;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}

export default function PasswordInput({ id, required, minLength, value, onChange, placeholder, autoComplete }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      id={id}
      type={visible ? "text" : "password"}
      required={required}
      minLength={minLength}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      trailing={
        <IconButton
          icon={visible ? "visibility_off" : "visibility"}
          label={visible ? "Hide password" : "Show password"}
          size="sm"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
        />
      }
    />
  );
}
