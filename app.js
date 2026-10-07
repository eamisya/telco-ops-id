/**
 * Telco Operations Intelligence Platform
 */

class DataManager {
    constructor() {
        this.data = {
            kpis: [],
            incidents: [],
            networkElements: [],
            services: [],
            recommendations: []
        };
    }

    async initialize() {
        try {
            await this.loadAllData();
            console.log("✅ Data successfully loaded:", this.data);
            return true;
        } catch (error) {
            console.error("❌ Error loading operational data:", error);
            return false;
        }
    }

    async loadAllData() {
        const fetchJson = async (filename) => {
            const response = await fetch(`./data/${filename}`);
            if (!response.ok) {
                throw new Error(`Failed to load ${filename}`);
            }
            return await response.json();
        };

        const [kpis, incidents, networkElements, services, recommendations] = await Promise.all([
            fetchJson('kpis.json'),
            fetchJson('incidents.json'),
            fetchJson('network_elements.json'),
            fetchJson('services.json'),
            fetchJson('recommendations.json')
        ]);

        this.data.kpis = kpis;
        this.data.incidents = incidents;
        this.data.networkElements = networkElements;
        this.data.services = services;
        this.data.recommendations = recommendations;
    }

    getActiveCriticalIncidentsCount() {
        return this.data.incidents.filter(inc => {
            const isCritical = inc.severity === 'SEV-1' || inc.severity === 'SEV-2';
            const isActive = inc.status !== 'Closed' && inc.status !== 'Resolved';
            return isCritical && isActive;
        }).length;
    }

    getOverallNetworkHealth() {
        const criticalCount = this.getActiveCriticalIncidentsCount();
        if (criticalCount > 0) return { status: 'Critical', color: 'critical', icon: 'fa-triangle-exclamation' };
        
        const degradedElements = this.data.networkElements.filter(el => el.status === 'Degraded').length;
        if (degradedElements > 2) return { status: 'Degraded', color: 'degraded', icon: 'fa-arrow-trend-down' };
        if (degradedElements > 0) return { status: 'Warning', color: 'warning', icon: 'fa-circle-exclamation' };
        
        return { status: 'Healthy', color: 'healthy', icon: 'fa-circle-check' };
    }
}

