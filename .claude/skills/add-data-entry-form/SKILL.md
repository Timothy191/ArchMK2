---
name: add-data-entry-form
description: Scaffold a Supabase data entry form with validation, shift toggle, and dark theme styling
disable-model-invocation: true
---

# Add Data Entry Form Skill

## Purpose

Generate a client-side data entry form component that inserts records into Supabase, following Arch Systems patterns for state management, validation, styling, and shift handling.

## Process

### 1. Ask for form details

- **table** — Supabase table name (e.g. `operational_delays`)
- **fields** — List of fields with: name, type (`text` | `select` | `textarea` | `number` | `time` | `date` | `shift`), required (boolean), options (for select fields)
- **department** — Which department slug this form belongs to
- **include shift** — Should the form include a day/night shift toggle? (default: true for operational forms)
- **redirect after submit** — Stay on page or redirect? (default: stay, show success message)

### 2. Generate the form component

Create `apps/portal/app/(departments)/[department]/<tabName>/<FormName>Form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@repo/supabase/client";
import { useRouter } from "next/navigation";
import { GlassCard } from "@repo/ui/GlassCard";

// Auto-detect current shift
const getCurrentShift = (): "day" | "night" => {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? "day" : "night";
};

interface <FormName>FormProps {
  departmentId: string;
  departmentSlug: string;
  // Add select options as props (e.g. machines, operators)
}

export function <FormName>Form({
  departmentId,
  departmentSlug,
}: <FormName>FormProps) {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    // ... field initial values
  });

  const validate = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    // ... validation logic
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setError(Object.values(errors).join(", "));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from("<table>")
        .insert({
          department_id: departmentId,
          ...formData,
        });

      if (insertError) throw insertError;

      setStatus("success");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "success") {
    return (
      <GlassCard className="border-emerald-500/20">
        <p className="text-emerald-400 text-sm font-medium">
          Record submitted successfully
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-2 text-[#00c573] hover:underline text-sm"
        >
          Submit another
        </button>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Shift toggle (if included) */}
        <div className="flex gap-2">
          {(["day", "night"] as const).map((shift) => (
            <button
              key={shift}
              type="button"
              onClick={() => setFormData({ ...formData, shift: shift })}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                formData.shift === shift
                  ? "bg-[#3ecf8e] text-[#171717]"
                  : "bg-[#171717] text-[#898989] border border-[#363636]"
              }`}
            >
              {shift === "day" ? "Day Shift (06:00–18:00)" : "Night Shift (18:00–06:00)"}
            </button>
          ))}
        </div>

        {/* Form fields — generated based on field list */}
        {/* Text input pattern: */}
        <div>
          <label className="block text-sm text-[#b4b4b4] mb-1"><Label></label>
          <input
            type="text"
            value={formData.<field>}
            onChange={(e) => setFormData({ ...formData, <field>: e.target.value })}
            className="w-full bg-[#171717] border border-[#363636] rounded-lg px-3 py-2.5 text-[#fafafa] text-sm focus:outline-none focus:border-[#3ecf8e] transition-colors"
            required
          />
        </div>

        {/* Select pattern: */}
        <div>
          <label className="block text-sm text-[#b4b4b4] mb-1"><Label></label>
          <select
            value={formData.<field>}
            onChange={(e) => setFormData({ ...formData, <field>: e.target.value })}
            className="w-full bg-[#171717] border border-[#363636] rounded-lg px-3 py-2.5 text-[#fafafa] text-sm focus:outline-none focus:border-[#3ecf8e] transition-colors"
            required
          >
            <option value="">Select...</option>
            {/* options from props */}
          </select>
        </div>

        {/* Textarea pattern: */}
        <div>
          <label className="block text-sm text-[#b4b4b4] mb-1"><Label></label>
          <textarea
            value={formData.<field>}
            onChange={(e) => setFormData({ ...formData, <field>: e.target.value })}
            rows={3}
            className="w-full bg-[#171717] border border-[#363636] rounded-lg px-3 py-2.5 text-[#fafafa] text-sm focus:outline-none focus:border-[#3ecf8e] transition-colors resize-none"
          />
        </div>

        {/* Error display */}
        {error && <p className="text-red-400 text-sm">{error}</p>}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#3ecf8e] hover:bg-[#35b37d] disabled:bg-[#2e2e2e] disabled:text-[#898989] text-[#171717] font-medium py-2.5 px-6 rounded-lg transition-colors"
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </form>
    </GlassCard>
  );
}
```

### 3. Wire into the page component

In the corresponding `page.tsx`, import the form and pass required props:

```tsx
import { <FormName>Form } from "./<FormName>Form";

// ... inside the page component, after fetching data:
<<FormName>Form
  departmentId={deptId}
  departmentSlug={params.department}
  machines={machines || []}
/>
```

### 4. Verify

1. Navigate to the tab page in the browser
2. Test form submission with valid data
3. Test form validation with missing required fields
4. Test shift toggle (if included)
5. Commit changes

## Design System Reminders

- Input/select styling: `w-full bg-[#171717] border border-[#363636] rounded-lg px-3 py-2.5 text-[#fafafa] text-sm focus:outline-none focus:border-[#3ecf8e] transition-colors`
- Textarea adds: `resize-none`
- Submit button: `bg-[#3ecf8e] hover:bg-[#35b37d] disabled:bg-[#2e2e2e] disabled:text-[#898989] text-[#171717] font-medium py-2.5 px-6 rounded-lg transition-colors`
- Shift toggle active: `bg-[#3ecf8e] text-[#171717]`
- Shift toggle inactive: `bg-[#171717] text-[#898989] border border-[#363636]`
- Success card: `border-emerald-500/20` with `text-emerald-400`
- Error text: `text-red-400`
- NEVER use `font-bold` or `font-semibold` — use `font-medium`
- Import Supabase from `@repo/supabase/client` (browser) for forms
