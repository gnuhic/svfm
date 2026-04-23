# Salary Variance Forecast Model — Field Specification

**Source:** `SVMP_2026.xlsx` (extracted from workbook directly)
**Purpose:** Complete inventory of inputs, calculations, and outputs for web application build.

**Legend:**
- **INPUT** = user-editable value
- **CALC** = derived from other fields (not directly editable)
- Cell references refer to the original workbook for traceability

---

## 1. Global Assumptions (fiscal context)

Source: `Inputs!A6:C11`

| # | Field | Type | Default | Formula | Notes |
|---|---|---|---|---|---|
| 1.1 | Total salary budget | INPUT | 26,000,000 | — | Currency ($) |
| 1.2 | Number of officers | INPUT | 185 | — | Integer |
| 1.3 | Average annual salary per position | INPUT | 140,000 | — | "with loaded benefits" |
| 1.4 | Average monthly salary per position | CALC | 11,666.67 | `= Avg annual salary / 12` | Display-only |
| 1.5 | Average overtime cost per month | CALC | 8,333.33 | `= (Total salary budget − (Avg annual salary × Number of officers)) / 12` | Residual budget after base salaries, divided monthly |

**Note on 1.5:** This formula interprets "average overtime cost per month" as the portion of the total salary budget that is not base salary, spread monthly. This is a modeling simplification and worth flagging if it should be a direct input instead.

---

## 2. Variance Driver Inputs (3-row table)

Source: `Inputs!A16:M19`

This is the core driver table. Columns A–G are inputs; H–L are calculations. Three driver rows: Vacancies, Unplanned leave, Planned leave.

### 2.1 Vacancies (row 17)

| Column | Field | Type | Default | Formula | Notes |
|---|---|---|---|---|---|
| A | Vacancy Type label | — | "Vacancies" | — | |
| B | Frequency | INPUT | 3% (0.03) | — | % of positions vacant during year. Comment: "185 positions × 3% → 5–6 vacancies on average" |
| D | Duration | INPUT | 6 | — | Months (recruitment lag) |
| F | Backfill Rate | INPUT | 40% (0.40) | — | Portion covered by overtime. Comment: "about half requires overtime coverage" |
| H | Avg Vacant Positions | CALC | 5.55 | `= Frequency × Number of officers` | |
| I | Position Months | CALC | 33.3 | `= Avg Vacant Positions × Duration` | |
| J | Salary Avoidance | CALC | 388,500 | `= Position Months × Avg monthly salary` | Favourable variance |
| K | Coverage Salary Costs | CALC | 111,000 | `= Position Months × Backfill Rate × Avg monthly OT cost` | Cost pressure |
| L | Net Impact | CALC | 277,500 | `= Salary Avoidance − Coverage Salary Costs` | |

### 2.2 Unplanned leave (row 18)

*Represents disability, unpaid leave, secondments*

| Column | Field | Type | Default | Formula | Notes |
|---|---|---|---|---|---|
| A | Type label | — | "Unplanned leave" | — | |
| B | Frequency | INPUT | 2 | — | **Absolute number of officers out at any time** (not a percentage) |
| D | Duration | INPUT | 6 | — | Months |
| F | Backfill Rate | INPUT | 70% (0.70) | — | Comment: "most shifts must still be covered" |
| H | Avg Vacant Positions | CALC | 2 | `= Frequency` | Frequency is already absolute, not multiplied |
| I | Position Months | CALC | 12 | `= Avg Vacant Positions × Duration` | |
| J | Salary Avoidance | INPUT | 0 | — | **Hardcoded to 0.** Note: "for now because some unplanned leave may not lead to savings" |
| K | Coverage Salary Costs | CALC | 70,000 | `= Position Months × Backfill Rate × Avg monthly OT cost` | |
| L | Net Impact | CALC | −70,000 | `= Salary Avoidance − Coverage Salary Costs` | |

### 2.3 Planned leave (row 19)

*Vacation, training, scheduled leave, stat holidays*

| Column | Field | Type | Default | Formula | Notes |
|---|---|---|---|---|---|
| A | Type label | — | "Planned leave" | — | |
| B | Frequency | CALC | 185 | `= Number of officers` | **Locked to total officers.** Consider whether this should remain linked or become editable. |
| D | Duration | INPUT | 1.9 | — | Months per officer per year. Comment: "4 weeks vacation + ~1 week training + ~1 week other + 11 stat holidays (2.2 weeks) ≈ 8.2 weeks" |
| F | Backfill Rate | INPUT | 5% (0.05) | — | |
| H | Avg Vacant Positions | CALC | 29.29 | `= Frequency × Duration / 12` | **Different formula from rows 17/18** (converts to annualized FTE equivalent) |
| I | Position Months | CALC | 351.5 | `= Frequency × Duration` | **Different formula from rows 17/18** (does not use column H) |
| J | Salary Avoidance | INPUT | 0 | — | Hardcoded to 0 (salary still paid during planned leave) |
| K | Coverage Salary Costs | CALC | 146,458.33 | `= Position Months × Backfill Rate × Avg monthly OT cost` | |
| L | Net Impact | CALC | −146,458.33 | `= Salary Avoidance − Coverage Salary Costs` | |

