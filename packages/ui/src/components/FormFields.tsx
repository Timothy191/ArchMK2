import { cn } from "../lib/utils";

const inputStyles =
  "w-full bg-[var(--card)] border border-[var(--border-default)] rounded-lg px-3 py-2.5 text-[var(--text-heading)] text-sm focus:outline-none focus:border-[var(--accent-cyan)] transition-colors";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  optional?: boolean;
}

export function FormInput({
  label,
  error,
  optional,
  className,
  ...props
}: FormInputProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm text-[var(--text-secondary)]">
        {label}
        {optional && <span className="text-[var(--text-muted)]"> (Optional)</span>}
        {!optional && props.required && (
          <span className="text-red-400"> *</span>
        )}
      </label>
      <input className={cn(inputStyles, className)} {...props} />
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}

interface FormSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  optional?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function FormSelect({
  label,
  error,
  optional,
  options,
  placeholder = "Select...",
  className,
  ...props
}: FormSelectProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm text-[var(--text-secondary)]">
        {label}
        {optional && <span className="text-[var(--text-muted)]"> (Optional)</span>}
      </label>
      <select className={cn(inputStyles, className)} {...props}>
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}

interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  optional?: boolean;
}

export function FormTextarea({
  label,
  error,
  optional,
  className,
  ...props
}: FormTextareaProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm text-[var(--text-secondary)]">
        {label}
        {optional && <span className="text-[var(--text-muted)]"> (Optional)</span>}
      </label>
      <textarea
        className={cn(inputStyles, "resize-none", className)}
        {...props}
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}

interface SubmitButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export function SubmitButton({
  loading,
  children,
  className,
  ...props
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading || props.disabled}
      className={cn(
        "bg-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/90 disabled:bg-[var(--bg-tertiary)] disabled:text-[var(--text-muted)]",
        "text-[var(--bg-secondary)] font-medium py-2.5 px-6 rounded-lg transition-colors",
        className,
      )}
      {...props}
    >
      {loading ? "Saving..." : children}
    </button>
  );
}