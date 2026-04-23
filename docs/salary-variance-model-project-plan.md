# Project Plan: Salary Variance Forecast Model — Web Application

**Purpose of this document:** A practical build plan for converting the existing Excel-based Salary Variance Forecast Model into a web application using Claude Code. Written to be handed directly to Claude Code phase by phase.

**Companion document:** `svmp-field-specification.md` contains the complete field-by-field extract from the source workbook (`SVMP_2026.xlsx`), including exact formulas, cell references, and default values. That document is the authoritative reference for the calculation engine. This plan covers structure, sequencing, and build decisions; the field spec covers what each number actually is.

---

## 1. Project overview

**Problem.** Police department operating budgets are roughly 85–90% salary-driven. Routine workforce dynamics (vacancies, leave, recruitment delays, promotions, overtime backfill) produce predictable annual variances, but the magnitude of the surplus or pressure only becomes visible late in the fiscal year. This limits the ability of leadership and the Police Board to make informed mid-year decisions about reallocating projected surplus.

**What this app does.** Provides a structured, transparent framework to (a) forecast in-year salary variances early in the fiscal cycle, (b) track actuals against forecast over the course of the year, and (c) support governance decisions with auditable assumptions.

**Version 1 scope.** The four major recurring drivers:
1. Vacancies and hiring delays
2. Unplanned unpaid leaves and long absences
3. Planned leave coverage
4. Pay structure adjustments

---

## 2. Objectives and success criteria

The application is successful if:

1. **Calculation parity.** Every output matches the Excel model to within rounding for the same inputs. This is non-negotiable: credibility with the Police Board depends on it.
2. **Transparency.** Every number displayed is traceable to the assumptions behind it. No black-box outputs.
3. **Usability.** A finance analyst or deputy chief can operate it without training. No spreadsheet knowledge required.
4. **Iterative forecasting.** Users can update actuals month by month and see how the full-year forecast shifts.
5. **Professional presentation.** Design is clean and governance-appropriate, not marketing-flashy.

---

## 3. Confirmed decisions

All decisions below are locked in for V1. Changes require re-scoping.

| Decision | Answer |
|---|---|
| Deployment model | Static, client-side only |
| Data persistence | Browser local storage, plus JSON file save / load for portability |
| Multi-user access | Single user per browser |
| Sensitive data handling | On-device only |
| Hosting | Local only (dev server or static build served locally) |
| Target users | Reusable across Canadian police services |
| Scenario management | Single scenario in V1 |
| Excel import / export | Not included in V1 (manual re-entry is acceptable) |
| Rank / classification granularity | Single average salary and OT cost across all officers |
| Fiscal year | January through December |
| V1 timeline | ASAP — prototype-first mindset |

**Implication of "reusable across police services":** the app must not hardcode any department name, logo, branding, or default budget values specific to one service. The UI must be service-agnostic. Save / load of current state as a JSON file lets each service maintain their own configuration and swap between setups without losing work.

**Implication of "prototype ASAP":** favour working over polished. Ship a functional calculation engine, inputs, dashboard, and actuals tracking. Defer scenario comparison, Excel round-trip, by-rank breakdowns, and seasonality to V2.

---

## 4. Recommended tech stack

Chosen for: maturity, strong Claude Code support, clean UI out of the box, minimal operational burden.

- **Framework:** React with TypeScript, via Vite
- **Styling:** Tailwind CSS
- **Component library:** shadcn/ui (accessible, unstyled primitives you own the code for)
- **Charts:** Recharts
- **Forms and validation:** react-hook-form + Zod
- **State management:** Zustand (simple, minimal boilerplate) with persist middleware for local storage
- **Excel I/O:** SheetJS (`xlsx`)
- **Testing:** Vitest for calculation engine unit tests, Playwright for end-to-end if time allows
- **Tooling:** ESLint, Prettier, Git from day one

TypeScript is strongly recommended. The calculation engine is the core asset of this app, and typed inputs / outputs will prevent entire categories of silent bugs.

---

## 5. Application architecture

Keep the architecture deliberately layered so that calculations are testable in isolation from the UI.

