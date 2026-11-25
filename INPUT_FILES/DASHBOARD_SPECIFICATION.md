# Cloud Hospital India | Revenue Operations Workspace

## Objective
Build a responsive React dashboard displaying billing metrics and transaction logs from the supplied local JSON API. Transaction records represent constructed operational billing scenarios and contain no patient names or medical histories. Use these for UI and state-management validation, not as actual live hospital performance.

## Layout and navigation
- Desktop reference: `DESIGN_REFERENCES/desktop_1440.png` (1440 × 900). Mobile reference: `DESIGN_REFERENCES/mobile_390.png` (390 × 844).
- Header title: **Revenue Operations**. Subtitle: **Billing overview & transaction activity**.
- Left navigation on desktop: Overview (active), Transactions, Reports. On mobile, make navigation accessible and compact.
- Four KPI cards: Collected Revenue, Outstanding, Transaction Count, Refund Total.
- Table headers: Transaction, Date, Department, Amount, Status, Channel. Above table: search, status selector, date sort and amount sort.
- Include pagination or a clearly labelled result count; the filter must work on empty matches.
- Use INR formatting and an accessible active-filter state. Do not display account_ref in the UI.

## Metric definitions
- Collected Revenue = sum of `amount_inr` for `status` = Paid.
- Outstanding = sum for `status` = Pending.
- Transaction Count = count of all records (including failed/refunded).
- Refund Total = sum for `status` = Refunded.
- Metric values are computed dynamically from source records, not handwritten constants.
- KPI trend may use previous period (2026-10-01 through 2026-10-25 vs 2026-10-26 through 2026-11-20); if a denominator is zero display N/A. Explain chosen trend period in README.

## Interactions and edge cases
1. Fetch `/api/transactions` with loading and error states; use AbortController on unmount.
2. Search by transaction_id or department, case-insensitive, trimming whitespace.
3. Filter by All, Paid, Pending, Refunded, Failed. Sort by Date, Amount and Status, ascending/descending.
4. Sorting must not mutate fetched source. Use React useMemo for derived rows, stable keys, and controlled inputs.
5. Empty results must show an understandable empty-state message, never a blank broken table.
6. Keyboard and screen reader: explicit input labels, focus visibility, table header scope, status text (not color alone).
7. Responsive: test at 320, 390, 768, 1200, 1440; no horizontal page overflow (table may scroll within labelled region).

## Visual system
Brand: Cloud Hospital India | Revenue Operations. Background #F4F7FB, surfaces #FFFFFF, navy #142B49, teal #0E857A, pale teal #E0F4F1, body text #26374D, secondary #64758C, border #DDE5EF. Font: system UI (Arial fallback). Radius: 14px cards, 10px controls. Spacing: 8/12/16/24/32px. CSS Modules and shared CSS custom properties required; avoid hardcoded component colors.

## API endpoints
- GET `/api/health` -> `{status:"ok"}`
- GET `/api/transactions` -> 120 transaction records (documented in `DATA_DICTIONARY.csv`)
- GET `/api/summary` -> valid total counts and amount sums; can be used as cross-check, but render computed metrics.
- The local API is read-only. No authentication, financial processing, live patient access or remote database.

## Submission
GitHub repo containing source and README; live preview URL; README explaining props, state management, filtering and commands; completed acceptance-test results and screenshots. Only claim tests actually run.
