module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/setupTests.ts"],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^~/(.*)$": "<rootDir>/$1",
    "^@repo/errors$": "<rootDir>/../../packages/errors/src/index.ts",
    "^@repo/supabase/(.*)$": "<rootDir>/../../packages/supabase/src/$1",
    "^@repo/supabase$": "<rootDir>/../../packages/supabase/src/index.ts",
    "^@repo/redis$": "<rootDir>/../../packages/redis/src/index.ts",
    "^@repo/redis/(.*)$": "<rootDir>/../../packages/redis/src/$1",
    "^@repo/theme/(.*)$": "<rootDir>/../../packages/theme/$1",
    "^@repo/ui/lib/(.*)$": "<rootDir>/../../packages/ui/src/lib/$1",
    "^@repo/ui/GlassCard$":
      "<rootDir>/../../packages/ui/src/components/GlassCard.tsx",
    "^@repo/ui/SecondaryButton$":
      "<rootDir>/../../packages/ui/src/components/SecondaryButton.tsx",
    "^@repo/ui/ShiftToggle$":
      "<rootDir>/../../packages/ui/src/components/ShiftToggle.tsx",
    "^@repo/ui/Input$": "<rootDir>/../../packages/ui/src/components/Input.tsx",
    "^@repo/ui/FormFields$":
      "<rootDir>/../../packages/ui/src/components/FormFields.tsx",
    "^@repo/ui/DepartmentLayout$":
      "<rootDir>/../../packages/ui/src/components/DepartmentLayout.tsx",
    "^@repo/ui/KPI$": "<rootDir>/../../packages/ui/src/components/KPI.tsx",
    "^@repo/ui/PageHeader$":
      "<rootDir>/../../packages/ui/src/components/PageHeader.tsx",
    "^@repo/ui/MacMenuBar$":
      "<rootDir>/../../packages/ui/src/components/MacMenuBar.tsx",
    "^@repo/ui/MacTitleBar$":
      "<rootDir>/../../packages/ui/src/components/MacTitleBar.tsx",
    "^@repo/utils$": "<rootDir>/../../packages/utils/src/index.ts",
    "^@repo/ui/DataGrid$":
      "<rootDir>/../../packages/ui/src/components/ui/data-grid.tsx",
  },
  collectCoverageFrom: [
    "lib/**/*.{ts,tsx}",
    "features/**/*.{ts,tsx}",
    "app/**/*.{ts,tsx}",
    "middleware.ts",
    "!**/*.test.{ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
  ],
  coverageReporters: ["text", "lcov", "html"],
  coverageThreshold: {
    global: {
      lines: 40, // Phase 1 target — raise to 60% by end of Phase 1, 80% by Phase 4
      branches: 30,
      functions: 35,
      statements: 40,
    },
  },
};
