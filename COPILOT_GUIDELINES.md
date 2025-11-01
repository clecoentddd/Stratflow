# 🧭 Copilot Guidelines — Vertical Slice, CQRS, Event Sourcing, Next.js, and Clean Architecture

This document defines how GitHub Copilot should assist in generating and refactoring code in this project.

---

## 🧩 Architecture Principles

- Follow **Vertical Slice Architecture** — each slice is self-contained and owns:
  - Commands
  - Events
  - Projections
  - Domain models
  - Tests
- UI **always reads from projections**, never from aggregates or command handlers.
- **Never mix reads and writes** inside a slice.
- **Projections are mono-purpose** — built only for a specific use case.
- Do **not** optimize or generalize projections.
- Each slice is isolated; it can only depend on `app/api` infrastructure.
- It’s acceptable to modify **two slices** at once when a feature crosses boundaries.
- Do not create coupling between slices
- Do not create fallback alternative solutions: if data is empty in a projection, assume if it is empty. 
- Projections will have a rebuild mecanism  user can access from the monitoring page.

---

## UI
- Use .css, not tailwind. Use meaningful names like .initiativeName 

## ⚙️ Next.js Best Practices

- Use **App Router** (Next.js 13+).
- Treat **Server Actions as Commands**:
  - They emit domain events.
  - They do not return aggregates or raw DB entities.
- **React Server Components** should read from projections only.
- Keep UI components **pure and stateless** — no domain logic in React code.
- All domain logic (command handling, projections, events) lives inside slices.
- Use **TypeScript strictly** — types are defined in each slice’s `/domain` folder.
- Avoid importing database logic or ORMs in UI components or pages.
- Use repository abstractions (interfaces) to separate domain from infrastructure.

---

## 🗄️ Persistence Ignorance

- The domain layer must be **database-agnostic**.
- No direct use of database clients, ORM models, or SQL inside domain or command handlers.
- Define interfaces such as:
  - `EventStore`
  - `ProjectionRepository`
  - `CommandBus`
- Actual implementations live in the `app/api` or `infra` folders.
- The goal is to be able to **switch databases** (PostgreSQL, MongoDB, DynamoDB, etc.) without changing domain logic.

---

## 🧼 Clean Code & Maintainability

- Apply **SOLID principles** within each slice:
  - **Single Responsibility** — one concern per module or function.
  - **Open/Closed** — add behavior through new handlers/events, not by modifying core logic.
  - **Liskov Substitution** — keep contracts clear and consistent.
  - **Interface Segregation** — small, focused abstractions.
  - **Dependency Inversion** — depend on abstractions, not concrete implementations.
- Always define **clear input/output types** — avoid implicit or global state.
- Prefer **composition over inheritance**.
- Maintain **consistent naming** conventions:
  - Commands: `*Command`
  - Events: `*Event`
  - Projections: `*Projection`
  - Domain types: `*Model`, `*Aggregate`
- Avoid cross-slice imports (except infrastructure-level dependencies).
- Write **unit tests** for command handlers, event handlers, and projections.
- Slices should be **independently testable** (no DB connection required).
- Keep functions small and expressive; extract helpers when needed.

---

## 🧪 Testing & Observability

- Each slice should include:
  - Command handler tests (validate emitted events)
  - Projection tests (validate read models)
  - Event replay tests (ensure projection rebuilds are deterministic)
- Avoid mocking between slices — use real events for integration tests.
- Log domain events and projection rebuild steps with enough metadata to debug.
- Enable replay and auditing features for observability.

---

## 🚦 Collaboration Rules

- When implementing a cross-slice feature, it’s allowed to modify **two slices simultaneously**.
- Discuss and document boundary changes in merge requests.
- Keep slice responsibilities clear and narrow.
