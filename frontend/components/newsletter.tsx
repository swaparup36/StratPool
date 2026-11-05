import { DemoForm } from "./demo-form";
import { buttonClass } from "./ui";

export function Newsletter() {
  return (
    <section className="border-y bg-surface-2" aria-labelledby="newsletter-title">
      <div className="page-container flex flex-wrap items-center justify-between gap-6 py-10">
        <div>
          <h2 id="newsletter-title" className="text-[24px] tracking-[-.02em]">
            Stay in the loop
          </h2>
          <p className="mt-1 text-subtle">Product updates and practical teamwork tips, once a month.</p>
        </div>
        <DemoForm
          className="flex w-full max-w-[420px] items-center rounded-full border bg-surface p-1 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent"
          successClass="text-muted"
          success="Thanks! You're on the list."
        >
          <label className="sr-only" htmlFor="newsletter-email">
            Email address
          </label>
          <input
            id="newsletter-email"
            className="min-w-0 flex-1 bg-transparent px-4 placeholder:text-subtle focus-visible:outline-none"
            type="email"
            name="email"
            placeholder="you@company.com"
            autoComplete="email"
            required
          />
          <button className={buttonClass("primary", "sm")} type="submit">
            Subscribe
          </button>
        </DemoForm>
      </div>
    </section>
  );
}