```
┌────────────────────────────────────────────────┐
│   UI Layer (React components)                  │
│   - Input forms per driver                     │
│   - Dashboard / outputs                        │
│   - Scenario compare view                      │
└────────────────┬───────────────────────────────┘
                 │
┌────────────────▼───────────────────────────────┐
│   State Layer (Zustand store)                  │
│   - Scenarios, assumptions, actuals            │
│   - Persistence to local storage               │
└────────────────┬───────────────────────────────┘
                 │
┌────────────────▼───────────────────────────────┐
│   Calculation Engine (pure TypeScript)         │
│   - One module per driver                      │
│   - Composition layer aggregates totals        │
│   - No React, no DOM, no side effects          │
└────────────────┬───────────────────────────────┘
                 │
┌────────────────▼───────────────────────────────┐
│   Data I/O Layer                               │
│   - Excel import (SheetJS)                     │
│   - Excel export (SheetJS)                     │
│   - JSON scenario import / export              │
└────────────────────────────────────────────────┘
```

The key architectural principle: **the calculation engine is a pure library.** You should be able to import it into a Node script and run the full model without the UI. This makes testing against the Excel workbook trivial.

---

## 6. Data model

Simplified for single-scenario V1. The top-level container is `AppState` rather than `Scenario` since V1 holds one active configuration. JSON serialization of `AppState` is what enables portability across police services.

```typescript
type AppState = {
  version: string;                     // schema version for forward compat (e.g. "1.0")
  serviceName: string;                 // user-entered, displayed in header (e.g. "London Police Service")
  fiscalYear: number;                  // e.g. 2026
  assumptions: FiscalContext;
  drivers: {
    vacancies: VacancyDriverInputs;
    unplannedLeave: UnplannedLeaveDriverInputs;
    plannedLeave: PlannedLeaveDriverInputs;
    payAdjustments: PayAdjustmentInputs;
  };
  actuals: MonthlyActuals[];           // 12 entries, one per month, Jan through Dec
};

// Section 1 of field spec
type FiscalContext = {
  totalSalaryBudget: number;           // default 26,000,000
  numberOfOfficers: number;            // default 185
  avgAnnualSalary: number;             // default 140,000 (loaded with benefits)
  // Derived (not stored, computed at read time):
  //   avgMonthlySalary       = avgAnnualSalary / 12
  //   avgMonthlyOvertimeCost = (totalSalaryBudget − avgAnnualSalary × numberOfOfficers) / 12
};

// Section 2.1 of field spec
type VacancyDriverInputs = {
  frequencyPercent: number;            // default 0.03 (% of officer count)
  durationMonths: number;              // default 6
  backfillRate: number;                // default 0.40
};

// Section 2.2 of field spec
type UnplannedLeaveDriverInputs = {
  officersOnLeave: number;             // default 2 (absolute count)
  durationMonths: number;              // default 6
  backfillRate: number;                // default 0.70
  // salaryAvoidance: LOCKED at 0 — not user-editable in V1
};

// Section 2.3 of field spec
type PlannedLeaveDriverInputs = {
  // officersAffected: LOCKED to numberOfOfficers — not user-editable in V1
  durationMonthsPerOfficer: number;    // default 1.9
  backfillRate: number;                // default 0.05
  // salaryAvoidance: LOCKED at 0 — not user-editable in V1
};

// Section 3 of field spec
type PayAdjustmentInputs = {
  promotionsActingPayPressure: number; // default 20,000 (positive value; formula negates)
  stepProgressionImpact: number;       // default 10,000
  other: number;                       // default 5,000
};

// Section 7 of field spec
type MonthlyActuals = {
  month: number;                       // 1 through 12
  actualSalaryVariance: number | null; // null until user enters a value
};
```

**Notes:**
- `officersAffected` for planned leave is not stored — the calc engine reads it directly from `FiscalContext.numberOfOfficers`. This enforces the lock.
- `salaryAvoidance` for unplanned and planned leave is not represented as a field — the calc engine uses the literal value 0. If the lock is relaxed in a future version, these become fields with defaults of 0.
- `avgMonthlySalary` and `avgMonthlyOvertimeCost` are not stored. They are computed at read time from `FiscalContext`. A small derived-values helper function exposes them.
- `version` allows the JSON save/load format to evolve without breaking older saved files.

---

## 7. Calculation engine: formulas

These formulas are pulled directly from `SVMP_2026.xlsx`. The calc engine must reproduce them exactly (to within floating-point rounding) for Board-grade credibility. Full field spec in `svmp-field-specification.md`.

