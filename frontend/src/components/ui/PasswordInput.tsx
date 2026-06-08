"use client";

import { useState } from "react";

interface PasswordInputProps {
  id?: string;
  required?: boolean;
  minLength?: number;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export default function PasswordInput({ id, required, minLength, value, onChange, placeholder }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? "text" : "password"}
        required={required}
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 pr-11 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25
                   focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
      >
        <span className="material-symbols-rounded" style={{ fontSize: 20 }}>
          {visible ? "visibility_off" : "visibility"}
        </span>
      </button>
    </div>
  );
}
