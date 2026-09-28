import { forwardRef } from "react";
import { cn } from "@/lib/cn";
import Icon from "./Icon";
import Spinner from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "link";
export type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary:   "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-surface text-foreground border border-border hover:bg-subtle",
  ghost:     "text-muted hover:text-foreground hover:bg-subtle",
  danger:    "bg-danger text-white hover:bg-danger/90 dark:text-background",
  link:      "text-accent hover:underline underline-offset-4 !px-0 !h-auto",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-md",
  md: "h-9 px-3.5 text-sm gap-2 rounded-lg",
  lg: "h-11 px-5 text-sm gap-2 rounded-lg",
};

const iconSizes: Record<ButtonSize, number> = { sm: 16, md: 18, lg: 18 };

interface StyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

/** Button classes, for styling a <Link> or <a> as a button. */
export function buttonClasses({ variant = "secondary", size = "md", fullWidth, className }: StyleOptions = {}) {
  return cn(
    "inline-flex items-center justify-center font-medium whitespace-nowrap select-none transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:opacity-50 disabled:pointer-events-none",
    variants[variant],
    sizes[size],
    fullWidth && "w-full",
    className,
  );
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, StyleOptions {
  /** Material symbol shown before the label. */
  icon?: string;
  /** Material symbol shown after the label. */
  iconRight?: string;
  loading?: boolean;
  /** Hide the label below the sm breakpoint, leaving only the icon. */
  collapseLabel?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size = "md", fullWidth, className, icon, iconRight, loading, collapseLabel, disabled, children, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...rest}
    >
      {loading ? <Spinner /> : icon && <Icon name={icon} size={iconSizes[size]} />}
      {children && <span className={cn(collapseLabel && "hidden sm:inline")}>{children}</span>}
      {iconRight && !loading && <Icon name={iconRight} size={iconSizes[size]} />}
    </button>
  );
});

export default Button;

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  /** Required: an icon-only button needs an accessible name. */
  label: string;
  size?: "sm" | "md";
  tone?: "default" | "danger";
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, label, size = "md", tone = "default", className, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-muted transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:opacity-40 disabled:pointer-events-none",
        tone === "danger" ? "hover:text-danger hover:bg-danger/10" : "hover:text-foreground hover:bg-subtle",
        size === "sm" ? "h-7 w-7" : "h-9 w-9",
        className,
      )}
      {...rest}
    >
      <Icon name={icon} size={size === "sm" ? 16 : 18} />
    </button>
  );
});