### ⚠ Inconsistencies to resolve before build

1. **Column B "Frequency" has three different meanings across rows:**
   - Row 17: percentage (multiplied by officer count)
   - Row 18: absolute count of officers
   - Row 19: linked to total officer count
   The web app should label each field meaningfully rather than reusing a single "Frequency" header.

2. **Column H "Avg Vacant Positions" uses different formulas across rows:**
   - Row 17: `Freq × Officers`
   - Row 18: `Freq` (just the value)
   - Row 19: `Freq × Duration / 12` (person-months equivalent)

3. **Column I "Position Months" uses different formulas:**
   - Rows 17 and 18: `H × D`
   - Row 19: `B × D` (skips column H)

These behaviours should be preserved exactly in the calc engine for parity, but the UI should present each row with appropriate labels and constraints.

---

## 3. Additional Pay Adjustments

Source: `Inputs!A22:B26`

| # | Field | Type | Default | Formula |
|---|---|---|---|---|
| 3.1 | Promotions / acting pay pressure | INPUT | 20,000 | — |
| 3.2 | Step progression timing impact | INPUT | 10,000 | — |
| 3.3 | Other | INPUT | 5,000 | — |
| 3.4 | Net Impact | CALC | −35,000 | `= −SUM(3.1, 3.2, 3.3)` |

**Note on sign convention:** Inputs are entered as positive cost pressures; the Net Impact formula negates the sum to express this as a negative variance (unfavourable). Keep this behaviour in the app.

---

## 4. Summary Outputs

Source: `Inputs!A29:B35`

| # | Metric | Formula | Default |
|---|---|---|---|
| 4.1 | Net vacancy impact | `= Vacancies Net Impact` (2.1 / column L) | 277,500 |
| 4.2 | Net unplanned leave impact | `= Unplanned Leave Net Impact` (2.2) | −70,000 |
| 4.3 | Net planned leave impact | `= Planned Leave Net Impact` (2.3) | −146,458.33 |
| 4.4 | Additional pay adjustments | `= Pay Adjustments Net Impact` (3.4) | −35,000 |
| 4.5 | **Net yearly salary variance** | `= SUM(4.1, 4.2, 4.3, 4.4)` | 26,041.67 |

**Sign convention per workbook comment (C35):** Positive = forecasted to spend less (surplus). Negative = forecasted to spend more (pressure).

---

## 5. Forecast Model — Annual and Monthly Aggregates

Source: `Forecast Model!A4:C9`

| Line | Yearly formula | Monthly formula | Default (yearly) | Default (monthly) |
|---|---|---|---|---|
| Vacancies | `= 4.1` | `= Yearly / 12` | 277,500 | 23,125 |
| Unplanned leave | `= 4.2` | `= Yearly / 12` | −70,000 | −5,833.33 |
| Planned leave | `= 4.3` | `= Yearly / 12` | −146,458.33 | −12,204.86 |
| Pay adjustments | `= 4.4` | `= Yearly / 12` | −35,000 | −2,916.67 |
| **Total** | `= SUM(above)` | `= SUM(above)` | 26,041.67 | 2,170.14 |

---

## 6. Forecast Model — Monthly Breakdown

Source: `Forecast Model!A12:G24`

V1 spreads all values evenly across 12 months. Comment in workbook flags seasonality as a V2 consideration ("summer vacation spikes, hiring waves, academy graduation timing, seasonal overtime").

| Column | Field | Type | Formula |
|---|---|---|---|
| A | Month | — | January through December |
| B | Vacancy Impact | CALC | Monthly Vacancies from Section 5 (constant across all 12 months) |
| C | Leave Impact | CALC | Monthly Unplanned leave from Section 5 (constant) |
| D | Planned Leave OT | CALC | Monthly Planned leave from Section 5 (constant) |
| E | Pay Adjustment | CALC | Monthly Pay adjustments from Section 5 (constant) |
| F | Net Monthly Variance | CALC | `= SUM(B:E)` for that month |
| G | Cumulative Forecast | CALC | January: `= F`; Feb–Dec: `= previous G + current F` |

