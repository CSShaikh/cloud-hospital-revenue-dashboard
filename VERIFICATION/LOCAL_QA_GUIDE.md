# Local QA and submission steps

1. Stop the old Vite server. Extract this ZIP as a separate folder or back up and replace the original client project while preserving the same folder hierarchy. Open PowerShell in `INPUT_FILES/STARTER`. Run `npm install`, then `npm run api`. In another terminal run `npm run dev`. Keep both terminals open.
2. In a third terminal, capture `node ../TESTS/api_smoke_test.cjs`, `npm test`, and `npm run build`. Record actual output; if any command fails do not mark it PASS. Run `npm run preview` and verify the production fixture works even with the local API stopped.
3. Open Chrome and Firefox. With normal API access, compare the four KPIs to the API summary (paid 168540, pending 37570, refunded 40710, count 120). Check search with `  txn-0001 ` and ` LABORATORY `, every status, both directions for all three sort fields, a query with no matches, clear filters, pagination first/last and the result count. KPI totals should not change as filters change. Confirm there are no account references visible.
4. To observe loading, throttle network in developer tools and reload. To test failure, stop the API while running `npm run dev`, reload and confirm a recoverable message and Retry button. Restart the API, then click Retry and check recovery. Expected network errors during intentional failure are not ordinary runtime regressions.
5. Tab through all navigation links, search, status, sort and pagination. Check focus outlines, accessible names, table headers/row headers and status text. Verify the mobile layout preserves all six fields. Record findings; do not claim full WCAG conformance based on this limited checklist.
6. Use browser responsive mode at 320, 390, 768, 1200, and 1440 CSS px. At each viewport, verify usability and no horizontal page overflow. In the console run `document.documentElement.scrollWidth <= document.documentElement.clientWidth` and record the result. Internal table scroll is permitted. Compare design with supplied references, allowing intentional accessibility additions and actual fixture data. Capture actual app screenshots at 390 × 844 and 1440 × 900; save under `VERIFICATION/Screenshots/`. Check console for unexpected errors in Chrome and Firefox.
7. Update the `VERIFICATION/ACCEPTANCE_TEST_MATRIX.csv` rows using actual observations, browser versions, evidence files and PASS/FAIL. `PARTIAL` means only underlying logic was tested, not the UI. Do not mark a row PASS if the required visual or interactive result has not been observed.
8. Publish all required source/data files to GitHub (not `node_modules` or `dist`). Follow deployment instructions in the starter README; verify the deployed HTTPS URL. Complete `COMPLETION_NOTE.txt` with real links and final results. Share README, completed CSV, screenshots, test log and note in an authorized Google Drive folder with Reviewer Viewer access. Do not share credentials.

Optional Windows command runner (after installing dependencies and starting the API): from the project root, run `powershell -ExecutionPolicy Bypass -File .\VERIFICATION\VERIFY_LOCAL.ps1`. It writes command output to `VERIFICATION/LOCAL_COMMAND_RESULTS.txt`. The script does not perform browser/visual checks; it updates T-27 from the actual build exit status. It was supplied for local use and has not been executed on Windows in the preparation environment.

## Automated QA (optional; no extra application dependencies)

Keep the API and dev server running on ports 4317 and 5173. From `INPUT_FILES/STARTER`, run:

```powershell
powershell -ExecutionPolicy Bypass -File ..\..\VERIFICATION\VERIFY_LOCAL.ps1
```

If build succeeds, open a separate terminal in STARTER and run `npm run preview -- --port 4173 --strictPort`. In another terminal:

```powershell
python -m pip install playwright
python -m playwright install chromium firefox
python ../../VERIFICATION/browser_qa.py
```

The optional Python tooling requires internet access for installation; it does not change application dependencies. The browser script uses installed Google Chrome if available, otherwise Playwright Chromium (which is not certified as Google Chrome), and Playwright Firefox. It captures actual viewport screenshots and full-page evidence, writes `BROWSER_TEST_LOG.txt`, updates only executed acceptance cases, and returns nonzero for failed or missing checks. Review T-26 manually against the reference and complete any untested conditions before marking PASS. No full accessibility audit is claimed. The runner is provided but has not been executed against a real React build in the preparation environment. The Windows command runner now updates T-27 from the actual build exit status. Earlier test evidence remains labelled as preparation-environment results.

## Publish

From the project root (the folder with `START_HERE.txt`), create a GitHub repository using your authorized account; do not publish secrets. If this is a new local repository:

```powershell
git init
git add .
git commit -m "Complete revenue operations dashboard"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Replace the example remote with your actual repository URL. If a remote already exists use `git remote -v` and follow your existing Git workflow rather than overwriting history. Import the repo into Netlify (configuration supplied), or Vercel with `INPUT_FILES/STARTER` as root and access to sibling source files enabled. Build `npm run build`, output `dist`. Verify the public HTTPS URL and static JSON. Add actual links to the completion note and upload the required files to the authorized Google Drive folder. Confirm Viewer access for the intended reviewer only.