// ==========================================
// Screen 1: Operations Command
// ==========================================
function renderScreen1(dm, container) {
    document.getElementById('page-title-text').innerText = 'Operations Command View';
    
    const getKpi = (name) => dm.data.kpis.find(k => k.name === name) || { current_value: 'N/A', unit: '', status: 'Unknown' };
    
    const utilization = getKpi("Core Utilization");
    const sessions = getKpi("Session Success");
    const latency = getKpi("Latency");
    const pktLoss = getKpi("Packet Loss");
    const openSevs = dm.getActiveCriticalIncidentsCount();

    const getStatusClass = (status) => {
        const s = (status || '').toLowerCase();
        if(s.includes('health')) return 'healthy';
        if(s.includes('warn')) return 'warning';
        if(s.includes('degrad')) return 'degraded';
        if(s.includes('crit')) return 'critical';
        return 'watch';
    };

    const getStatusIcon = (status) => {
        const c = getStatusClass(status);
        if(c === 'healthy') return 'fa-circle-check';
        if(c === 'warning') return 'fa-circle-exclamation';
        if(c === 'degraded') return 'fa-arrow-trend-down';
        if(c === 'critical') return 'fa-triangle-exclamation';
        return 'fa-eye';
    };

    const formatVal = (val, unit) => val !== 'N/A' ? `${val}${unit}` : val;

    const kpiCardsHTML = `
        <div class="kpi-grid">
            <div class="kpi-card ${getStatusClass(utilization.status)}">
                <div class="kpi-title">Core Utilization</div>
                <div class="kpi-value">${formatVal(utilization.current_value, utilization.unit)}</div>
                <div class="kpi-status-label text-${getStatusClass(utilization.status)}">
                    <i class="fa-solid ${getStatusIcon(utilization.status)}"></i> ${utilization.status}
                </div>
            </div>
            <div class="kpi-card ${getStatusClass(sessions.status)}">
                <div class="kpi-title">Session Success</div>
                <div class="kpi-value">${formatVal(sessions.current_value, sessions.unit)}</div>
                <div class="kpi-status-label text-${getStatusClass(sessions.status)}">
                    <i class="fa-solid ${getStatusIcon(sessions.status)}"></i> ${sessions.status}
                </div>
            </div>
            <div class="kpi-card ${getStatusClass(latency.status)}">
                <div class="kpi-title">Latency</div>
                <div class="kpi-value">${formatVal(latency.current_value, latency.unit)}</div>
                <div class="kpi-status-label text-${getStatusClass(latency.status)}">
                    <i class="fa-solid ${getStatusIcon(latency.status)}"></i> ${latency.status}
                </div>
            </div>
            <div class="kpi-card ${getStatusClass(pktLoss.status)}">
                <div class="kpi-title">Packet Loss</div>
                <div class="kpi-value">${formatVal(pktLoss.current_value, pktLoss.unit)}</div>
                <div class="kpi-status-label text-${getStatusClass(pktLoss.status)}">
                    <i class="fa-solid ${getStatusIcon(pktLoss.status)}"></i> ${pktLoss.status}
                </div>
            </div>
            <div class="kpi-card ${openSevs > 0 ? 'critical' : 'healthy'}">
                <div class="kpi-title">Open SEV-1/2</div>
                <div class="kpi-value">${openSevs}</div>
                <div class="kpi-status-label text-${openSevs > 0 ? 'critical' : 'healthy'}">
                    <i class="fa-solid ${openSevs > 0 ? 'fa-triangle-exclamation' : 'fa-circle-check'}"></i> ${openSevs > 0 ? 'Critical' : 'Healthy'}
                </div>
            </div>
        </div>
    `;

    const criticalIncidents = dm.data.incidents.filter(inc => inc.severity === 'SEV-1' || inc.severity === 'SEV-2');
    let issuesHTML = '';
    
    if (criticalIncidents.length > 0) {
        issuesHTML = criticalIncidents.map(inc => {
            const affectedM = (inc.impact.estimated_affected_sessions / 1000000).toFixed(1) + 'M';
            const exposure = inc.impact.estimated_exposure_usd.toLocaleString();
            
            return `
                <div class="issue-card cursor-pointer" onclick="openIncidentModal('${inc.incident_id}')">
                    <div class="issue-header">
                        <div class="issue-title-group">
                            <h3><span class="badge bg-critical">${inc.severity}</span> ${inc.title}</h3>
                            <div class="issue-meta">
                                <span><i class="fa-solid fa-server"></i> ${inc.domain} (${inc.element_id})</span>
                                <span><i class="fa-regular fa-clock"></i> Started: ${new Date(inc.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                        </div>
                        <button class="badge bg-surface text-primary cursor-pointer" style="border: 1px solid var(--border-color); padding: 0.5rem 1rem; transition: background 0.2s;" onmouseover="this.style.background='var(--bg-surface-hover)'" onmouseout="this.style.background='var(--bg-surface)'">
                            Analyze Root Cause <i class="fa-solid fa-arrow-right" style="margin-left: 5px;"></i>
                        </button>
                    </div>
                    
                    <div class="issue-stats-grid">
                        <div class="stat-box">
                            <span class="stat-label">Impacted Sessions</span>
                            <span class="stat-value">${affectedM}</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-label">Est. Exposure</span>
                            <span class="stat-value currency">${exposure}</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-label">Duration</span>
                            <span class="stat-value">${inc.impact.duration_minutes} min</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-label">Probable Domain</span>
                            <span class="stat-value" style="font-family: 'Inter';">${inc.domain}</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-label">RCA Confidence</span>
                            <span class="stat-value text-accent">${inc.correlation_confidence}%</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        issuesHTML = `<div class="bg-surface" style="padding: 2rem; border-radius: var(--radius-md); text-align: center; color: var(--text-muted);">No critical operational issues detected.</div>`;
    }

    container.innerHTML = `
        ${kpiCardsHTML}
        <div class="issues-section">
            <h2 class="section-header">Top Operational Issues</h2>
            <div class="issues-grid">
                ${issuesHTML}
            </div>
        </div>
    `;
}

// ==========================================
// Screen 2: Incident Intelligence Modal
// ==========================================
window.openIncidentModal = (incidentId) => {
    const inc = window.appDataManager.data.incidents.find(i => i.incident_id === incidentId);
    if (!inc) return;

    const modal = document.getElementById('incident-modal');
    const content = document.getElementById('incident-modal-content');
    
    const ms = inc.metrics_snapshot;
    const latencyMult = (ms.latency_ms / ms.baseline_latency_ms).toFixed(1);
    
    const evidenceHTML = `
        <ul class="evidence-list">
            <li><i class="fa-solid fa-stopwatch"></i> Latency increased ${latencyMult}x baseline</li>
            <li><i class="fa-solid fa-microchip"></i> UPF CPU increased to ${ms.cpu_utilization_pct}%</li>
            <li><i class="fa-solid fa-network-wired"></i> Packet loss increased by ${ms.packet_loss_pct}%</li>
            <li><i class="fa-solid fa-users-slash"></i> Affected sessions increased (${ms.session_failure_pct}% failure)</li>
            <li><i class="fa-solid fa-triangle-exclamation"></i> Corresponding incident opened ${inc.impact.duration_minutes} min ago</li>
        </ul>
    `;

    const correlationHTML = `
        <div class="correlation-flow">
            <div class="indicator-block">Latency <i class="fa-solid fa-arrow-up text-critical"></i></div>
            <div class="math-symbol">+</div>
            <div class="indicator-block">UPF CPU <i class="fa-solid fa-arrow-up text-critical"></i></div>
            <div class="math-symbol">+</div>
            <div class="indicator-block">Packet Loss <i class="fa-solid fa-arrow-up text-critical"></i></div>
            <div class="math-symbol">+</div>
            <div class="indicator-block">Session Failures <i class="fa-solid fa-arrow-up text-critical"></i></div>
            <div class="math-symbol">=</div>
            <div class="indicator-block result"><i class="fa-solid fa-bullseye"></i> ${inc.probable_cause}</div>
        </div>
    `;
    
    const rec = window.appDataManager.data.recommendations.find(r => r.incident_id === incidentId);
    
    // Primary Hypothesis
    const primaryReasoning = rec ? rec.ai_reasoning : `High-confidence correlation between ${inc.domain} resource pressure and service latency degradation.`;
    const primaryConfidence = inc.correlation_confidence || 87;
    
    // Alternative Hypothesis
    const secondaryReasoning = `Alternative possibility: Upstream optical transport degradation or un-monitored 3rd party peering issue indirectly starving the ${inc.domain} gateway.`;
    const secondaryConfidence = Math.max(12, primaryConfidence - 45 - Math.floor(Math.random() * 10));

    const hypothesisOptionsHTML = `
        <div class="hypothesis-option" id="hyp-1">
            <div class="hypothesis-header">
                <h4><i class="fa-solid fa-robot text-accent" style="margin-right:5px;"></i> Option A (Primary AI Deduction)</h4>
                <span class="badge bg-healthy"><i class="fa-solid fa-check-double"></i> ${primaryConfidence}% Confidence</span>
            </div>
            <div class="hypothesis-text">${primaryReasoning}</div>
            <div class="hypothesis-actions">
                <button class="btn btn-sm btn-accept" onclick="selectHypothesis('hyp-1', 'hyp-2')"><i class="fa-solid fa-check"></i> Accept</button>
                <button class="btn btn-sm btn-reject" onclick="rejectHypothesis('hyp-1')"><i class="fa-solid fa-xmark"></i> Reject</button>
            </div>
        </div>
        
        <div class="hypothesis-option" id="hyp-2">
            <div class="hypothesis-header">
                <h4><i class="fa-solid fa-code-branch text-warning" style="margin-right:5px;"></i> Option B (Alternative Edge-Case)</h4>
                <span class="badge" style="background:var(--bg-base); color:var(--text-muted); border:1px solid var(--border-color);"><i class="fa-solid fa-code-compare"></i> ${secondaryConfidence}% Confidence</span>
            </div>
            <div class="hypothesis-text">${secondaryReasoning}</div>
            <div class="hypothesis-actions">
                <button class="btn btn-sm btn-accept" onclick="selectHypothesis('hyp-2', 'hyp-1')"><i class="fa-solid fa-check"></i> Accept</button>
                <button class="btn btn-sm btn-reject" onclick="rejectHypothesis('hyp-2')"><i class="fa-solid fa-xmark"></i> Reject</button>
            </div>
        </div>
    `;

    content.innerHTML = `
        <div class="modal-header">
            <h2><i class="fa-solid fa-magnifying-glass-chart text-accent"></i> Incident Intelligence: ${inc.title}</h2>
            <button class="btn-close" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body">
            <div class="intelligence-section">
                <h3>Observed Evidence</h3>
                ${evidenceHTML}
            </div>
            
            <div class="intelligence-section">
                <h3>Correlated Indicators</h3>
                ${correlationHTML}
            </div>
            
            <div class="intelligence-section">
                <h3 style="text-transform:uppercase; font-size:0.8rem; color:var(--text-muted); margin-bottom:1rem; letter-spacing:0.5px;">Root-Cause Hypothesis Generation</h3>
                <div class="hypothesis-block" style="background: transparent; padding: 0; border: none;">
                    ${hypothesisOptionsHTML}
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-outline" onclick="closeModal()">Close Analysis</button>
            <button class="btn btn-primary" id="btn-gen-brief" onclick="generateDecisionBrief('${incidentId}')">
                <i class="fa-solid fa-file-signature"></i> Generate Reasoning Brief
            </button>
        </div>
    `;
    
    modal.classList.remove('hidden');
};

window.closeModal = () => {
    document.getElementById('incident-modal').classList.add('hidden');
};

window.selectHypothesis = (selectedId, otherId) => {
    const sel = document.getElementById(selectedId);
    const oth = document.getElementById(otherId);
    
    if(sel) {
        sel.classList.add('accepted');
        sel.classList.remove('rejected');
        const btn = sel.querySelector('.btn-accept');
        btn.innerHTML = '<i class="fa-solid fa-check-double"></i> Accepted';
    }
    if(oth) {
        oth.classList.add('rejected');
        oth.classList.remove('accepted');
        const othBtn = oth.querySelector('.btn-accept');
        othBtn.innerHTML = '<i class="fa-solid fa-check"></i> Accept';
    }
    
    const genBtn = document.getElementById('btn-gen-brief');
    if(genBtn) {
        genBtn.title = "Ready to generate brief based on selected hypothesis";
    }
};

window.rejectHypothesis = (id) => {
    const el = document.getElementById(id);
    if(el) {
        el.classList.add('rejected');
        el.classList.remove('accepted');
        
        const btn = el.querySelector('.btn-accept');
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Accept';
    }
};

// ==========================================
// Screen 3: KPI Drilldown
// ==========================================
let kpiChartInstance = null;

window.renderScreen3 = (dm, container) => {
    document.getElementById('page-title-text').innerText = 'KPI Drilldown Analysis';
    
    container.innerHTML = `
        <div class="drilldown-container">
            <div class="filter-panel bg-surface">
                <div class="filter-group">
                    <label>Service</label>
                    <select id="dd-service" class="form-select">
                        <option value="">Select Service...</option>
                        ${dm.data.services.map(s => `<option value="${s.service_id}">${s.name}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-group">
                    <label>Domain</label>
                    <select id="dd-domain" class="form-select" disabled>
                        <option value="">Select Domain...</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Network Element</label>
                    <select id="dd-element" class="form-select" disabled>
                        <option value="">Select Element...</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>KPI</label>
                    <select id="dd-kpi" class="form-select" disabled>
                        <option value="">Select KPI...</option>
                    </select>
                </div>
            </div>

            <div id="drilldown-results" class="hidden" style="margin-top: 2.5rem;">
                <div class="drilldown-metrics kpi-grid" id="dd-metrics">
                    <!-- Metrics injected here -->
                </div>
                <div class="chart-panel" style="margin-top: 2rem;">
                    <h3 style="margin-bottom: 1rem; color: var(--text-muted); text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.5px;">24-Hour Trend vs Baseline</h3>
                    <div style="position: relative; height: 350px; width: 100%;">
                        <canvas id="kpiChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `;

    const srv = document.getElementById('dd-service');
    const dom = document.getElementById('dd-domain');
    const ele = document.getElementById('dd-element');
    const kpi = document.getElementById('dd-kpi');
    
    srv.addEventListener('change', (e) => {
        if(!e.target.value) { dom.disabled = true; ele.disabled = true; kpi.disabled = true; return; }
        const domains = [...new Set(dm.data.networkElements.map(n => n.domain))];
        dom.innerHTML = '<option value="">Select Domain...</option>' + domains.map(d => `<option value="${d}">${d}</option>`).join('');
        dom.disabled = false; ele.disabled = true; kpi.disabled = true;
        document.getElementById('drilldown-results').classList.add('hidden');
    });

    dom.addEventListener('change', (e) => {
        if(!e.target.value) { ele.disabled = true; kpi.disabled = true; return; }
        const elements = dm.data.networkElements.filter(n => n.domain === e.target.value);
        ele.innerHTML = '<option value="">Select Element...</option>' + elements.map(el => `<option value="${el.element_id}">${el.element_id} (${el.type})</option>`).join('');
        ele.disabled = false; kpi.disabled = true;
        document.getElementById('drilldown-results').classList.add('hidden');
    });

    ele.addEventListener('change', (e) => {
        if(!e.target.value) { kpi.disabled = true; return; }
        const kpis = dm.data.kpis.filter(k => k.element_id === e.target.value);
        kpi.innerHTML = '<option value="">Select KPI...</option>' + kpis.map(k => `<option value="${k.kpi_id}">${k.name}</option>`).join('');
        kpi.disabled = false;
        document.getElementById('drilldown-results').classList.add('hidden');
    });

    kpi.addEventListener('change', (e) => {
        if(!e.target.value) { document.getElementById('drilldown-results').classList.add('hidden'); return; }
        const selectedKpi = dm.data.kpis.find(k => k.kpi_id === e.target.value);
        renderDrilldownResults(selectedKpi);
    });
};

function renderDrilldownResults(kpiData) {
    document.getElementById('drilldown-results').classList.remove('hidden');
    
    const isSuccessKpi = kpiData.name === "Session Success";
    const deviation = ((kpiData.current_value - kpiData.baseline_value) / kpiData.baseline_value * 100).toFixed(1);
    const isPositive = deviation > 0;
    
    let isBad = false;
    if (isSuccessKpi && kpiData.current_value < kpiData.baseline_value) isBad = true;
    if (!isSuccessKpi && kpiData.current_value > kpiData.baseline_value) isBad = true;

    const thresholdStr = (kpiData.name === "Session Success") ? "< 99.0%" : 
                         (kpiData.name === "Latency") ? "> 150ms" : 
                         (kpiData.name === "Packet Loss") ? "> 0.5%" : "> 85.0%";

    document.getElementById('dd-metrics').innerHTML = `
        <div class="kpi-card bg-surface">
            <div class="kpi-title">Current Value</div>
            <div class="kpi-value ${isBad ? 'text-critical' : 'text-healthy'}">${kpiData.current_value}${kpiData.unit}</div>
        </div>
        <div class="kpi-card bg-surface">
            <div class="kpi-title">Baseline (24h)</div>
            <div class="kpi-value">${kpiData.baseline_value}${kpiData.unit}</div>
        </div>
        <div class="kpi-card bg-surface">
            <div class="kpi-title">Deviation</div>
            <div class="kpi-value ${isBad ? 'text-critical' : 'text-healthy'}">
                ${isPositive ? '+' : ''}${deviation}%
            </div>
        </div>
        <div class="kpi-card bg-surface">
            <div class="kpi-title">SLA Threshold</div>
            <div class="kpi-value" style="font-size:1.8rem; color: var(--text-muted);">${thresholdStr}</div>
        </div>
        <div class="kpi-card bg-surface">
            <div class="kpi-title">Trend Pattern</div>
            <div class="kpi-value ${isBad ? 'text-critical' : 'text-healthy'}"><i class="fa-solid fa-arrow-trend-${isPositive ? 'up' : 'down'}"></i></div>
        </div>
    `;

    const labels = Array.from({length: 24}, (_, i) => {
        const d = new Date();
        d.setHours(d.getHours() - (23 - i));
        return `${String(d.getHours()).padStart(2, '0')}:00`;
    });
    
    const dataPoints = [];
    let val = kpiData.baseline_value;
    for(let i=0; i<23; i++) {
        if(i > 18 && isBad) {
            val = val + (kpiData.current_value - val) * 0.4;
        } else {
            val = kpiData.baseline_value + (Math.random() - 0.5) * (kpiData.baseline_value * 0.15);
        }
        dataPoints.push(val);
    }
    dataPoints.push(kpiData.current_value);

    const ctx = document.getElementById('kpiChart').getContext('2d');
    if(kpiChartInstance) kpiChartInstance.destroy();

    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = 'Inter';

    kpiChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: kpiData.name,
                    data: dataPoints,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    borderWidth: 2,
                    pointRadius: i => (i.index === 23) ? 6 : 0,
                    pointHoverRadius: 6,
                    pointBackgroundColor: i => (i.index === 23) ? (isBad ? '#ef4444' : '#3b82f6') : '#3b82f6',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Baseline',
                    data: Array(24).fill(kpiData.baseline_value),
                    borderColor: '#10b981',
                    borderWidth: 1.5,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { position: 'top', align: 'end' },
                tooltip: { 
                    backgroundColor: 'rgba(15, 17, 21, 0.9)',
                    titleColor: '#e2e8f0',
                    bodyColor: '#e2e8f0',
                    borderColor: '#2e3440',
                    borderWidth: 1,
                    padding: 10
                }
            },
            scales: {
                y: {
                    grid: { color: '#2e3440' },
                    ticks: { callback: (value) => value + kpiData.unit }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

// ==========================================
// Screen 4: Incident Intelligence
// ==========================================
window.renderScreenIncidentIntel = (dm, container) => {
    document.getElementById('page-title-text').innerText = 'Incident Intelligence & Data Engineering';
    
    container.innerHTML = `
        <div class="tabs-header">
            <button class="tab-btn active" onclick="switchIntelTab(event, 'builder')"><i class="fa-solid fa-cogs"></i> Dataset Builder</button>
            <button class="tab-btn" onclick="switchIntelTab(event, 'manual')"><i class="fa-solid fa-file-pen"></i> Issue Records (Manual)</button>
        </div>

        <div class="tabs-body">
            <div id="tab-builder" class="tab-content active">
                <div class="builder-card">
                    <div class="builder-header">
                        <h3><i class="fa-solid fa-database text-accent"></i> Synthetic Dataset Builder</h3>
                        <p>Configure parameters to generate large-scale, mathematically correlated operational datasets.</p>
                    </div>
                    <div class="form-grid">
                        <div class="form-group"><label>Target Record Volume</label><input type="number" class="form-control" value="5000" /></div>
                        <div class="form-group">
                            <label>Time Window Span</label>
                            <select class="form-control"><option>Last 24 Hours</option><option>Last 7 Days</option></select>
                        </div>
                        <div class="form-group">
                            <label>Target Network Domains</label>
                            <select class="form-control"><option>Packet Core & Control Core</option><option>RAN & Transport</option></select>
                        </div>
                        <div class="form-group"><label>Base Anomaly Density (%)</label><input type="number" class="form-control" value="15" /></div>
                        <div class="form-group">
                            <label>Chaos Injection</label>
                            <select class="form-control"><option>Low</option><option selected>Medium</option><option>High</option></select>
                        </div>
                        <div class="form-group">
                            <label>Export Format</label>
                            <select class="form-control"><option>JSON Array</option><option>CSV</option></select>
                        </div>
                    </div>
                    <div class="mt-2" style="border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
                        <button class="btn btn-primary"><i class="fa-solid fa-play"></i> Generate Dataset</button>
                    </div>
                </div>
            </div>

            <div id="tab-manual" class="tab-content hidden">
                <div class="builder-card">
                    <div class="builder-header">
                        <h3><i class="fa-solid fa-file-pen text-accent"></i> Create Issue Record</h3>
                        <p>Manually inject specific anomaly edge-cases into the dataset.</p>
                    </div>
                    <div class="form-grid">
                        <div class="form-group"><label>Incident Title</label><input type="text" class="form-control" placeholder="e.g., UPF Resource Exhaustion Spike" /></div>
                        <div class="form-group"><label>Affected Service</label><input type="text" class="form-control" placeholder="e.g., Mobile Data" /></div>
                        <div class="form-group"><label>Probable Domain</label><input type="text" class="form-control" placeholder="e.g., Packet Core" /></div>
                        <div class="form-group"><label>Element ID</label><input type="text" class="form-control" placeholder="e.g., UPF-04" /></div>
                        <div class="form-group">
                            <label>Severity Level</label>
                            <select class="form-control">
                                <option value="" disabled selected style="color:var(--text-muted)">Select Severity...</option>
                                <option>SEV-1 (Critical)</option>
                                <option>SEV-2 (High)</option>
                            </select>
                        </div>
                        <div class="form-group"><label>Key Metric Deviation</label><input type="text" class="form-control" placeholder="e.g., Latency +380ms" /></div>
                        <div class="form-group"><label>Estimated Exposure ($)</label><input type="text" class="form-control" placeholder="e.g., $145,000" /></div>
                    </div>
                    <div class="mt-2" style="border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
                        <button class="btn btn-primary"><i class="fa-solid fa-plus"></i> Save Record</button>
                    </div>
                </div>
            </div>
        </div>
    `;
};

window.switchIntelTab = (e, tabId) => {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    e.currentTarget.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
    document.getElementById(`tab-${tabId}`).classList.remove('hidden');
};

// ==========================================
// Screen 5: Operational Decision Brief
// ==========================================
window.renderScreenDecisionBriefEmpty = (container) => {
    document.getElementById('page-title-text').innerText = 'Operational Decision Briefs';
    container.innerHTML = `
        <div class="loading-state">
            <i class="fa-solid fa-file-signature" style="font-size: 3rem; color: var(--border-color); margin-bottom: 1rem;"></i>
            <h3 style="color: var(--text-primary); font-size: 1.5rem;">No Brief Selected</h3>
            <p style="margin-top:0.5rem;">Select an incident and click "Generate Reasoning Brief".</p>
        </div>
    `;
};

window.generateDecisionBrief = (incidentId) => {
    closeModal();
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('nav-ai').classList.add('active');
    
    const dm = window.appDataManager;
    const inc = dm.data.incidents.find(i => i.incident_id === incidentId);
    const rec = dm.data.recommendations.find(r => r.incident_id === incidentId);
    const container = document.getElementById('dashboard-content');
    
    if(!inc || !rec) {
        alert("Recommendation data not found.");
        return;
    }

    document.getElementById('page-title-text').innerText = 'Operational Decision Brief';

    const actionsHtml = rec.actions.map(act => `<li><input type="checkbox" /> <span>${act}</span></li>`).join('');

    const approvalRequiredStr = rec.approval_required ? 
        `<span class="badge bg-critical"><i class="fa-solid fa-lock" style="margin-right:4px;"></i> Required</span>` : 
        `<span class="badge bg-healthy"><i class="fa-solid fa-lock-open" style="margin-right:4px;"></i> Auto-Execute Allowed</span>`;

    container.innerHTML = `
        <div class="brief-container">
            <div class="brief-header">
                <div class="badge bg-critical" style="margin-bottom: 0.75rem;">${inc.severity}</div>
                <h2 style="font-size: 1.8rem; color: var(--text-primary);">${inc.title}</h2>
                <div class="issue-meta mt-2" style="font-size: 0.95rem;">
                    <span><i class="fa-solid fa-server"></i> ${inc.domain} (${inc.element_id})</span>
                    <span><i class="fa-regular fa-clock"></i> Incident ID: ${inc.incident_id}</span>
                </div>
            </div>
            
            <div class="brief-grid">
                <div class="brief-left">
                    <div class="brief-card">
                        <h3><i class="fa-solid fa-crosshairs"></i> Situation</h3>
                        <p style="font-size: 1.1rem; line-height: 1.6; color: var(--text-primary);">${rec.situation}</p>
                    </div>
                    
                    <div class="brief-card">
                        <h3><i class="fa-solid fa-microchip text-accent"></i> AI Assessment & Reasoning</h3>
                        <p style="font-size: 1.1rem; line-height: 1.6; margin-bottom: 1.25rem; color: var(--text-primary);"><strong>${rec.assessment}</strong></p>
                        <div style="background: rgba(255,255,255,0.03); padding: 1rem; border-left: 3px solid var(--border-color);">
                            <p style="color: var(--text-muted); line-height: 1.6; font-style: italic;">"${rec.ai_reasoning}"</p>
                        </div>
                    </div>
                    
                    <div class="brief-card">
                        <h3><i class="fa-solid fa-list-check"></i> Recommended Actions</h3>
                        <ul class="action-list">
                            ${actionsHtml}
                        </ul>
                    </div>
                    
                    <div class="brief-card" style="margin-top: 1.5rem;">
                        <h3><i class="fa-solid fa-timeline text-warning"></i> RAG Knowledgebase: Historical Precedents</h3>
                        <ul style="list-style: none; padding: 0; margin-top: 1rem; display: flex; flex-direction: column; gap: 0.75rem;">
                            <li style="padding: 0.85rem 1rem; background: var(--bg-base); border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.95rem; border-left: 3px solid var(--status-healthy);">
                                <div style="display:flex; justify-content: space-between; margin-bottom: 0.4rem;">
                                    <span class="text-accent" style="font-weight: 600;"><i class="fa-solid fa-file-pdf"></i> INC-2024-8891 (Resolved)</span>
                                    <span class="badge" style="background: rgba(16, 185, 129, 0.1); color: var(--status-healthy); border: 1px solid rgba(16, 185, 129, 0.3);">98% Vector Match</span>
                                </div>
                                <span style="color: var(--text-muted); line-height: 1.5; display: block;">Resolved by executing identical routing isolation protocol and line-card reset.</span>
                            </li>
                            <li style="padding: 0.85rem 1rem; background: var(--bg-base); border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.95rem; border-left: 3px solid var(--status-warning);">
                                <div style="display:flex; justify-content: space-between; margin-bottom: 0.4rem;">
                                    <span class="text-accent" style="font-weight: 600;"><i class="fa-solid fa-file-pdf"></i> INC-2025-0142 (Escalated)</span>
                                    <span class="badge" style="background: rgba(245, 158, 11, 0.1); color: var(--status-warning); border: 1px solid rgba(245, 158, 11, 0.3);">82% Vector Match</span>
                                </div>
                                <span style="color: var(--text-muted); line-height: 1.5; display: block;">Attempted soft-restart failed; Field maintenance L3 hardware replacement was ultimately required.</span>
                            </li>
                        </ul>
                    </div>
                </div>
                
                <div class="brief-right">
                    <div class="brief-card killer-block">
                        <h3><i class="fa-solid fa-scale-balanced"></i> Evidence vs Recommendation</h3>
                        <div class="metric-row">
                            <span class="metric-label">Evidence Completeness</span>
                            <span class="metric-value">${inc.evidence_completeness}%</span>
                        </div>
                        <div class="metric-row">
                            <span class="metric-label">Recommendation Confidence</span>
                            <span class="metric-value text-accent">${inc.correlation_confidence}%</span>
                        </div>
                        <div class="metric-row">
                            <span class="metric-label">Action Risk</span>
                            <span class="metric-value ${rec.risk_level === 'High' || rec.risk_level === 'Critical' ? 'text-critical' : 'text-warning'}">${rec.risk_level}</span>
                        </div>
                        <div class="metric-row">
                            <span class="metric-label">Human Approval</span>
                            <span class="metric-value">${approvalRequiredStr}</span>
                        </div>
                    </div>
                    
                    <div class="brief-card">
                        <h3><i class="fa-solid fa-bolt"></i> Operational Impact</h3>
                        <div class="metric-row">
                            <span class="metric-label">Affected Sessions</span>
                            <span class="metric-value">${(inc.impact.estimated_affected_sessions / 1000000).toFixed(1)}M</span>
                        </div>
                        <div class="metric-row">
                            <span class="metric-label">Financial Exposure</span>
                            <span class="metric-value text-critical">$${inc.impact.estimated_exposure_usd.toLocaleString()}</span>
                        </div>
                        <div class="metric-row">
                            <span class="metric-label">Current Duration</span>
                            <span class="metric-value">${inc.impact.duration_minutes} min</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="approval-bar">
                <div class="governance-warning">
                    <i class="fa-solid fa-shield-halved" style="font-size: 1.8rem;"></i>
                    <div>
                        <div style="color: var(--text-primary); text-transform: uppercase;">Governance Check: Human Approval Required</div>
                        <div style="font-weight: 400; opacity: 0.85;">Review operational evidence before approving execution.</div>
                    </div>
                </div>
                <div style="display: flex; gap: 1rem;">
                    <button class="btn btn-outline" style="padding: 1rem 1.5rem; font-size: 1.05rem; border-color: var(--accent-color); color: var(--accent-color);" onclick="previewLLMCmds('${incidentId}')">
                        <i class="fa-solid fa-wand-magic-sparkles"></i> Preview LLM Payload
                    </button>
                    <button class="btn btn-primary" style="padding: 1rem 2rem; font-size: 1.1rem;" onclick="executeApprovedActions('${incidentId}')">
                        <i class="fa-solid fa-fingerprint"></i> Approve & Execute Actions
                    </button>
                </div>
            </div>
        </div>
    `;
};

// ==========================================
// Application Bootstrap
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    const dataManager = new DataManager();
    window.appDataManager = dataManager; 
    
    const contentArea = document.getElementById('dashboard-content');
    const isLoaded = await dataManager.initialize();
    
    if (isLoaded) {
        const health = dataManager.getOverallNetworkHealth();
        const badge = document.getElementById('network-health-badge');
        
        badge.innerHTML = `<i class="fa-solid ${health.icon}"></i> ${health.status}`;
        badge.className = `badge bg-${health.color}`;
        
        const navCmd = document.getElementById('nav-cmd');
        const navKpi = document.getElementById('nav-kpi');
        const navInc = document.getElementById('nav-inc');
        const navAi = document.getElementById('nav-ai');

        const clearNav = () => document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

        navCmd.addEventListener('click', (e) => {
            e.preventDefault(); clearNav(); navCmd.classList.add('active');
            renderScreen1(dataManager, contentArea);
        });

        navKpi.addEventListener('click', (e) => {
            e.preventDefault(); clearNav(); navKpi.classList.add('active');
            window.renderScreen3(dataManager, contentArea);
        });
        
        navInc.addEventListener('click', (e) => {
            e.preventDefault(); clearNav(); navInc.classList.add('active');
            window.renderScreenIncidentIntel(dataManager, contentArea);
        });

        navAi.addEventListener('click', (e) => {
            e.preventDefault(); clearNav(); navAi.classList.add('active');
            window.renderScreenDecisionBriefEmpty(contentArea);
        });

        renderScreen1(dataManager, contentArea);
    } else {
        contentArea.innerHTML = `
            <div style="background: var(--status-critical-bg); padding: 2rem; border-radius: var(--radius-lg); border: 1px solid var(--status-critical);">
                <h3 style="margin-bottom: 1rem; color: var(--status-critical);"><i class="fa-solid fa-triangle-exclamation"></i> Data Loading Failed</h3>
            </div>
        `;
    }
});

export { DataManager };


// ==========================================
// Execution Simulation Logic
// ==========================================
window.executeApprovedActions = (incidentId) => {
    const dm = window.appDataManager;
    const inc = dm.data.incidents.find(i => i.incident_id === incidentId);
    if(!inc) return;

    // Check if overlay already exists and remove it
    let existingOverlay = document.getElementById('execution-simulator');
    if(existingOverlay) existingOverlay.remove();

    // Create the overlay container
    const overlay = document.createElement('div');
    overlay.className = 'exec-overlay';
    overlay.id = 'execution-simulator';

    overlay.innerHTML = `
        <div class="exec-modal">
            <div class="exec-header">
                <h2><i class="fa-solid fa-terminal text-accent"></i> Executing Policy Actions: ${inc.element_id}</h2>
                <span class="badge bg-watch"><i class="fa-solid fa-circle-notch fa-spin"></i> In Progress</span>
            </div>
            
            <div class="terminal-window" id="term-output">
                <div>> Initializing secure API connection to ${inc.element_id}...</div>
            </div>
            
            <div class="metric-comparison hidden" id="comparison-view">
                <div class="metric-col">
                    <h4>Before Execution (Degraded)</h4>
                    <div class="metric-box before">
                        <span class="metric-name">Latency</span>
                        <span class="metric-val text-critical">${inc.metrics_snapshot.latency_ms}ms</span>
                    </div>
                    <div class="metric-box before">
                        <span class="metric-name">Packet Loss</span>
                        <span class="metric-val text-critical">${inc.metrics_snapshot.packet_loss_pct}%</span>
                    </div>
                    <div class="metric-box before">
                        <span class="metric-name">Session Failure</span>
                        <span class="metric-val text-critical">${inc.metrics_snapshot.session_failure_pct}%</span>
                    </div>
                </div>
                <div class="metric-col">
                    <h4>After Execution (Recovered)</h4>
                    <div class="metric-box after">
                        <span class="metric-name">Latency</span>
                        <span class="metric-val loading" id="val-lat">Monitoring...</span>
                    </div>
                    <div class="metric-box after">
                        <span class="metric-name">Packet Loss</span>
                        <span class="metric-val loading" id="val-pkt">Monitoring...</span>
                    </div>
                    <div class="metric-box after">
                        <span class="metric-name">Session Failure</span>
                        <span class="metric-val loading" id="val-ses">Monitoring...</span>
                    </div>
                </div>
            </div>
            
            <div class="exec-header hidden" id="exec-footer" style="justify-content: flex-end; border-top: 1px solid var(--border-color); border-bottom: none;">
                <button class="btn btn-primary" onclick="resolveIncident('${incidentId}')">
                    <i class="fa-solid fa-check-double"></i> Acknowledge & Close Incident
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);

    // Simulation sequence
    const term = document.getElementById('term-output');
    const steps = [
        `> Authenticating with Policy Control Gateway... OK.`,
        `> Pushing target configuration delta to ${inc.domain} (${inc.element_id})...`,
        `> Committing changes... OK.`,
        `> Initiating soft-restart of affected services...`,
        `> Service restart successful. Re-establishing sessions...`,
        `> Running post-execution health verification script...`,
        `> Gathering live telemetry metrics...`,
        `<span style="color:var(--status-healthy); font-weight:bold;">> SUCCESS: Telemetry matches baseline SLA. Incident mitigated.</span>`
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
        if(stepIdx < steps.length) {
            const newDiv = document.createElement('div');
            newDiv.innerHTML = steps[stepIdx];
            term.appendChild(newDiv);
            term.scrollTop = term.scrollHeight;
            stepIdx++;
        } else {
            clearInterval(interval);
            // Change badge
            const badge = overlay.querySelector('.badge');
            badge.className = 'badge bg-healthy';
            badge.innerHTML = '<i class="fa-solid fa-check"></i> Completed';
            
            // Show comparison
            showComparison(inc);
        }
    }, 700);
};

function showComparison(inc) {
    document.getElementById('comparison-view').classList.remove('hidden');
    
    // Simulate telemetry trickling in
    const baseLat = inc.metrics_snapshot.baseline_latency_ms;
    
    setTimeout(() => { 
        const el = document.getElementById('val-lat');
        el.className = 'metric-val text-healthy';
        el.innerText = `${baseLat + Math.floor(Math.random()*5)}ms`; 
    }, 600);
    
    setTimeout(() => { 
        const el = document.getElementById('val-pkt');
        el.className = 'metric-val text-healthy';
        el.innerText = `0.0%`; 
    }, 1200);
    
    setTimeout(() => { 
        const el = document.getElementById('val-ses');
        el.className = 'metric-val text-healthy';
        el.innerText = `0.1%`; 
        
        // Show acknowledge button
        document.getElementById('exec-footer').classList.remove('hidden');
    }, 1800);
}

window.resolveIncident = (incidentId) => {
    // Remove the execution modal overlay
    const overlay = document.getElementById('execution-simulator');
    if(overlay) overlay.remove();

    const dm = window.appDataManager;
    const inc = dm.data.incidents.find(i => i.incident_id === incidentId);
    
    if(inc) {
        // Change status to Resolved so it disappears from the Active SEV list
        inc.status = 'Resolved';
    }
    
    // Switch Navigation visually back to Operations Command
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('nav-cmd').classList.add('active');
    
    // Re-render the main dashboard. 
    // This will recalculate the network health (Open SEVs count drops!)
    window.renderScreen1(dm, document.getElementById('dashboard-content'));
    
    // Optionally trigger a toast notification (simulated with alert for simplicity, or just let UI speak for itself)
    // We let the UI speak for itself: the Open SEVs KPI goes down, and the card is gone.
};


// ==========================================
// LLM Integration Previews
// ==========================================
window.previewLLMCmds = (incidentId) => {
    const dm = window.appDataManager;
    const inc = dm.data.incidents.find(i => i.incident_id === incidentId);
    if(!inc) return;

    let existingOverlay = document.getElementById('llm-preview-simulator');
    if(existingOverlay) existingOverlay.remove();

    const overlay = document.createElement('div');
    overlay.className = 'exec-overlay';
    overlay.id = 'llm-preview-simulator';

    let syntaxType = "Ansible Playbook / CLI";
    let codeContent = "";
    
    const domainLower = inc.domain.toLowerCase();
    
    if (domainLower.includes('transport') || domainLower.includes('router') || domainLower.includes('ip')) {
        syntaxType = "Cisco IOS-XR (Netconf/CLI)";
        codeContent = `! LLM Generated Execution Payload\n! Target: ${inc.element_id}\n! Context: ${inc.incident_id}\n\nconfig terminal\n router bgp 65000\n  neighbor 192.168.10.5\n   shutdown\n   description *** ISOLATED BY TELCO-OPS AI Copilot ***\n  exit\n exit\ncommit\n`;
    } else if (domainLower.includes('core') || domainLower.includes('upf') || domainLower.includes('amf') || domainLower.includes('smf')) {
        syntaxType = "Kubernetes / Helm (Cloud-Native 5G Core)";
        codeContent = `# LLM Generated Execution Payload\n# Target: ${inc.element_id} (Namespace: 5g-core-prod)\n# Context: ${inc.incident_id}\n\nkubectl drain node-${inc.element_id} --ignore-daemonsets --delete-emptydir-data\nkubectl scale deployment upf-user-plane --replicas=0 -n 5g-core-prod\nsleep 5\nkubectl scale deployment upf-user-plane --replicas=3 -n 5g-core-prod\nkubectl wait --for=condition=ready pod -l app=upf -n 5g-core-prod --timeout=60s\n`;
    } else {
        syntaxType = "Ericsson ENM (CLI / MO Script)";
        codeContent = `# LLM Generated Execution Payload\n# Target: ${inc.element_id}\n# Context: ${inc.incident_id}\n\ncmedit set SubNetwork=ONRM_ROOT_MO,SubNetwork=${inc.element_id},ManagedElement=${inc.element_id} administrativeState=LOCKED\nwait 10\ncmedit action SubNetwork=ONRM_ROOT_MO,SubNetwork=${inc.element_id},ManagedElement=${inc.element_id} restart\n`;
    }

    overlay.innerHTML = `
        <div class="exec-modal" style="width: 850px; max-width: 95%;">
            <div class="exec-header" style="background: rgba(59, 130, 246, 0.1); border-bottom: 1px solid rgba(59, 130, 246, 0.3);">
                <h2><i class="fa-solid fa-wand-magic-sparkles text-accent"></i> LLM Intent-to-Code Translation</h2>
                <button class="btn-close" onclick="document.getElementById('llm-preview-simulator').remove()"><i class="fa-solid fa-xmark"></i></button>
            </div>
            
            <div style="padding: 1.5rem; background: var(--bg-surface);">
                <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1rem; display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
                    <span class="badge" style="background: var(--bg-base); border: 1px solid var(--border-color);"><strong>Model:</strong> On-Premise Llama-3 (Telco Fine-Tuned)</span>
                    <span class="badge" style="background: var(--bg-base); border: 1px solid var(--border-color);"><strong>Target Syntax:</strong> ${syntaxType}</span>
                </div>
                
                <div style="background: #0d0f12; border: 1px solid #1e293b; border-radius: var(--radius-md); overflow: hidden;">
                    <div style="background: #1e293b; padding: 0.6rem 1rem; font-family: 'Inter', sans-serif; font-size: 0.8rem; color: #94a3b8; display: flex; justify-content: space-between; align-items: center;">
                        <span><i class="fa-solid fa-file-code" style="margin-right: 5px;"></i> generated_payload.sh</span>
                        <i class="fa-regular fa-copy cursor-pointer" title="Copy Payload" onclick="alert('Payload Copied')"></i>
                    </div>
                    <pre style="padding: 1.5rem; margin: 0; color: #e2e8f0; font-family: 'Courier New', monospace; font-size: 1rem; line-height: 1.6; overflow-x: auto; white-space: pre-wrap; min-height: 150px;" id="llm-code-output"></pre>
                </div>
            </div>
            
            <div class="exec-header" style="justify-content: space-between; border-top: 1px solid var(--border-color); border-bottom: none; background: var(--bg-base); padding: 1rem 1.5rem;">
                <div style="color: var(--text-muted); font-size: 0.85rem;">
                    <i class="fa-solid fa-shield-halved" style="color: var(--status-warning);"></i> Sandboxed preview. Code has not been applied to the network element.
                </div>
                <button class="btn btn-primary" onclick="document.getElementById('llm-preview-simulator').remove()">Close Preview</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);

    const out = document.getElementById('llm-code-output');
    let i = 0;
    const speed = 15; 
    
    function typeWriter() {
        if (i < codeContent.length) {
            out.innerHTML += codeContent.charAt(i);
            i++;
            setTimeout(typeWriter, speed);
        }
    }
    
    setTimeout(typeWriter, 500); // 500ms fake inference delay
};