**Default cumulative values (January → December):** 2,170 / 4,340 / 6,510 / 8,681 / 10,851 / 13,021 / 15,191 / 17,361 / 19,531 / 21,701 / 23,872 / 26,042.

---

## 7. Actuals — Monitoring

Source: `Actuals -- Monitoring!A3:J15`

| Column | Field | Type | Formula | Notes |
|---|---|---|---|---|
| A | Month | — | January–December | |
| B | Forecast net variance | CALC | `= Forecast Model monthly net variance` (6.F) | Pulled from forecast |
| C | Actual salary variance | INPUT | — | Entered monthly by user. Header note: "Budgeted minus actual" |
| D | Monthly difference | CALC | `= ABS(B) − ABS(C)` | Comparison of magnitudes |
| E | Cumulative expected monthly spend | CALC | `= (Total salary budget / 12) + previous E` | Budget baseline |
| F | Cumulative forecasted spend | CALC | January: `= I`; later: `= I + previous F` | |
| G | Cumulative actual monthly spend | CALC | January: `= J`; later: `= IF(J="","", J + previous G)` | Only accumulates when actuals entered |
| H | Budgeted monthly spend | CALC | `= Total salary budget / 12` | Same every month |
| I | Forecasted monthly spend | CALC | `= H − B` | Budget minus forecast variance |
| J | Actual monthly spend | CALC | `= IF(C="","", H − C)` | Budget minus actual; blank if no actual entered |

**QA row (row 18):**
- SUM of forecast variances = net yearly variance (26,042)
- SUM of actuals variance = total actuals entered
- Cumulative check: `= E15 − F15` should equal SUM(B) (internal consistency check)

**Default sample actuals in workbook (can be blanked in app):** January 5,000 / February −8,000 / March 2,000 / April 4,500; May–December blank.

---

## 8. Field count summary

**User-editable inputs:** 15
- 3 in fiscal context (1.1, 1.2, 1.3)
- 9 in driver table (3 per row × 3 rows: Frequency, Duration, Backfill Rate — plus the hardcoded Salary Avoidance overrides for rows 18 and 19 which are technically INPUTs locked to 0)
- 3 in pay adjustments (3.1, 3.2, 3.3)
- 1 per month on Actuals sheet (12 total for actual salary variance entries)

**Calculated fields:** 47+
- 2 in fiscal context (1.4, 1.5)
- 15 in driver table (5 CALC columns × 3 rows)
- 1 in pay adjustments (3.4)
- 5 summary outputs (4.1–4.5)
- 10 in forecast aggregates (2 columns × 5 rows)
- 72 in monthly forecast breakdown (6 columns × 12 rows)
- 84 in actuals sheet (7 CALC columns × 12 months)

---

## 9. Open questions for the build

Decisions that affect UI and data model, flagged from what's visible in the workbook:

1. **Planned leave "Frequency" link.** Should it stay locked to Number of Officers, or should the user be able to override it (e.g., exclude officers on other leave)?
2. **Unplanned leave salary avoidance = 0.** The comment suggests this is deliberate but simplified. Should the app expose this as an editable field for users who want to model partial savings (e.g., unpaid leave with no salary paid)?
3. **Average overtime cost per month.** Currently derived as a residual. Is this how the model should work, or should OT cost be a direct input with the residual presented as a sanity check?
4. **Seasonality.** Workbook spreads evenly; V2 mentions spikes. Build should include a clean extension point (e.g., per-month weighting factors) even if V1 uses flat distribution.
5. **Sign conventions for pay adjustments.** Enter as positive numbers that get negated, or enter directly as negatives? Current Excel approach (positive in, negated out) is less intuitive but established.
6. **Fiscal year start month.** Workbook uses January–December. Confirm whether the police department follows calendar year or April–March fiscal year.
7. **Rank / classification granularity.** Current model uses a single average salary and OT cost. Adding by-rank breakdowns would significantly improve accuracy but is a structural change — flag as potential V1.5 or V2.

---

## 10. Mapping to calculation engine modules

For Phase 1 of the build (per project plan), the calculation engine should be structured as:

```
src/calc/
  assumptions.ts       // Section 1: fiscal context, derived avg monthly salary / OT
  drivers/
    vacancy.ts         // Section 2.1
    unplannedLeave.ts  // Section 2.2
    plannedLeave.ts    // Section 2.3
    payAdjustments.ts  // Section 3
  summary.ts           // Section 4: rolls up driver net impacts
  forecast.ts          // Sections 5 and 6: annual/monthly spread
  actuals.ts           // Section 7: variance-to-forecast tracking
```

Each module takes typed inputs, returns typed outputs, and has no side effects. This matches the architecture in the project plan and makes Excel-parity testing straightforward.
