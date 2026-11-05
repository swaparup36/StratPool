import type { ReactNode } from "react";
import { DemoForm } from "./demo-form";
import { Icon } from "./icon";
import { Logo } from "./ui";

const control = "block w-full bg-transparent p-4 placeholder:text-subtle focus-visible:-outline-offset-2";

export function AuthCard({
  title,
  intro,
  submit,
  success,
  children,
}: {
  title: string;
  intro?: ReactNode;
  submit: string;
  success: string;
  children: ReactNode;
}) {
  return (
    <section className="bg-grid grid min-h-[calc(100svh-230px)] place-items-center px-6 py-16">
      <div className="w-full max-w-[460px] overflow-hidden rounded-xl border bg-surface">
        <div className="px-8 pt-8 pb-6 text-center">
          <Logo />
          <h1 className="mt-4 text-[24px] tracking-[-.02em]">{title}</h1>
          {intro && <p className="mt-1 text-sm text-subtle [&_a]:text-accent [&_a]:underline">{intro}</p>}
        </div>
        <DemoForm successClass="border-t px-8 pt-6 pb-8 text-center text-muted" success={success}>
          <div className="grid border-t">{children}</div>
          <button
            className="flex h-14 w-full items-center justify-center gap-1.5 bg-accent text-on-accent transition-colors hover:bg-accent-hover"
            type="submit"
          >
            {submit} <Icon name="right" />
          </button>
        </DemoForm>
      </div>
    </section>
  );
}

export function Field({
  name,
  label,
  type = "text",
  autoComplete,
}: {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block border-b">
      <span className="sr-only">{label}</span>
      <input className={control} type={type} name={name} placeholder={label} autoComplete={autoComplete} required />
    </label>
  );
}

export function MessageField() {
  return (
    <label className="block border-b">
      <span className="sr-only">Message</span>
      <textarea className={`${control} min-h-28 resize-y`} name="message" placeholder="What would you like to see?" />
    </label>
  );
}

export function NameFields() {
  return (
    <div className="grid md:grid-cols-2 md:[&>*+*]:border-l">
      <Field name="first_name" label="First name" autoComplete="given-name" />
      <Field name="last_name" label="Last name" autoComplete="family-name" />
    </div>
  );
}

export function SourceField() {
  return (
    <label className="block border-b">
      <span className="sr-only">How did you hear about us?</span>
      <select className={`${control} invalid:text-subtle [&>option]:bg-surface`} name="source" required defaultValue="">
        <option value="" disabled>
          How did you hear about us?
        </option>
        <option>Search engine</option>
        <option>Social media</option>
        <option>A friend or colleague</option>
        <option>Other</option>
      </select>
    </label>
  );
}