### 7.1 Derived fiscal context

```
Avg Monthly Salary        = Avg Annual Salary / 12
Avg Monthly OT Cost       = (Total Salary Budget − (Avg Annual Salary × Number of Officers)) / 12
```

The OT cost is a **residual** in the workbook, not a measured figure. Open question #3 asks whether this should remain derived or become a direct input.

### 7.2 Vacancies (driver row 17)

```
Avg Vacant Positions      = Frequency % × Number of Officers
Position Months           = Avg Vacant Positions × Duration
Salary Avoidance          = Position Months × Avg Monthly Salary
Coverage Salary Costs     = Position Months × Backfill Rate × Avg Monthly OT Cost
Net Vacancy Impact        = Salary Avoidance − Coverage Salary Costs
```

### 7.3 Unplanned leave (driver row 18)

```
Avg Vacant Positions      = Officers on Leave       ← NOT multiplied by officer count
Position Months           = Avg Vacant Positions × Duration
Salary Avoidance          = 0                       ← hardcoded in Excel (see open question #2)
Coverage Salary Costs     = Position Months × Backfill Rate × Avg Monthly OT Cost
Net Leave Impact          = Salary Avoidance − Coverage Salary Costs
```

### 7.4 Planned leave (driver row 19)

```
Avg Vacant Positions      = (Officers Affected × Duration) / 12   ← distinct formula
Position Months           = Officers Affected × Duration          ← uses raw inputs, not column H
Salary Avoidance          = 0                                     ← salary still paid during planned leave
Coverage Salary Costs     = Position Months × Backfill Rate × Avg Monthly OT Cost
Net Planned Leave Impact  = Salary Avoidance − Coverage Salary Costs
```

**Note:** The "Avg Vacant Positions" formula for this row is different from rows 17 and 18 — it converts total person-months to an annualized FTE-equivalent. "Position Months" is also different: it skips column H and uses the raw inputs directly. Both behaviours must be preserved.

### 7.5 Pay adjustments

```
Net Pay Adjustment Impact = −(Promotions/Acting Pay Pressure + Step Progression Impact + Other)
```

Users enter positive cost pressures; the formula negates the sum to produce an unfavourable variance. This sign convention is deliberate — see open question #5.

### 7.6 Summary roll-up

```
Net Yearly Salary Variance = Net Vacancy Impact
                           + Net Unplanned Leave Impact
                           + Net Planned Leave Impact
                           + Net Pay Adjustment Impact
```

Positive = projected surplus (spending less than budget). Negative = projected pressure (spending more than budget). Display label and sign together at all times.

### 7.7 Monthly spread (Forecast Model sheet)

V1 distributes each driver's annual variance evenly across 12 months:

```
Monthly Driver Variance   = Annual Driver Variance / 12
Net Monthly Variance      = SUM(monthly variances across all 4 drivers)
Cumulative Forecast[m]    = SUM(Net Monthly Variance[1..m])
```

Workbook comment notes that seasonality (summer vacation spikes, hiring waves, academy graduation timing) is a V2 enhancement.

### 7.8 Actuals monitoring (Actuals sheet)

```
Budgeted Monthly Spend[m]       = Total Salary Budget / 12
Forecasted Monthly Spend[m]     = Budgeted Monthly Spend[m] − Forecast Net Variance[m]
Actual Monthly Spend[m]         = Budgeted Monthly Spend[m] − Actual Variance[m]   (only if actual entered)
Monthly Difference[m]           = |Forecast Variance[m]| − |Actual Variance[m]|

Cumulative Expected Spend[m]    = Budgeted Monthly Spend × m
Cumulative Forecasted Spend[m]  = SUM(Forecasted Monthly Spend[1..m])
Cumulative Actual Spend[m]      = SUM(Actual Monthly Spend[1..m])   (gated on actuals being present)
```

These three cumulative trajectories are the basis of the actuals-vs-forecast chart, which should be the centerpiece of the Actuals view.

---

## 8. UI/UX approach

### 8.1 Layout

Top navigation with four sections:

1. **Dashboard** (landing page: forecast summary, variance by driver, monthly charts)
2. **Inputs** (four sub-sections: Fiscal Context, Vacancies, Leave, Pay Adjustments)
3. **Actuals** (monthly entry plus variance-to-forecast tracking)
4. **Settings** (service name, save / load configuration, reset to defaults)

