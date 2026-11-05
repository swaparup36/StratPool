"use client";

import { useEffect, useState } from "react";
import { Icon, type IconName } from "./icon";

const options: { value: string; icon: IconName }[] = [
  { value: "system", icon: "monitor" },
  { value: "light", icon: "sun" },
  { value: "dark", icon: "moon" },
];

export function ThemeSwitch() {
  const [theme, setTheme] = useState("system");

  // The inline script in app/layout.tsx has already applied any saved theme.
  useEffect(() => {
    setTheme(document.documentElement.getAttribute("data-theme") ?? "system");
  }, []);

  function choose(value: string) {
    setTheme(value);
    // "system" clears the override so the OS preference applies.
    if (value === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", value);
    try {
      if (value === "system") localStorage.removeItem("theme");
      else localStorage.setItem("theme", value);
    } catch {
      // Storage blocked: the theme just won't persist.
    }
  }

  return (
    <div className="flex items-center text-sm text-subtle">
      <span className="sr-only" id="theme-label">
        Appearance
      </span>
      <div className="flex rounded-full border p-[3px]" role="group" aria-labelledby="theme-label">
        {options.map(({ value, icon }) => (
          <button
            key={value}
            className="grid size-7 place-items-center rounded-full aria-pressed:bg-surface-3 aria-pressed:text-fg"
            type="button"
            aria-label={`Use ${value} theme`}
            aria-pressed={theme === value}
            onClick={() => choose(value)}
          >
            <Icon name={icon} />
          </button>
        ))}
      </div>
    </div>
  );
}
