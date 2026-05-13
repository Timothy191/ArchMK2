import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        launchOptions: { executablePath: "/usr/bin/google-chrome" },
      },
    },
  ],
  use: { baseURL: "http://localhost:3000" }, // For frontend
});
