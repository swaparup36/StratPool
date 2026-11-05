"use client";

import { useState, type FormEvent, type ReactNode } from "react";

type Props = { success: string; successClass: string; className?: string; children: ReactNode };

// Forms have no backend yet: this shows the success state only. See README → Forms.
export function DemoForm({ success, successClass, className, children }: Props) {
  const [done, setDone] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setDone(true);
  }

  if (done) {
    return (
      <p role="status" className={successClass}>
        {success}
      </p>
    );
  }
  return (
    <form className={className} onSubmit={handleSubmit}>
      {children}
    </form>
  );
}
