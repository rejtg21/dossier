import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Not using Vitest globals, so RTL's automatic cleanup does not register.
afterEach(() => {
  cleanup();
});
