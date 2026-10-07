# Vibe Coding Prompts for Google Antigravity

Use these prompts sequentially in Google Antigravity to generate the application codebase. You can copy and paste these into the chat.

## Prompt 1: Initial Setup and Data Foundation
```text
I am building a "Telco Operations Intelligence & Decision Platform" MVP for my portfolio. It will be a single-page frontend application (HTML/CSS/JS) loading local JSON data. 

Please create the initial scaffold in the root directory:
1. `index.html` with a modern, professional, enterprise-grade dark-mode UI layout (Sidebar, Header, Main Content area).
2. `style.css` with a clean CSS grid/flexbox system and utility classes.
3. `app.js` with logic to fetch data from the `/data` folder (kpis.json, incidents.json, network_elements.json, services.json, recommendations.json).
4. In `app.js`, create a data manager class or functions to handle data loading, calculate total active SEV-1/2 incidents, and determine overall network health.

Use vanilla JS and clean CSS. No React/Vue.
```

## Prompt 2: Operations Command View (Screen 1)
```text
Now let's build "Screen 1 - Operations Command View" in `index.html` and `app.js`.

Requirements:
1. Top Section: 4-5 KPI Cards (Core Utilization, Session Success, Latency, Packet Loss, Open Critical SEVs). Show the current value and a status indicator (Healthy, Watch, Warning, Degraded, Critical).
2. Bottom Section: "Top Operational Issues". Render a detailed card for a SEV-1 incident (e.g., "Packet Core Latency Spike") showing Impact, Exposure (USD), Duration, Probable domain, and Confidence (%).
3. Wire up `app.js` to populate these widgets from the loaded JSON data.
4. Ensure the design looks highly analytical and senior-level.
```

## Prompt 3: Incident Intelligence (Screen 2)
```text
Let's build "Screen 2 - Incident Intelligence". Create a modal or a separate view section that triggers when a user clicks on the "Top Operational Issues" card.

This view must differentiate from standard dashboards by showing correlation:
1. "Observed Evidence" list (e.g., latency increased 4.7x, UPF CPU increased 23%).
2. "Correlated Indicators" visual flow (Latency UP + UPF CPU UP + Packet Loss UP = Probable Core Processing Constraint).
3. "Root-Cause Hypothesis" text block stating the high-confidence correlation.
4. Populate this dynamically from the `incidents.json` and `kpis.json` data.
```

## Prompt 4: KPI Drilldown (Screen 3)
```text
Build "Screen 3 - KPI Drilldown". Add a new section accessible via the sidebar.

Requirements:
1. A multi-level filter UI allowing selection of: Service -> Domain -> Network Element -> KPI (e.g., Mobile Data -> Packet Core -> UPF-03 -> Latency).
2. When a selection is made, display metrics: Baseline, Current, Deviation, Trend, Threshold.
3. Use a lightweight charting library like Chart.js (via CDN) to render a simple 24-hour line chart of the selected KPI against its baseline.
```

## Prompt 5: Decision Brief & AI Reasoning (Screens 4 & 5)
```text
Finally, build "Screen 4 & 5 - Operational Decision Brief & AI Reasoning Layer". 

Requirements:
1. In the Incident Intelligence view, add a primary button: "Generate Reasoning Brief".
2. When clicked, display a one-page "Operational Decision Brief" containing: Situation, Evidence, Impact, Assessment, and Recommended actions.
3. Add the killer feature block: "Evidence vs Recommendation". It must explicitly show:
   - Evidence Completeness: (e.g., 92%)
   - Recommendation Confidence: (e.g., 87%)
   - Action Risk: (Medium/High)
   - Approval: Required
4. Ensure the UI reinforces the architectural principle that AI provides *evidence-backed recommendations requiring human approval*, not autonomous action.
```