### 8.2 Design principles

- **Quiet, confident, governance-appropriate.** Think "audited financial report," not "startup dashboard."
- **Neutral palette.** One accent colour for positive variance, one for pressure. Everything else greyscale.
- **Numbers are the point.** Type hierarchy emphasizes figures. Axis labels and legends are subdued.
- **Density over whitespace.** Senior users prefer seeing more on one screen to clicking through.
- **Every output is traceable.** Hovering a number should reveal the formula and inputs that produced it.
- **Service-agnostic.** No hardcoded department name, branding, or default values specific to one service. Service name is an editable field in the header.

### 8.3 Key screens

- **Dashboard:** Total forecast variance at the top, colour-coded. Breakdown by driver below. Monthly trend and cumulative charts. Every number traceable on hover.
- **Input screens:** One form per driver with inputs on the left, live calculation preview on the right. Locked fields (Planned Leave officers-affected, Unplanned Leave salary-avoidance) shown as read-only with explanatory text.
- **Actuals screen:** 12-month grid for entering actuals. Three cumulative trajectories (Expected, Forecasted, Actual) on one chart. Monthly difference indicators.
- **Settings:** Service name input, export configuration to JSON, import configuration from JSON, reset to defaults.

---

## 9. Development phases (for Claude Code)

Work through these in order. At the start of each phase, give Claude Code the relevant section of this document plus the current state of the codebase.

### Phase 0: Setup (half day)

- Initialize Vite + React + TypeScript project
- Install Tailwind, shadcn/ui, Zustand, Recharts, SheetJS, react-hook-form, Zod, Vitest
- Configure ESLint, Prettier, base tsconfig
- Set up Git, make first commit
- Scaffold folder structure: `src/calc`, `src/state`, `src/components`, `src/io`, `src/pages`

**Deliverable:** Running dev server, empty app shell with nav.

### Phase 1: Calculation engine (2 days)

**Most important phase. Do not rush this.**

The field specification (`svmp-field-specification.md`) is the source of truth. Every formula in Section 7 of this plan maps to a specific calculation in the field spec.

Implement the engine as pure TypeScript modules, no React:

```
src/calc/
  fiscalContext.ts       // derives avg monthly salary and OT cost from inputs
  drivers/
    vacancy.ts           // Section 7.2
    unplannedLeave.ts    // Section 7.3
    plannedLeave.ts      // Section 7.4 — note distinct formulas for H and I columns
    payAdjustments.ts    // Section 7.5 — preserves Excel sign convention
  summary.ts             // Section 7.6 — rolls up four driver impacts
  forecast.ts            // Section 7.7 — monthly spread and cumulative
  actuals.ts             // Section 7.8 — forecast vs actual spend tracking
  index.ts               // public API
```

Each module:
- Takes typed inputs, returns typed outputs, no side effects.
- Has a dedicated `.test.ts` file with at least one golden-value test per formula using the defaults from the workbook.
- Reproduces the Excel output within 0.01 tolerance for the baseline scenario (net yearly variance = 26,041.67).

**Defaults to use as initial test cases** (from the workbook):

| Input | Default |
|---|---|
| Total salary budget | 26,000,000 |
| Number of officers | 185 |
| Avg annual salary | 140,000 |
| Vacancy frequency % | 0.03 |
| Vacancy duration | 6 |
| Vacancy backfill rate | 0.40 |
| Unplanned officers on leave | 2 |
| Unplanned duration | 6 |
| Unplanned backfill rate | 0.70 |
| Planned duration per officer | 1.9 |
| Planned backfill rate | 0.05 |
| Promotions / acting pay | 20,000 |
| Step progression | 10,000 |
| Other pay adjustments | 5,000 |

**Expected outputs for the above defaults** (use as golden-value assertions):
- Net vacancy impact: 277,500.00
- Net unplanned leave impact: −70,000.00
- Net planned leave impact: −146,458.33
- Net pay adjustment impact: −35,000.00
- Net yearly salary variance: 26,041.67

**Deliverable:** `npm test` passes. Run the engine in a Node script and reproduce all workbook outputs exactly.

### Phase 2: State management (0.5 day)

