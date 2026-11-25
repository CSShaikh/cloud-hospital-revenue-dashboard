# Cloud Hospital India | Revenue Operations

Responsive, read-only billing dashboard built from the supplied React 18/Vite starter. The 120 transaction records are constructed demonstration data, not actual hospital performance.

## Local setup

Node.js 18+ (a currently supported LTS is recommended). Keep the original project hierarchy: the API and build read `../DATA/transactions.json` and the tests are in `../TESTS`.

From `INPUT_FILES/STARTER`:

```sh
npm install
npm run api
```

In another terminal, in the same folder:

```sh
npm run dev
```

Open the URL printed by Vite (usually http://localhost:5173). The API listens at http://127.0.0.1:4317 and Vite proxies `/api` in development. No credentials or external database required.

## Architecture and props

- `src/Dashboard.jsx`: composition, navigation, and memoized KPI totals from unfiltered records.
- `src/hooks/useTransactions.js`: fetches `/api/transactions` in development; validates the response, tracks loading/ready/error, aborts on cleanup, and supports retry. Production fetches a static fixture.
- `MetricCard({ title, value, compactValue, phase, detail })`: reusable presentational KPI; exact INR values on desktop and compact amounts on mobile (exact values remain screen-reader accessible).
- `TransactionTable({ rows, phase, onRetry })`: controlled search, status, sort and pagination state. The derived rows are memoized, source records are never mutated, and keys are transaction IDs. Filters reset the page. Page size is five on desktop/tablet and three on mobile. The page is clamped when the number of available pages changes.
- `src/lib/transactions.js`: pure metric, search/filter/sort, formatting and response-validation helpers.
- `src/styles/`: CSS Modules and shared color/spacing tokens. Mobile transforms the table into a card layout with explicit accessibility roles; tablet may scroll within a labelled table region.
- `server/server.cjs`: original supplied local read-only API; unchanged.

## Behavior

Collected Revenue sums Paid amounts; Outstanding sums Pending amounts; Refund Total sums Refunded amounts; Transaction Count includes every status. KPIs do not change when the log is filtered. All totals are computed dynamically. No trend period is used (optional in the specification). Search trims whitespace and matches transaction ID or department without case sensitivity. Status options are All, Paid, Pending, Refunded and Failed. Separate Date, Amount and Status controls cover both directions; the latest selected sort is active, using ID as a deterministic tie-breaker. Default: oldest date first. Empty results offer a clear-filters action. Account references are never rendered. Overview, Transactions and Reports navigate to the appropriate sections; Reports is an informational anchor, not an additional reporting module.

## Build, preview and deployment

```sh
npm run build
npm run preview
```

The Vite build emits `dist/api/transactions.json` from the supplied source fixture, containing only the six displayed fields. The production dashboard fetches that read-only static file; the local Node API is not required or represented as a hosted live backend. Development failures remain visible; there is no silent fallback. Deploy the entire package hierarchy to GitHub so `DATA` is available to the build. Exclude `node_modules`, `dist`, and any credentials.

Vercel / Netlify: import the repository; choose `INPUT_FILES/STARTER` as the project root/base directory, `npm run build` as build command, and `dist` as output/publish directory (relative to the base). Ensure the repository checkout includes the sibling `INPUT_FILES/DATA` folder. Verify the HTTPS preview, fixture response and all interactions after publishing. No production URL or repository has been created by this package.

## Verification

With API running:

```sh
node ../TESTS/api_smoke_test.cjs
npm test
npm run build
```

`npm test` runs the dependency-free Node test suite. See `../../VERIFICATION/TEST_LOG.txt` for the genuine recorded output and `../../VERIFICATION/ACCEPTANCE_TEST_MATRIX.csv` for test status. Logic tests are not substitutes for manual UI or browser tests. The build and browser checks remain pending because dependency installation in the preparation environment failed with npm registry DNS error. Run the optional automated browser QA in `../../VERIFICATION/browser_qa.py` and complete `../../VERIFICATION/LOCAL_QA_GUIDE.md` before client submission. A GitHub Actions workflow and Netlify configuration are supplied, but their external execution has not been verified. The supplied reference screenshots are not screenshots of the implemented app.
