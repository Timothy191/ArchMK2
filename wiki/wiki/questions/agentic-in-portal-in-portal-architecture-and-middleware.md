# Agentic in Portal in portal architecture and middleware

> seed-14 · depth 2

## Sources

- [Agentic-Config-Integration-Engine-Main-App](https://github.com/ARox2005/Agentic-Config-Integration-Engine-Main-App)

## Claims

- # Agentic Config Integration Engine Main App (React Test UI)

An enterprise-grade **design-time AI tool** (frontend tester). [^src-1]

- This is the user-facing test portal for the FinSpark architecture. [^src-2]
- It allows users to toggle integrations (e.g., KYC, GST) and simulate requests against the middleware gateway. [^src-3]
- Initialize environment variables (if deploying or running custom ports):
  - `VITE_MIDDLEWARE_URL=http://localhost:8002/api/gateway/execute`
  - `VITE_ORCHESTRATOR_RESET_URL=http://localhost:8003/api/orchestrator/reset-configs`

3. [^src-4]

- Opens at: **http://localhost:5173**

## Demo Walkthrough

### Flow B: Test the Integration

1. [^src-5]

- Open **http://localhost:5173** (Main App)

2. [^src-6]

- **Select a tenant** from the dropdown (must match the tenant used during Orchestrator deployment)

3. [^src-7]

- The request flows: Main App → Middleware (loads tenant-specific config) → Mock KYC API → response displayed

6. [^src-8]

## Open follow-ups

_Auto-extracted; review and prune._