- Define Zustand store matching `AppState` from Section 6
- Persist middleware writing to browser local storage
- Actions for: update any input, update monthly actual, reset to defaults, load state from JSON, export state to JSON
- No scenario switching needed (single scenario in V1)
- Unit tests for critical actions

**Deliverable:** State works without any UI. Testable in isolation.

### Phase 3: Input forms (2 days)

Four input surfaces, one at a time. Start with Fiscal Context since everything downstream depends on it.

- **Fiscal Context form:** three editable fields, plus the two derived values displayed as read-only with a small "derived from" note
- **Vacancies form:** three inputs, live preview of calculated row
- **Unplanned Leave form:** three inputs (note: Salary Avoidance shown as read-only 0 with explanatory text)
- **Planned Leave form:** two inputs (note: Officers Affected shown as read-only, linked from Fiscal Context)
- **Pay Adjustments form:** three inputs, with clear messaging that entries are cost pressures
- Use react-hook-form + Zod for validation
- Inline totals update as the user types

**Deliverable:** User can enter all V1 inputs through the UI and see live totals.

### Phase 4: Dashboard (1.5 days)

- Header: editable service name field (no hardcoded department)
- Summary card: Net Yearly Salary Variance, colour-coded (green surplus / red pressure)
- Breakdown cards: one per driver with its net impact
- Monthly variance chart (Recharts) showing flat monthly forecast for V1
- Cumulative forecast chart
- Every figure traceable: hover or click reveals the formula and source inputs

**Deliverable:** A finance analyst can read the dashboard end-to-end without guidance.

### Phase 5: Actuals tracking (1.5 days)

- Monthly grid (January through December) for entering Actual Salary Variance
- Three cumulative trajectories on a single chart: Expected (budget baseline), Forecasted, Actual
- Variance-to-forecast indicators per month (shows whether actual is better or worse than forecast)
- QA totals row (matches workbook row 18)

**Deliverable:** User enters January actuals and sees the trajectories update.

### Phase 6: Save / Load (0.5 day)

- Button: "Export configuration" downloads current `AppState` as a JSON file
- Button: "Import configuration" reads a JSON file and loads it into the store
- Button: "Reset to defaults" clears state and reloads default inputs
- Schema version check on import with a clear error message if incompatible

**Deliverable:** A police service can save their setup as a file, share it, or reload it later. Different services can maintain separate files.

### Phase 7: Polish and local deploy (0.5 day)

- Cross-browser smoke test (Chrome, Edge, Safari)
- Empty-state and error-state handling
- README with two things: how to run locally (`npm install`, `npm run dev`), and how to create a production build (`npm run build`, `npx serve dist`)
- Light styling pass for density, readability, and print

**Deliverable:** Working prototype running on `localhost`. Ready to demo.

**Total estimate:** 8 working days of focused development with Claude Code, from an empty folder to a runnable prototype.

---

## 10. Working with Claude Code: practical guidance

1. **Put the field spec and project plan in the repo.** `docs/svmp-field-specification.md` and `docs/project-plan.md`. Reference them in every prompt. These replace the need to share the Excel file directly during development, though you can also include it as a reference.

2. **Work one phase at a time.** Do not ask Claude Code to build the whole app at once. The plan is structured into phases precisely because each has a clean deliverable.

3. **Make Phase 1 bulletproof.** The calculation engine is the foundation. If the formulas are wrong, every subsequent phase compounds the problem. Use the golden-value assertions from Phase 1 (net yearly variance = 26,041.67) as the definition of "working."

4. **Commit after every phase.** Descriptive commit messages, one per phase at minimum. If a phase goes sideways, you can roll back.

5. **Keep both docs current.** If a design decision changes during the build, update the project plan before writing code. The field spec is the source of truth for calculations and should only change if the model itself changes.

6. **Spot-check against the workbook after Phase 1.** Open `SVMP_2026.xlsx`, run the same inputs through the web app, confirm the numbers match. This is a five-minute check that saves hours later.

7. **Resist scope creep.** V2 items (Excel I/O, scenarios, by-rank breakdowns) are tempting to add "while we're here." Don't. Ship V1 first and let usage tell you what V2 actually needs.

8. **Ask Claude Code to explain critical code back to you.** Especially the calc engine modules. If it can't explain what row 19 is doing differently from row 17, the code probably doesn't handle it correctly.

---

## 11. Testing and validation

