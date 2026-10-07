# Implementation Plan (4-Hour Build Sequence)

This plan is optimized for a rapid MVP build using single-page HTML, CSS, and Vanilla JavaScript with local JSON files as the data source. No backend or database is required for the MVP.

## Hour 1: Data Foundation & Scaffold
* **Goal**: Establish the data layer and core application structure.
* **Tasks**:
  1. Create the `/data` folder and load synthetic datasets (`kpis.json`, `incidents.json`, `network_elements.json`, `services.json`, `recommendations.json`).
  2. Build the basic HTML shell and CSS grid layout (Dashboard container, Sidebar, Header, Main Content Area).
  3. Implement JavaScript data-loading utilities using `fetch()` to load the JSON files.
  4. Write basic JS data aggregation and filtering logic (e.g., severity classification, finding KPIs associated with an incident).

## Hour 2: Operations Dashboard (Screen 1)
* **Goal**: Build the primary Operations Command View.
* **Tasks**:
  1. Build KPI Cards: Display current status vs. baseline (Core Utilization, Session Success, Latency, Packet Loss, Open SEVs).
  2. Apply status colors (Healthy/Green, Warning/Yellow, Degraded/Orange, Critical/Red).
  3. Build the "Top Operational Issues" card for SEV-1/SEV-2 incidents (Impact, Exposure, Duration, Probable Domain, Confidence).
  4. Add basic CSS styling to communicate a professional, senior-level dashboard (dark mode or clean corporate light mode).

## Hour 3: Intelligence & KPI Layer (Screens 2 & 3)
* **Goal**: Implement Incident Correlation and KPI Drilldown.
* **Tasks**:
  1. Build Incident Intelligence View: Click an incident to see Observed Evidence and Correlated Indicators.
  2. Implement the RCA Hypothesis text block.
  3. Build the KPI Drilldown UI: Dropdowns for Service -> Domain -> Network Element -> KPI.
  4. Render simple trend charts (using Chart.js or just CSS flex-bars for simplicity) showing baseline vs. current deviation.

## Hour 4: Executive Layer & AI Simulation (Screens 4 & 5)
* **Goal**: Build the Decision Brief and AI Reasoning simulation.
* **Tasks**:
  1. Build the Decision Brief view: Display Situation, Evidence, Impact, Assessment, and Recommended Actions.
  2. Add the "Evidence vs Recommendation" metrics: Display Evidence Completeness (%), Recommendation Confidence (%), Action Risk, and Approval Requirement.
  3. Add the "Generate Reasoning Brief" interaction button.
  4. Final Polish: Ensure responsive design, clean up UI spacing, and verify all architecture story points are visible. Stop building after 4 hours to avoid over-engineering.