**Pragmatic testing strategy for a prototype:**

1. **Unit tests (calculation engine).** Vitest. Every formula has at least one test case using the workbook defaults as golden values. Add edge cases (zero inputs, very large values) if time permits. The priority is catching regressions in the core math.
2. **Excel parity check.** After Phase 1, run the baseline defaults through the engine and confirm the output matches the workbook exactly (within rounding). Document the test cases in `src/calc/__tests__/parity.test.ts`.
3. **Manual walkthrough.** Before declaring V1 done, walk through the full flow (enter inputs → see dashboard → enter actuals → export config → reload config) and confirm nothing breaks.

**Validation checklist before calling V1 done:**
- [ ] Every Excel formula has a corresponding engine function
- [ ] Calculation engine matches workbook defaults to 0.01 precision
- [ ] Dashboard readable by someone who has never seen the model
- [ ] No uncaught errors in browser console under normal use
- [ ] Works on Chrome at minimum; Edge and Safari checked if convenient
- [ ] JSON save / load round-trips without data loss

---

## 12. Local deployment

V1 runs entirely on the user's local machine. No cloud hosting, no server, no database, no auth.

**For development and demo:**

```bash
npm install
npm run dev      # runs on http://localhost:5173 (Vite default)
```

**For a more stable local build:**

```bash
npm run build
npx serve dist   # serves the production build on a local port
```

**Data location.** All user inputs and actuals live in browser local storage. Clearing browser data erases them. Users who want persistence across browser clears should export their configuration to a JSON file.

**Distribution to other police services.** Zip the repo, share, and recipient runs `npm install` then `npm run dev`. If installing Node is a barrier, a future enhancement could wrap the app in Electron to produce a standalone executable — noted for V2.

**Security note.** Because data never leaves the machine, no privacy impact assessment is needed for V1. This changes if the app is ever hosted or gains multi-user features.

---

## 13. Deferred to V2

Deliberately out of scope for V1 so we can ship the prototype quickly. These were in the original plan or surfaced during field extraction. All are candidates for future versions.

- Excel import / export (user will re-enter data manually in V1)
- Multi-scenario comparison (baseline vs. optimistic vs. pessimistic)
- By-rank or sworn-vs-civilian salary and OT breakdowns
- Seasonality in the monthly spread (summer spikes, hiring waves, academy timing)
- Editable Planned Leave officers-affected and Unplanned Leave salary-avoidance (currently locked per V1 decisions)
- Direct input of Average Monthly Overtime Cost (currently derived as residual)
- Integration with HR / payroll systems
- Automated ingestion of actuals from financial systems
- Additional drivers beyond the core four
- Multi-year trending and historical analysis
- Collaborative editing across users, role-based access, cloud hosting
- Board-ready automated report generation (PDF)
- Electron packaging for standalone distribution
- Mobile-optimized view
- Print-friendly layout for Board materials

---

## 14. Resolved decisions (log)

All open questions from the field extraction phase have been answered. This section is the record of those decisions.

| # | Question | Resolution |
|---|---|---|
| 1 | Planned Leave frequency behaviour | **Locked to Number of Officers.** Not editable in V1. |
| 2 | Unplanned Leave Salary Avoidance | **Locked at 0.** Not editable in V1. |
| 3 | Average Monthly Overtime Cost | **Kept derived** as residual: `(Budget − Base Salaries) / 12`. |
| 4 | Fiscal year start month | **January through December.** |
| 5 | Pay adjustment sign convention | **Kept as-is.** Users enter positive cost pressures; formula negates the sum. |
| 6 | Rank / classification granularity | **Single average** across all officers in V1. By-rank deferred. |
| 7 | Seasonality | **Flat monthly distribution** in V1. Per-month weighting deferred to V2. |
| 8 | Target user | **Reusable across Canadian police services.** No hardcoded department. |
| 9 | Deployment | **Local hosting only.** Dev server or local static build. |
| 10 | Excel round-trip | **Not required in V1.** Manual re-entry is acceptable. |
| 11 | Scenario management | **Single scenario in V1.** Multi-scenario comparison deferred. |
| 12 | Timeline | **ASAP prototype.** Targeting roughly 8 working days of Claude Code development. |

---

**End of plan.** Version 0.3 — scope locked for V1 prototype. Next step: Phase 0 kickoff with Claude Code.
