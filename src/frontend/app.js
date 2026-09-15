/* ============================================================
   ArcGuardAI – Clinical Risk Intelligence Frontend v2
   Reference-matched teal theme · Material Symbols icons
   Inter + JetBrains Mono · Pharma-grade restraint
   ============================================================ */

// ── Tiny utilities ──────────────────────────────────────────
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ── Material Symbols icon helper ────────────────────────────
const icon = (name, opts = {}) => {
  const cls = opts.filled ? 'material-symbols-outlined filled' : 'material-symbols-outlined';
  const size = opts.size ? ` style="font-size:${opts.size}px"` : '';
  return `<span class="${cls}" aria-hidden="true"${size}>${name}</span>`;
};

// ── Icon mapping (nav + features) ───────────────────────────
const navIcons = {
  overview:     'dashboard',
  sites:        'monitoring',
  deviations:   'warning',
  participants: 'group',
  capa:         'checklist',
  reports:      'description',
  rules:        'verified_user',
  settings:     'settings',
};

// ── Badge rendering ─────────────────────────────────────────
const badge = (v, variant = '') => {
  const key = String(v).toLowerCase();
  const cls = key.replaceAll(' ', '-');
  const labels = {
    major: 'Major', minor: 'Minor', administrative: 'Administrative',
    critical: 'Critical', high: 'High', moderate: 'Moderate', low: 'Low',
    open: 'Open', 'under review': 'Under Review', confirmed: 'Confirmed',
    dismissed: 'Dismissed', draft: 'Draft', 'in progress': 'In Progress',
    'effectiveness check': 'Effectiveness Check', closed: 'Closed',
    'needs review': 'Needs Review', 'needs-review': 'Needs Review',
    overdue: 'Overdue', resolved: 'Resolved',
  };
  const label = labels[key] || v;
  const isRisk = ['critical', 'high', 'moderate', 'low'].includes(key);
  if (isRisk && variant === 'pill') {
    return `<span class="badge risk-pill ${cls}"><span class="risk-dot"></span>${esc(label)}</span>`;
  }
  return `<span class="badge ${cls}">${esc(label)}</span>`;
};

// ── Tooltip helper ─────────────────────────────────────────
const tip = (label, explanation) =>
  `<span class="help-tip" tabindex="0">${esc(label)}<span class="ht-icon" title="${esc(explanation)}">?</span><span class="ht-bubble">${esc(explanation)}</span></span>`;

// ── App state ─────────────────────────────────────────────
let data, source, asOf = '2026-09-15', page = 'overview';
let filter = { q: '', severity: 'all', site: 'all' }, offset = 0;
let lastLoad = null;
let selectedSite = null;
let selectedParticipant = null;
let selectedCapa = null;
let capaView = 'list'; // 'list' or 'kanban'

// ── Navigation labels ─────────────────────────────────────
const labels = {
  overview:     'Overview',
  sites:        'Site Risk',
  deviations:   'Deviations',
  participants: 'Participant Review',
  capa:         'CAPA',
  reports:      'Reports',
  rules:        'Protocol Rules',
  settings:     'Settings',
};

// ── Page titles & descriptions ────────────────────────────
const titles = {
  overview:     ['Trial Risk Overview', 'Early visibility into site-level protocol risk and deviations.'],
  sites:        ['Site Risk Monitor', 'Identify high-risk sites and understand the deviations driving their risk.'],
  deviations:   ['Protocol Deviations', 'Review flagged deviations across active protocols with full evidence.'],
  participants: ['Participant Review', 'Review participant-level protocol compliance across visits, dosing, assessments and medications.'],
  capa:         ['CAPA Management', 'Manage corrective and preventive actions triggered by clinical trial protocol deviations.'],
  reports:      ['Reports & Exports', 'Download official reports for regulatory inspections, quality review, or team sharing.'],
  rules:        ['Protocol Rules', 'Active protocol parameters that define deviation detection criteria.'],
  settings:     ['Settings & Configuration', 'System configuration, data management, and audit history.'],
};

// ── Toast notification ────────────────────────────────────
function toast(message, error = false) {
  const el = $('#toast');
  el.textContent = message;
  el.className = error ? 'error' : '';
  el.style.display = 'block';
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.style.display = 'none', 6000);
}

// ── API calls ─────────────────────────────────────────────
async function api(path, body) {
  const res = await fetch(path, {
    ...(body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, asOf }) } : {})
  });
  const result = await res.json();
  if (!res.ok) throw Error(result.error || 'Request failed');
  return result;
}

// ── Load data ─────────────────────────────────────────────
async function load() {
  [data, source] = await Promise.all([api(`/api/analysis?asOf=${asOf}`), api('/api/data')]);
  lastLoad = Date.now();
  const siteCount = data.summary.sites;
  $('#site-count').textContent = `${siteCount} Sites Monitored`;
  const sidebarSites = $('#sidebar-sites');
  if (sidebarSites) sidebarSites.textContent = `${siteCount} Sites Monitored`;
  render();
}

// ── Navigation ─────────────────────────────────────────────
function nav() {
  const openCapas = data.capas.filter(c => c.status !== 'closed').length;
  const mainItems = ['overview', 'sites', 'deviations', 'participants', 'capa', 'reports'];
  const systemItems = ['rules', 'settings'];

  let html = `<div class="nav-section">Primary</div>`;
  mainItems.forEach(id => {
    html += navItem(id, openCapas);
  });
  html += `<div class="nav-section system">System</div>`;
  systemItems.forEach(id => {
    html += navItem(id, openCapas);
  });
  $('#nav').innerHTML = html;
}

function navItem(id, openCapas) {
  const label = labels[id];
  const active = id === page ? ' active' : '';
  let countHtml = '';
  if (id === 'deviations') {
    countHtml = `<span class="nav-count danger">${data.findings.length}</span>`;
  } else if (id === 'participants') {
    const flaggedPts = new Set(data.findings.map(f => f.participantId)).size;
    if (flaggedPts > 0) countHtml = `<span class="nav-count danger">${flaggedPts}</span>`;
  } else if (id === 'capa' && openCapas > 0) {
    countHtml = `<span class="nav-count neutral">${openCapas}</span>`;
  } else if (id === 'sites') {
    const highRisk = data.sites.filter(s => s.band === 'critical' || s.band === 'high').length;
    if (highRisk > 0) countHtml = `<span class="nav-count danger">${highRisk} High</span>`;
  }
  return `<a href="#${id}" id="nav-${id}" class="${active}" ${active ? 'aria-current="page"' : ''}>
    ${icon(navIcons[id])}
    <span>${label}</span>
    ${countHtml}
  </a>`;
}

// ── Page header ──────────────────────────────────────────
function head(extra = '') {
  return `
    <div class="page-head">
      <div>
        <h1>${titles[page][0]}</h1>
        <p class="page-title-desc">${titles[page][1]}</p>
      </div>
      <div class="actions">
        ${extra || `
          <div class="topbar-freshness" style="font-size:11px">
            ${icon('schedule', {size: 14})}
            <span>Analysis Current</span>
          </div>
          <button id="btn-refresh" data-action="refresh">
            ${icon('refresh')} Refresh Analysis
          </button>`}
      </div>
    </div>`;
}

// ── Site name lookup ──────────────────────────────────────
const siteName = id => data.sites.find(s => s.id === id)?.name || id;

// ── Stat cards builder ────────────────────────────────────
function statCard(label, value, desc, iconName, iconClass = 'neutral', extras = '') {
  return `
    <section class="card stat${extras.includes('danger') ? ' danger' : ''}${extras.includes('accent') ? ' accent' : ''}">
      <div class="stat-header">
        <span class="stat-label">${label}</span>
        <div class="stat-icon ${iconClass}">${icon(iconName)}</div>
      </div>
      <div class="stat-value">${value}${extras}</div>
      <div class="stat-desc">${desc}</div>
    </section>`;
}

// ── Overview stats ────────────────────────────────────────
function stats() {
  const s = data.summary;
  const regions = new Set(data.sites.map(s => s.region)).size;
  const compliance = s.compliance === null ? '—' : s.compliance + '%';
  const critCount = data.sites.filter(s => s.band === 'critical').length;
  const highCount = data.sites.filter(s => s.band === 'high').length;
  return `
    <div class="cards">
      <section class="card stat">
        <div class="stat-header">
          <span class="stat-label">Sites Monitored</span>
          <div class="stat-icon neutral">${icon('domain')}</div>
        </div>
        <div class="stat-value">${s.sites}</div>
        <div class="stat-desc">Across ${regions} global regions</div>
      </section>
      <section class="card stat">
        <div class="stat-header">
          <span class="stat-label">Patient Visits</span>
          <div class="stat-icon neutral">${icon('groups')}</div>
        </div>
        <div class="stat-value">${s.visits.toLocaleString()}</div>
        <div class="stat-desc">Protocol visits tracked</div>
      </section>
      <section class="card stat accent">
        <div class="stat-header">
          <span class="stat-label">Protocol Compliance</span>
          <div class="stat-icon teal">${icon('verified')}</div>
        </div>
        <div class="stat-value">${compliance}</div>
        <div class="stat-desc">Threshold ≥ 95.0%</div>
      </section>
      <section class="card stat danger">
        <div class="stat-header">
          <span class="stat-label">High-Risk Sites
            <span class="kpi-badge needs-review">Needs Review</span>
          </span>
        </div>
        <div class="stat-value">${s.highRiskSites}</div>
        <div class="stat-desc">${critCount} Critical · ${highCount} High</div>
      </section>
    </div>`;
}

// ── Finding table ─────────────────────────────────────────
function findingRows(rows) {
  if (!rows.length) return `<tr><td colspan="6" class="empty">
    <div class="empty-icon">${icon('check_circle', {size: 32})}</div>No deviations match these filters.
  </td></tr>`;
  return rows.map(f => `
    <tr>
      <td><button class="link mono" data-action="participant-link" data-id="${esc(f.participantId)}" style="font-weight:600;font-size:11px" title="Review participant dossier">${esc(f.participantId)}</button></td>
      <td><span class="mono" style="font-size:11px">${esc(f.siteId)}</span> <span class="muted">·</span> ${esc(siteName(f.siteId))}</td>
      <td>${esc(f.title)}</td>
      <td>${badge(f.severity)}</td>
      <td>${badge(f.status)}</td>
      <td><button class="link" data-action="finding" data-id="${esc(f.id)}">View Details →</button></td>
    </tr>`).join('');
}

function findingTable(rows, showCount = false) {
  return `
    <div class="table-wrap">
      <table class="responsive">
        <thead><tr>
          <th>Participant</th>
          <th>Site</th>
          <th>Deviation</th>
          <th>Severity</th>
          <th>Status</th>
          <th>View</th>
        </tr></thead>
        <tbody>${findingRows(rows)}</tbody>
      </table>
    </div>
    ${showCount ? `<div class="table-footer"><span>Showing ${rows.length} Records</span></div>` : ''}`;
}

// ═════════════════════════════════════════════════════════════
// OVERVIEW PAGE
// ═════════════════════════════════════════════════════════════
function overview() {
  const top = data.sites.slice(0, 5), first = top[0];
  const recentFindings = [...data.findings]
    .sort((a, b) => b.eventDate.localeCompare(a.eventDate))
    .slice(0, 5);

  // Build drivers for insight panel
  let insightHtml = '';
  if (first) {
    const driverNames = {
      upcoming: 'Upcoming Visits', queries: 'Overdue Queries',
      training: 'Untrained Staff', freshness: 'Data Staleness',
      burden: 'Protocol Issues'
    };
    const driverColors = {
      upcoming: 'red', queries: 'amber', training: 'amber',
      freshness: 'slate', burden: 'red'
    };
    const drivers = Object.entries(first.components)
      .filter(([k]) => k !== 'burden')
      .sort((a, b) => b[1].points - a[1].points)
      .slice(0, 3);

    insightHtml = `
      <section class="card inspection-drawer" style="align-self:stretch">
        <div class="drawer-header" style="background:var(--surface)">
          <div class="insight-header" style="border:none;padding:0">
            <div class="insight-header-left">
              ${icon('auto_awesome')} <span class="insight-title">Risk Insight</span>
            </div>
            ${badge(first.band, 'pill')}
          </div>
        </div>
        <div class="drawer-body">
          <div>
            <div class="insight-subtitle">${esc(first.id)} Risk Concentration</div>
            <div style="display:flex;align-items:center;gap:6px;margin:4px 0 8px">
              <span class="mono" style="font-size:12px;color:var(--text-secondary)">Risk ${first.score ?? '—'} · ${esc(first.band.charAt(0).toUpperCase() + first.band.slice(1))}</span>
            </div>
            <p class="insight-desc">Repeated wrong-dose events, missed visits, and prohibited co-medication findings are driving elevated site risk.</p>
          </div>
          <div>
            <div class="drivers-label">Drivers</div>
            <div class="driver-tags">
              ${drivers.map(([k, v]) => `<span class="driver-tag ${driverColors[k] || 'slate'}"><span class="driver-dot"></span>${esc(driverNames[k] || k)}</span>`).join('')}
            </div>
          </div>
          <div class="insight-action">
            <div>
              ${icon('lightbulb')}
            </div>
            <div>
              <strong>Recommended Action:</strong>
              <p>Prioritize focused site monitoring, dosing-process review, and staff retraining.</p>
            </div>
          </div>
        </div>
        <div class="drawer-footer">
          <button class="btn-block" data-action="site" data-id="${esc(first.id)}">
            Inspect ${esc(first.id)} Risk →
          </button>
        </div>
      </section>`;
  }

  return head() + stats() + `
    <div class="grid-65-35">
      <section class="card" style="display:flex;flex-direction:column">
        <div class="section-head">
          <div>
            <h2>Site Risk Comparison</h2>
            <div class="section-desc">Composite anomaly & protocol compliance risk rating (0-100 scale)</div>
          </div>
          <span class="badge generic">Top 5 Sites</span>
        </div>
        <div style="flex:1;display:flex;flex-direction:column;justify-content:space-between">
          <div>
            ${top.map(s => `
              <div class="risk-row${s.band === 'critical' ? ' critical-row' : ''}" data-action="site" data-id="${esc(s.id)}">
                <div class="risk-line">
                  <div class="risk-line-left">
                    <span class="site-id mono">${esc(s.id)}</span>
                    <span class="site-sep">·</span>
                    <span class="site-name">${esc(s.name)}</span>
                  </div>
                  <div class="risk-line-right">
                    ${badge(s.band, 'pill')}
                    <span class="score mono">${s.score ?? '—'}</span>
                  </div>
                </div>
                <div class="bar-track"><span class="bar-fill ${s.band}" style="width:${s.score || 0}%"></span></div>
              </div>`).join('')}
          </div>
          <div class="bar-axis">
            <span>0</span><span>25</span><span>50</span><span>75</span><span>100 (Max Risk)</span>
          </div>
        </div>
      </section>
      ${insightHtml}
    </div>

    <section class="card">
      <div class="section-head">
        <div>
          <h2>Recent Critical Deviations</h2>
          <div class="section-desc">Flagged across active protocols</div>
        </div>
        <span style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono)">Showing ${recentFindings.length} Records</span>
      </div>
      ${findingTable(recentFindings)}
    </section>`;
}

// ═════════════════════════════════════════════════════════════
// TOOLBAR / FILTERS
// ═════════════════════════════════════════════════════════════
function toolbar(showSeverity = false) {
  return `
    <div class="toolbar">
      <label class="search">
        ${icon('search', {size: 15})} Search
        <input id="search" type="search" value="${esc(filter.q)}" placeholder="Search sites, participants, deviations...">
      </label>
      <label>
        Site
        <select id="site-filter">
          <option value="all">All Sites</option>
          ${data.sites.map(s => `<option value="${esc(s.id)}" ${filter.site === s.id ? 'selected' : ''}>${esc(s.name)} (${esc(s.id)})</option>`).join('')}
        </select>
      </label>
      ${showSeverity ? `<label>
        Severity
        <select id="severity-filter">
          ${['all', 'major', 'minor', 'administrative'].map(s =>
            `<option ${s === filter.severity ? 'selected' : ''} value="${s}">
              ${s === 'all' ? 'All Severities' : s.charAt(0).toUpperCase() + s.slice(1)}
            </option>`).join('')}
        </select>
      </label>` : ''}
      <button data-action="clear" style="margin-top:auto">${icon('filter_list_off', {size: 15})} Reset</button>
    </div>`;
}

// ── Filter helper ─────────────────────────────────────────
function filtered(rows) {
  return rows.filter(r =>
    (filter.site === 'all' || (r.siteId || r.id) === filter.site) &&
    JSON.stringify(r).toLowerCase().includes(filter.q.toLowerCase()) &&
    (!r.severity || filter.severity === 'all' || r.severity === filter.severity)
  );
}

// ── Pager ─────────────────────────────────────────────────
function pager(total) {
  const pages = Math.ceil(total / 20);
  const current = Math.floor(offset / 20);
  let pageButtons = '';
  if (pages > 1) {
    pageButtons = `<button data-action="prev" ${offset === 0 ? 'disabled' : ''}>Previous</button>`;
    for (let i = 0; i < Math.min(pages, 5); i++) {
      pageButtons += `<button data-action="page" data-page="${i}" class="${i === current ? 'page-active' : ''}">${i + 1}</button>`;
    }
    pageButtons += `<button data-action="next" ${offset + 20 >= total ? 'disabled' : ''}>Next</button>`;
  }
  return `
    <div class="pagination">
      <span>Showing ${total ? offset + 1 : 0}–${Math.min(offset + 20, total)} of ${total} records</span>
      <div class="page-btns">${pageButtons}</div>
    </div>`;
}

// ═════════════════════════════════════════════════════════════
// SITE RISK MONITOR PAGE
// ═════════════════════════════════════════════════════════════
function sites() {
  const rows = filtered(data.sites);
  const highRiskCount = data.sites.filter(s => s.band === 'critical' || s.band === 'high').length;
  const majorDevs = data.findings.filter(f => f.severity === 'major').length;

  // Pick first site or selected site for the drawer
  const sel = selectedSite ? data.sites.find(s => s.id === selectedSite) : rows[0];

  return head() + `
    <div class="cards" style="grid-template-columns: repeat(3, 1fr)">
      <section class="card stat">
        <div class="stat-header">
          <span class="stat-label">Sites Monitored</span>
          <div class="stat-icon neutral">${icon('domain')}</div>
        </div>
        <div class="stat-value">${data.summary.sites}</div>
        <div class="stat-desc">Active clinical trial sites</div>
      </section>
      <section class="card stat danger">
        <div class="stat-header">
          <span class="stat-label">High-Risk Sites
            <span class="kpi-badge action-required">Action Required</span>
          </span>
          <div class="stat-icon red">${icon('priority_high')}</div>
        </div>
        <div class="stat-value">${highRiskCount}</div>
        <div class="stat-desc" style="color:var(--red-600)">Sites exceeding risk threshold</div>
      </section>
      <section class="card stat">
        <div class="stat-header">
          <span class="stat-label">Major Deviations
            <span class="kpi-badge critical-impact">Critical Impact</span>
          </span>
          <div class="stat-icon amber">${icon('warning')}</div>
        </div>
        <div class="stat-value">${majorDevs}</div>
        <div class="stat-desc">Flagged across active protocols</div>
      </section>
    </div>

    <div class="grid-65-35">
      <section class="card">
        <div class="section-head">
          <div style="display:flex;align-items:center;gap:10px">
            <h2>Monitored Sites (${rows.length})</h2>
            <span class="muted subtitle">Ranked by risk score</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <div style="position:relative;display:flex;align-items:center">
              <span class="material-symbols-outlined" style="position:absolute;left:8px;font-size:16px;color:var(--text-muted);pointer-events:none">search</span>
              <input type="text" id="site-quick-filter" placeholder="Filter site or city..."
                style="height:30px;font-size:11px;width:180px;padding-left:28px"
                value="${esc(filter.q)}">
            </div>
          </div>
        </div>
        <div class="table-wrap">
          <table class="responsive">
            <thead><tr>
              <th>Site</th>
              <th>Compliance</th>
              <th>Major Deviations</th>
              <th>Open CAPAs</th>
              <th>Risk Score</th>
              <th>Risk Level</th>
            </tr></thead>
            <tbody>
              ${rows.slice(offset, offset + 20).map(s => {
                const openCapas = data.capas.filter(c => c.siteId === s.id && c.status !== 'closed').length;
                const isSelected = sel && sel.id === s.id;
                return `
                <tr class="${isSelected ? 'selected' : ''}" data-action="select-site" data-id="${esc(s.id)}" style="cursor:pointer">
                  <td>
                    <span class="mono" style="font-weight:600;font-size:11px">${esc(s.id)}</span>
                    <span class="muted" style="margin:0 4px">·</span>
                    <span>${esc(s.name)}</span>
                  </td>
                  <td style="color:${(s.compliance ?? 100) < 90 ? 'var(--red-600)' : 'var(--teal-700)'};font-weight:600">${s.compliance ?? '—'}${s.compliance === null ? '' : '%'}</td>
                  <td>
                    ${s.majorCount > 0
                      ? `<span class="badge major" style="font-size:10px">${s.majorCount} Major</span>`
                      : `<span class="muted">${s.majorCount} Major</span>`}
                  </td>
                  <td>
                    ${openCapas > 0
                      ? `<span style="display:flex;flex-direction:column;align-items:center"><span>${openCapas}</span><span style="font-size:10px;color:var(--text-muted)">Open</span></span>`
                      : `<span class="muted">0<br><span style="font-size:10px">Open</span></span>`}
                  </td>
                  <td class="mono" style="font-weight:700">${s.score ?? '—'}</td>
                  <td>${badge(s.band, 'pill')}</td>
                </tr>`;
              }).join('') || `<tr><td colspan="6" class="empty"><div class="empty-icon">${icon('search_off', {size: 28})}</div>No matching sites.</td></tr>`}
            </tbody>
          </table>
        </div>
        ${pager(rows.length)}
      </section>

      ${sel ? siteDrawer(sel) : ''}
    </div>`;
}

function siteDrawer(s) {
  const componentLabels = {
    upcoming: 'Wrong Dosing', queries: 'Missed Visits',
    training: 'Banned Co-medication', freshness: 'Documentation Issues',
    burden: 'Protocol Issues'
  };
  const driverColors = ['var(--red-600)', 'var(--orange-500)', 'var(--amber-500)', 'var(--slate-400)', 'var(--teal-500)'];
  const components = Object.entries(s.components);
  const totalWeight = components.reduce((sum, [, v]) => sum + v.weight, 0);

  return `
    <section class="card inspection-drawer">
      <div class="drawer-header">
        <div class="drawer-header-top">
          <span class="drawer-title">${esc(s.id)} · ${esc(s.name)}</span>
          ${badge(s.band, 'pill')}
        </div>
        <div class="drawer-subtitle">Selected Site Inspection</div>
      </div>
      <div class="drawer-body">
        <div>
          <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:var(--text-muted);margin-bottom:6px">Composite Risk Score</div>
          <div class="score-card ${s.band === 'critical' ? 'critical' : ''}">
            <div>
              <span class="score-value">${s.score ?? '—'}</span>
              <span class="score-max"> / 100</span>
              <div style="font-size:11px;color:var(--text-secondary);margin-top:4px">
                ${s.band === 'critical' ? 'Immediate monitoring escalation required' : s.band === 'high' ? 'Priority review recommended' : 'Standard monitoring'}
              </div>
            </div>
            ${s.band === 'critical' ? `<div class="score-alert">${icon('priority_high', {size: 20})}</div>` : ''}
          </div>
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:var(--text)">Top Risk Drivers</span>
            <span style="font-size:10px;color:var(--text-muted);font-family:var(--font-mono)">Contribution</span>
          </div>
          <div class="driver-bar-group">
            ${components.map(([k, v], i) => {
              const pct = totalWeight ? Math.round((v.points / totalWeight) * 100) : 0;
              return `
              <div class="driver-bar-item">
                <div class="driver-bar-header">
                  <span class="driver-label">
                    <span class="driver-dot" style="background:${driverColors[i % driverColors.length]}"></span>
                    ${esc(componentLabels[k] || k)}
                  </span>
                  <span class="driver-pct" style="color:${driverColors[i % driverColors.length]}">${pct}%</span>
                </div>
                <div class="driver-bar-track">
                  <span class="driver-bar-fill" style="width:${pct}%;background:${driverColors[i % driverColors.length]}"></span>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>
        <div class="insight-action">
          <div>${icon('lightbulb')}</div>
          <div>
            <strong>Risk Insight</strong>
            <p><strong>Key Insight:</strong> Repeated wrong-dose events and missed visits indicate a persistent site-level process issue.</p>
            <p style="margin-top:6px"><strong>Recommended Action:</strong> Conduct focused monitoring, retrain site staff, and initiate CAPA.</p>
          </div>
        </div>
      </div>
      <div class="drawer-footer">
        <button class="primary" data-action="site-findings" data-id="${esc(s.id)}">
          ${icon('arrow_forward')} View Deviations
        </button>
        <button data-action="capa-from-site" data-id="${esc(s.id)}">
          ${icon('edit_note')} Create CAPA
        </button>
      </div>
    </section>`;
}

// ═════════════════════════════════════════════════════════════
// DEVIATIONS PAGE
// ═════════════════════════════════════════════════════════════
function deviations() {
  const rows = filtered(data.findings);
  const majorCount = data.findings.filter(f => f.severity === 'major').length;
  const minorCount = data.findings.filter(f => f.severity === 'minor').length;
  const adminCount = data.findings.filter(f => f.severity === 'administrative').length;

  return head(`<a class="button" href="/api/export.csv?asOf=${asOf}">${icon('download')} Export CSV</a>`) + `
    <div class="cards">
      <section class="card stat">
        <div class="stat-header">
          <span class="stat-label">Total Deviations</span>
          <div class="stat-icon neutral">${icon('assignment_late')}</div>
        </div>
        <div class="stat-value">${data.findings.length}</div>
        <div class="stat-desc">Across all monitored sites</div>
      </section>
      <section class="card stat danger">
        <div class="stat-header">
          <span class="stat-label">Major</span>
          <div class="stat-icon red">${icon('error')}</div>
        </div>
        <div class="stat-value">${majorCount}</div>
        <div class="stat-desc" style="color:var(--red-600)">Require immediate review</div>
      </section>
      <section class="card stat">
        <div class="stat-header">
          <span class="stat-label">Minor</span>
          <div class="stat-icon amber">${icon('info')}</div>
        </div>
        <div class="stat-value">${minorCount}</div>
        <div class="stat-desc">Review when possible</div>
      </section>
      <section class="card stat">
        <div class="stat-header">
          <span class="stat-label">Administrative</span>
          <div class="stat-icon neutral">${icon('description')}</div>
        </div>
        <div class="stat-value">${adminCount}</div>
        <div class="stat-desc">Documentation issues</div>
      </section>
    </div>` +
    (data.summary.dataGapVisits > 0 ? `<div class="notice warning">
      ${icon('warning')}
      <div><strong>${data.summary.dataGapVisits} visits have missing records</strong> — these require source verification against original patient files.</div>
    </div>` : '') +
    toolbar(true) + `
    <section class="card">
      ${findingTable(rows.slice(offset, offset + 20))}
      ${pager(rows.length)}
    </section>
    <details class="card" style="margin-top:14px">
      <summary style="cursor:pointer;padding:6px 0;font-weight:600;font-size:13px;display:flex;align-items:center;gap:6px">
        ${icon('fact_check')} Visits with Missing Information (${data.dataGaps.length} visits need source verification)
      </summary>
      <p class="subtitle" style="margin:8px 0">
        These visits couldn't be fully evaluated because some patient record fields are missing.
      </p>
      <div class="table-wrap">
        <table class="responsive">
          <thead><tr>
            <th>Visit ID</th>
            <th>Site</th>
            <th>Missing Information</th>
          </tr></thead>
          <tbody>
            ${data.dataGaps.map(g => `
              <tr>
                <td class="mono" style="font-size:11px">${esc(g.visitId)}</td>
                <td>${esc(g.siteId)}</td>
                <td>${esc(g.reasons.map(r => ({
                  dose: 'Dose amount not recorded',
                  medications: 'Medication list not recorded',
                  documented: 'Documentation incomplete',
                }[r] || r)).join('; '))}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </details>`;
}

// ═════════════════════════════════════════════════════════════
// PARTICIPANT REVIEW PAGE
// ═════════════════════════════════════════════════════════════
function participants() {
  if (!source || !data) return '<div class="loading"><div class="spinner"></div>Loading...</div>';

  const ptVisitsMap = new Map();
  for (const v of source.visits) {
    if (!ptVisitsMap.has(v.participantId)) ptVisitsMap.set(v.participantId, []);
    ptVisitsMap.get(v.participantId).push(v);
  }

  const ptFindingsMap = new Map();
  for (const f of data.findings) {
    if (!ptFindingsMap.has(f.participantId)) ptFindingsMap.set(f.participantId, []);
    ptFindingsMap.get(f.participantId).push(f);
  }

  // Rank participants with major findings first, then any findings, then by ID
  const allParticipantIds = [...ptVisitsMap.keys()].sort((a, b) => {
    const aFindings = ptFindingsMap.get(a) || [];
    const bFindings = ptFindingsMap.get(b) || [];
    const aMajor = aFindings.filter(f => f.severity === 'major').length;
    const bMajor = bFindings.filter(f => f.severity === 'major').length;
    if (aMajor !== bMajor) return bMajor - aMajor;
    if (aFindings.length !== bFindings.length) return bFindings.length - aFindings.length;
    return a.localeCompare(b);
  });

  if (!selectedParticipant || !ptVisitsMap.has(selectedParticipant)) {
    selectedParticipant = allParticipantIds[0] || 'PT-0001';
  }

  const ptVisits = (ptVisitsMap.get(selectedParticipant) || []).sort((a, b) =>
    (a.scheduledDate || '').localeCompare(b.scheduledDate || ''));
  const ptFindings = ptFindingsMap.get(selectedParticipant) || [];
  const primarySiteId = ptVisits[0]?.siteId || 'SITE-101';
  const site = data.sites.find(s => s.id === primarySiteId) || { id: primarySiteId, name: siteName(primarySiteId) };

  // Calculate compliance metrics
  const totalVisits = ptVisits.length;
  const completedVisits = ptVisits.filter(v => v.actualDate).length;
  const visitAdherence = totalVisits ? Math.round((completedVisits / totalVisits) * 100) : 100;

  const evaluatedDoses = ptVisits.filter(v => v.doseMg !== null && v.actualDate);
  const correctDoses = evaluatedDoses.filter(v => v.doseMg === (data.protocol.doseMg || 50));
  const doseAdherence = evaluatedDoses.length ? Math.round((correctDoses.length / evaluatedDoses.length) * 100) : 100;

  const docVisits = ptVisits.filter(v => v.actualDate);
  const documentedCount = docVisits.filter(v => v.documented === true).length;
  const docAdherence = docVisits.length ? Math.round((documentedCount / docVisits.length) * 100) : 100;

  const bannedMedCount = ptFindings.filter(f => f.rule === 'banned_medication').length;
  const medAdherence = bannedMedCount > 0 ? 80 : 100;

  const overallCompliance = Math.round((visitAdherence * 0.3) + (doseAdherence * 0.3) + (docAdherence * 0.2) + (medAdherence * 0.2));

  const majorCount = ptFindings.filter(f => f.severity === 'major').length;
  const minorCount = ptFindings.filter(f => f.severity === 'minor').length;
  const riskBand = majorCount > 0 ? 'critical' : minorCount > 0 ? 'high' : 'low';

  // Next scheduled visit
  const nextVisit = ptVisits.find(v => !v.actualDate) || ptVisits[ptVisits.length - 1];

  // Visit titles mapping
  const visitNames = ['Screening', 'Baseline', 'Safety Check', 'Mid-Treatment', 'Closeout', 'Follow-up'];

  return head(`
    <a class="button" href="/api/export.csv?asOf=${asOf}">${icon('download')} Export Summary</a>
    <a class="button primary" href="#deviations">${icon('fact_check')} Review Deviations</a>
  `) + `
    <!-- Participant Quick Switcher Bar -->
    <div class="pt-switcher">
      <div class="pt-switcher-left">
        <span style="font-size:11px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:var(--text-muted)">Participant:</span>
        <select id="participant-select" class="pt-select">
          ${allParticipantIds.slice(0, 100).map(pid => {
            const devCount = ptFindingsMap.get(pid)?.length || 0;
            const hasMajor = ptFindingsMap.get(pid)?.some(f => f.severity === 'major');
            const ptSite = ptVisitsMap.get(pid)?.[0]?.siteId || '';
            const statusLabel = hasMajor ? '🚨 Major Deviation' : devCount > 0 ? '⚠️ Minor Deviation' : '✓ Normal';
            return `<option value="${esc(pid)}" ${pid === selectedParticipant ? 'selected' : ''}>
              ${esc(pid)} · ${esc(ptSite)} (${esc(siteName(ptSite))}) · ${statusLabel}
            </option>`;
          }).join('')}
        </select>
        <span style="font-size:12px;color:var(--text-secondary)">
          Showing participant <strong style="color:var(--text)">${esc(selectedParticipant)}</strong> of ${allParticipantIds.length} randomized participants
        </span>
      </div>
      <div style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono)">
        Synthetic Demo Environment · 200 Sites
      </div>
    </div>

    <!-- Participant Dossier Summary Card -->
    <section class="card" style="margin-bottom:14px">
      <div class="pt-dossier">
        <div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            <span class="pt-id-tag">${esc(selectedParticipant)}</span>
            <span class="badge confirmed"><span class="risk-dot"></span>Active</span>
            ${badge(riskBand, 'pill')}
          </div>
          <div style="font-size:12px;font-weight:500;color:var(--text);margin-bottom:2px">
            ${esc(site.id)} · ${esc(site.name)}
          </div>
          <div style="font-size:11px;color:var(--text-secondary)">
            Next Scheduled Visit: <strong style="color:var(--text)">${nextVisit ? `${esc(nextVisit.id)} (${esc(nextVisit.scheduledDate)})` : 'None pending'}</strong>
          </div>
        </div>

        <div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
            <span style="font-size:12px;font-weight:600;color:var(--text)">Overall Protocol Compliance</span>
            <div>
              <span class="mono" style="font-size:18px;font-weight:700;color:${overallCompliance < 90 ? 'var(--red-600)' : 'var(--teal-700)'}">
                ${overallCompliance}%
              </span>
              <span style="font-size:11px;color:var(--text-muted)"> / 95% target</span>
            </div>
          </div>
          <div class="bar-track" style="height:8px;background:var(--slate-200);border-radius:4px;overflow:hidden">
            <div style="height:100%;width:${overallCompliance}%;background:${overallCompliance < 85 ? 'var(--red-600)' : overallCompliance < 95 ? 'var(--amber-500)' : 'var(--teal-600)'};border-radius:4px"></div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;font-size:11px;color:var(--text-secondary)">
            <span style="color:${overallCompliance < 95 ? 'var(--red-600)' : 'var(--teal-700)'};font-weight:500">
              ${overallCompliance < 95 ? `▼ ${(95 - overallCompliance)}% deficit vs protocol target` : '▲ Exceeds target adherence'}
            </span>
            <span>Target: ≥95.0% adherence</span>
          </div>
        </div>

        <div class="pt-stat-boxes">
          <div class="pt-stat-box${majorCount > 0 ? ' danger' : ''}">
            <span style="font-size:10px;font-weight:700;text-transform:uppercase;color:${majorCount > 0 ? 'var(--red-700)' : 'var(--text-muted)'}">Major Deviations</span>
            <span class="pt-stat-num">${majorCount}</span>
            <span style="font-size:10px;font-weight:600;color:${majorCount > 0 ? 'var(--red-700)' : 'var(--text-secondary)'}">${majorCount > 0 ? 'Escalated' : 'None'}</span>
          </div>
          <div class="pt-stat-box${ptFindings.length > 0 ? ' warning' : ''}">
            <span style="font-size:10px;font-weight:700;text-transform:uppercase;color:${ptFindings.length > 0 ? 'var(--amber-800)' : 'var(--text-muted)'}">Total Open</span>
            <span class="pt-stat-num">${ptFindings.length}</span>
            <span style="font-size:10px;font-weight:600;color:${ptFindings.length > 0 ? 'var(--amber-800)' : 'var(--text-secondary)'}">${majorCount} Major, ${minorCount} Minor</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Longitudinal Protocol Schedule & Deviations (Timeline) -->
    <section class="card" style="margin-bottom:14px">
      <div class="section-head">
        <div style="display:flex;align-items:center;gap:8px">
          ${icon('linear_scale', {size: 20})}
          <h2>Longitudinal Protocol Schedule & Deviations</h2>
        </div>
        <span class="mono" style="font-size:11px;color:var(--text-muted)">Protocol Window: ±${data.protocol.visitWindowDays || 3} Days</span>
      </div>
      <div class="pt-timeline-scroll">
        <div class="pt-timeline-grid">
          ${ptVisits.slice(0, 6).map((v, idx) => {
            const vFindings = ptFindings.filter(f => f.visitId === v.id);
            const hasMajor = vFindings.some(f => f.severity === 'major');
            const hasFinding = vFindings.length > 0;
            const isCompleted = Boolean(v.actualDate);
            const isUpcoming = !v.actualDate && idx === ptVisits.findIndex(x => !x.actualDate);
            const isFuture = !v.actualDate && !isUpcoming;
            const cardClass = hasMajor ? 'has-deviation' : isUpcoming ? 'upcoming' : isFuture ? 'future' : '';

            let badgeHtml = '';
            if (hasMajor) {
              badgeHtml = `<span class="tl-badge deviation">${icon('priority_high', {size: 12})} MAJOR DEVIATION</span>`;
            } else if (hasFinding) {
              badgeHtml = `<span class="tl-badge deviation">${icon('warning', {size: 12})} ${esc(vFindings[0].severity.toUpperCase())}</span>`;
            } else if (isCompleted) {
              badgeHtml = `<span class="tl-badge completed">${icon('check', {size: 12})} Completed</span>`;
            } else if (isUpcoming) {
              badgeHtml = `<span class="tl-badge upcoming">${icon('schedule', {size: 12})} Upcoming</span>`;
            } else {
              badgeHtml = `<span class="tl-badge future">Future</span>`;
            }

            const dayOffset = (idx - 1) * 14;
            const dayLabel = idx === 0 ? 'Day -14' : idx === 1 ? 'Day 0' : `Day ${dayOffset}`;
            const visitTitle = visitNames[idx] || `Visit ${idx + 1}`;

            return `
              <div class="timeline-card ${cardClass}">
                <div>
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
                    <span class="mono" style="font-size:10px;font-weight:700;color:var(--text-muted)">${dayLabel}</span>
                    ${badgeHtml}
                  </div>
                  <div style="font-weight:700;font-size:13px;color:var(--text);margin-bottom:2px">${esc(visitTitle)}</div>
                  <div class="mono" style="font-size:10px;color:var(--text-muted);margin-bottom:8px">${esc(v.id)}</div>
                  ${hasFinding ? `
                    <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:4px;padding:6px;margin:6px 0;font-size:11px">
                      <strong style="color:var(--red-700);display:block">${esc(vFindings[0].title)}</strong>
                      <span class="mono" style="font-size:10px;color:var(--text-secondary)">Obs: ${esc(vFindings[0].observed)}</span>
                    </div>
                  ` : `
                    <div style="font-size:11px;color:var(--text-secondary);margin:4px 0">
                      <div>Dose: <span class="mono">${v.doseMg ? `${v.doseMg} mg` : '—'}</span></div>
                      <div>Meds: <span class="mono">${(v.medications && v.medications.length) ? v.medications.join(', ') : 'None'}</span></div>
                    </div>
                  `}
                </div>
                <div style="border-top:1px solid var(--border-light);padding-top:6px;margin-top:8px;font-size:10px;color:var(--text-muted);font-family:var(--font-mono);display:flex;justify-content:space-between">
                  <span>${esc(v.scheduledDate || '—')}</span>
                  <span>${v.actualDate ? '✓ Attended' : 'Scheduled'}</span>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>
    </section>

    <!-- Domain Compliance Grid -->
    <div class="domain-grid" style="margin-bottom:14px">
      <section class="domain-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:var(--text-muted)">Domain 01</span>
          <span class="badge ${visitAdherence >= 95 ? 'confirmed' : 'needs-review'}">${visitAdherence >= 95 ? 'Compliant' : 'Deficit'}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
          <span style="font-size:14px;font-weight:700">Visits</span>
          <span class="mono" style="font-size:18px;font-weight:700;color:${visitAdherence >= 95 ? 'var(--teal-700)' : 'var(--red-600)'}">${visitAdherence}%</span>
        </div>
        <div class="bar-track" style="height:6px;background:var(--slate-100);border-radius:3px;overflow:hidden;margin-bottom:6px">
          <div style="height:100%;width:${visitAdherence}%;background:${visitAdherence >= 95 ? 'var(--teal-600)' : 'var(--red-600)'}"></div>
        </div>
        <div style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono)">${completedVisits}/${totalVisits} visits completed on schedule</div>
      </section>

      <section class="domain-card${doseAdherence < 90 ? ' non-compliant' : ''}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:${doseAdherence < 90 ? 'var(--red-700)' : 'var(--text-muted)'}">Domain 02</span>
          <span class="badge ${doseAdherence >= 90 ? 'confirmed' : 'critical'}">${doseAdherence >= 90 ? 'Compliant' : 'Non-Compliant'}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
          <span style="font-size:14px;font-weight:700">Dosing</span>
          <span class="mono" style="font-size:18px;font-weight:700;color:${doseAdherence >= 90 ? 'var(--teal-700)' : 'var(--red-600)'}">${doseAdherence}%</span>
        </div>
        <div class="bar-track" style="height:6px;background:var(--slate-100);border-radius:3px;overflow:hidden;margin-bottom:6px">
          <div style="height:100%;width:${doseAdherence}%;background:${doseAdherence >= 90 ? 'var(--teal-600)' : 'var(--red-600)'}"></div>
        </div>
        <div style="font-size:11px;color:${doseAdherence < 90 ? 'var(--red-700)' : 'var(--text-muted)'};font-weight:${doseAdherence < 90 ? '600' : '400'};font-family:var(--font-mono)">
          ${doseAdherence < 90 ? 'Critical Deficit · Dosing variance detected' : 'Administered within ±0 mg'}
        </div>
      </section>

      <section class="domain-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:var(--text-muted)">Domain 03</span>
          <span class="badge ${docAdherence >= 90 ? 'confirmed' : 'under-review'}">${docAdherence >= 90 ? 'Compliant' : 'Review Required'}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
          <span style="font-size:14px;font-weight:700">Assessments</span>
          <span class="mono" style="font-size:18px;font-weight:700;color:${docAdherence >= 90 ? 'var(--teal-700)' : 'var(--amber-700)'}">${docAdherence}%</span>
        </div>
        <div class="bar-track" style="height:6px;background:var(--slate-100);border-radius:3px;overflow:hidden;margin-bottom:6px">
          <div style="height:100%;width:${docAdherence}%;background:${docAdherence >= 90 ? 'var(--teal-600)' : 'var(--amber-500)'}"></div>
        </div>
        <div style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono)">${documentedCount}/${docVisits.length} assessments documented</div>
      </section>

      <section class="domain-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:var(--text-muted)">Domain 04</span>
          <span class="badge ${medAdherence >= 90 ? 'confirmed' : 'under-review'}">${medAdherence >= 90 ? 'Compliant' : 'Flagged'}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
          <span style="font-size:14px;font-weight:700">Medications</span>
          <span class="mono" style="font-size:18px;font-weight:700;color:${medAdherence >= 90 ? 'var(--teal-700)' : 'var(--amber-700)'}">${medAdherence}%</span>
        </div>
        <div class="bar-track" style="height:6px;background:var(--slate-100);border-radius:3px;overflow:hidden;margin-bottom:6px">
          <div style="height:100%;width:${medAdherence}%;background:${medAdherence >= 90 ? 'var(--teal-600)' : 'var(--amber-500)'}"></div>
        </div>
        <div style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono)">
          ${bannedMedCount > 0 ? `${bannedMedCount} prohibited co-medications detected` : 'No prohibited co-medications'}
        </div>
      </section>
    </div>

    <!-- Auditable AI Risk Insight Card -->
    <section class="card" style="margin-bottom:14px">
      <div class="section-head">
        <div style="display:flex;align-items:center;gap:8px">
          ${icon('insights', {size: 20})}
          <h2>Risk Insight</h2>
        </div>
        <span class="badge generic">Auditable Model Rationale</span>
      </div>
      <div class="grid-65-35" style="align-items:stretch">
        <div style="background:var(--slate-50);border:1px solid var(--border-light);border-radius:var(--radius);padding:14px;display:flex;flex-direction:column;justify-content:space-between">
          <div>
            <div style="font-size:14px;font-weight:600;color:var(--text);line-height:1.5;margin-bottom:8px">
              "${majorCount > 0
                ? `Participant ${esc(selectedParticipant)} has critical protocol discrepancies at ${esc(site.id)} (${esc(site.name)}), including ${esc(ptFindings[0]?.title || 'dosing anomalies')}. Scheduled protocol visits remain tracked.`
                : `Participant ${esc(selectedParticipant)} demonstrates good protocol adherence with standard monitoring parameters.`}"
            </div>
            <p style="font-size:12px;color:var(--text-secondary);line-height:1.6">
              Identified deviations require site-level clinical reconciliation and investigator review under GCP protocol requirements.
            </p>
          </div>
          <div style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);margin-top:10px">
            Source records evaluated: ${ptVisits.length} visits · GCP Guideline Section 4.5
          </div>
        </div>

        <div style="background:var(--surface);border:1px solid var(--border-light);border-radius:var(--radius);padding:14px;display:flex;flex-direction:column;justify-content:space-between">
          <div>
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
              ${icon('verified', {size: 18})}
              <strong style="font-size:13px;color:var(--text)">Recommended Operational Action</strong>
            </div>
            <p style="font-size:12px;color:var(--text-secondary);line-height:1.5">
              ${ptFindings[0]?.recommendation || 'Maintain standard visit schedule and continue monitoring for prospective protocol deviations.'}
            </p>
          </div>
          <div style="margin-top:12px;display:flex;gap:8px">
            ${ptFindings.length > 0 ? `
              <button class="primary" data-action="finding" data-id="${esc(ptFindings[0].id)}" style="flex:1">
                ${icon('fact_check')} Review Deviation (${esc(ptFindings[0].id)})
              </button>
            ` : `
              <button class="primary" data-action="site" data-id="${esc(primarySiteId)}" style="flex:1">
                ${icon('domain')} View Site Overview
              </button>
            `}
          </div>
        </div>
      </div>
    </section>

    <!-- Participant Deviation Summary Table -->
    <section class="card">
      <div class="section-head">
        <div>
          <h2>Participant Deviations (${esc(selectedParticipant)})</h2>
          <div class="section-desc">Protocol discrepancies logged in audit register for this study participant.</div>
        </div>
        <span class="mono" style="font-size:11px;color:var(--text-muted)">${ptFindings.length} Logged Records</span>
      </div>
      ${findingTable(ptFindings)}
    </section>`;
}

// ═════════════════════════════════════════════════════════════
// CAPA MANAGEMENT PAGE
// ═════════════════════════════════════════════════════════════
function capas() {
  const openCount = data.capas.filter(c => c.status !== 'closed').length;
  const highPriority = data.capas.filter(c => c.status === 'in progress' || c.status === 'draft').length;
  const dueSoon = data.capas.filter(c => {
    if (c.status === 'closed') return false;
    const days = (new Date(c.dueDate) - new Date(asOf)) / 86400000;
    return days >= 0 && days <= 7;
  }).length;
  const overdue = data.capas.filter(c => c.dueDate < asOf && c.status !== 'closed').length;
  const overdueFirst = overdue > 0 ? data.capas.find(c => c.dueDate < asOf && c.status !== 'closed') : null;

  return head(`
    <a class="button" href="/api/report?asOf=${asOf}">${icon('download')} Export CAPA Log (CSV/PDF)</a>
    <button class="primary" data-action="new-capa">${icon('add')} Create CAPA</button>
  `) + `
    <div class="cards">
      <section class="card stat">
        <div class="stat-header">
          <span class="stat-label">Open CAPAs</span>
          <div class="stat-icon neutral">${icon('folder_open')}</div>
        </div>
        <div class="stat-value">${openCount}
          <span class="kpi-badge active" style="font-size:9px;vertical-align:middle">Active</span>
        </div>
        <div class="stat-desc">Triggered by trial deviations</div>
      </section>
      <section class="card stat">
        <div class="stat-header">
          <span class="stat-label">High Priority</span>
          <div class="stat-icon red">${icon('priority_high')}</div>
        </div>
        <div class="stat-value">${highPriority}
          <span class="kpi-badge action-required" style="font-size:9px;vertical-align:middle">High Action</span>
        </div>
        <div class="stat-desc">Immediate action focus</div>
      </section>
      <section class="card stat">
        <div class="stat-header">
          <span class="stat-label">Due Soon</span>
          <div class="stat-icon amber">${icon('schedule')}</div>
        </div>
        <div class="stat-value">${dueSoon}
          <span style="font-size:11px;color:var(--amber-700);font-weight:500;margin-left:4px">Upcoming</span>
        </div>
        <div class="stat-desc">Due within 7 days</div>
      </section>
      <section class="card stat danger">
        <div class="stat-header">
          <span class="stat-label">Overdue</span>
          <div class="stat-icon red">${icon('warning', {size: 20})}</div>
        </div>
        <div class="stat-value">${overdue}</div>
        <div class="stat-desc" style="color:var(--red-600)">${overdueFirst ? `${esc(overdueFirst.siteId)} · Escalated to site lead` : 'No overdue items'}</div>
      </section>
    </div>

    <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
      <button class="${capaView === 'list' ? 'primary' : ''}" data-action="capa-view" data-view="list" style="font-size:11px;padding:5px 10px">${icon('list', {size: 15})} List</button>
      <button class="${capaView === 'kanban' ? 'primary' : ''}" data-action="capa-view" data-view="kanban" style="font-size:11px;padding:5px 10px">${icon('view_kanban', {size: 15})} Kanban</button>
    </div>

    ${capaView === 'kanban' ? capaKanban() : capaList()}`;
}

function capaList() {
  return `
    <section class="card">
      <div class="section-head">
        <div style="display:flex;align-items:center;gap:8px">
          <h2>Active Trial Quality Actions</h2>
          <span class="badge generic">${data.capas.length} Records displayed</span>
        </div>
        <span style="font-size:11px;color:var(--text-muted)">Sorted by: Priority & Due Date</span>
      </div>
      <div class="table-wrap">
        <table class="responsive">
          <thead><tr>
            <th>CAPA ID</th>
            <th>Site</th>
            <th>Finding</th>
            <th>Priority</th>
            <th>Due Date</th>
            <th>Status</th>
            <th>Action</th>
          </tr></thead>
          <tbody>
            ${data.capas.map(c => `
              <tr class="${c.dueDate < asOf && c.status !== 'closed' ? 'selected' : ''}" style="cursor:pointer" data-action="edit-capa" data-id="${esc(c.id)}">
                <td class="mono" style="font-weight:600;font-size:11px;color:var(--teal-700)">${esc(c.id)}</td>
                <td>
                  <span class="mono" style="font-size:11px">${esc(c.siteId)}</span>
                  <div style="font-size:11px;color:var(--text-muted)">${esc(siteName(c.siteId))}</div>
                </td>
                <td style="max-width:240px">${esc(c.findingSnapshot.title)}</td>
                <td>${badge(c.status === 'in progress' || c.status === 'draft' ? 'high' : c.status === 'effectiveness check' ? 'moderate' : 'low', 'pill')}</td>
                <td class="mono" style="font-size:11px">${esc(c.dueDate)}
                  ${c.dueDate < asOf && c.status !== 'closed' ? '<br>' + badge('overdue') : ''}
                </td>
                <td>${badge(c.status)}</td>
                <td><button class="link" data-action="edit-capa" data-id="${esc(c.id)}">View Plan →</button></td>
              </tr>`).join('') ||
              `<tr><td colspan="7" class="empty">
                <div class="empty-icon">${icon('edit_note', {size: 28})}</div>
                No action plans yet. Go to <a href="#deviations">Deviations</a>, review an issue, and create a CAPA.
              </td></tr>`}
          </tbody>
        </table>
      </div>
      ${pager(data.capas.length)}
    </section>`;
}

function capaKanban() {
  const buckets = {
    'Open': data.capas.filter(c => c.status === 'draft' || c.status === 'in progress'),
    'In Progress': data.capas.filter(c => c.status === 'effectiveness check'),
    'Closed': data.capas.filter(c => c.status === 'closed'),
  };
  return `
    <div class="kanban">
      ${Object.entries(buckets).map(([title, items]) => `
        <div class="kanban-col">
          <div class="kanban-col-header">
            <span>${title}</span>
            <span class="col-count">${items.length}</span>
          </div>
          <div class="kanban-col-body">
            ${items.map(c => `
              <div class="kanban-card${c.dueDate < asOf && c.status !== 'closed' ? ' overdue' : ''}"
                   data-action="edit-capa" data-id="${esc(c.id)}">
                <div class="kc-id">${esc(c.id)}</div>
                <div class="kc-title">${esc(c.findingSnapshot.title)}</div>
                <div class="kc-meta">
                  <span class="mono">${esc(c.siteId)}</span>
                  <span>Due: ${esc(c.dueDate)}</span>
                </div>
              </div>
            `).join('') || `<div class="search-empty" style="font-size:11px">No items</div>`}
          </div>
        </div>
      `).join('')}
    </div>`;
}

// ═════════════════════════════════════════════════════════════
// REPORTS PAGE
// ═════════════════════════════════════════════════════════════
function reports() {
  return head() + `
    <div class="report-grid">
      <section class="card">
        <div class="card-icon teal">${icon('package_2')}</div>
        <h2>Full Review Package</h2>
        <p>Complete regulatory inspection bundle with all deviations, CAPAs, audit trail, and evidence.</p>
        <a class="button primary" href="/api/report?asOf=${asOf}">${icon('download')} Download Full Package (JSON)</a>
      </section>
      <section class="card">
        <div class="card-icon blue">${icon('table_chart')}</div>
        <h2>Deviations Spreadsheet</h2>
        <p>All detected deviations in CSV format. Open in Excel or Google Sheets to filter and share.</p>
        <a class="button" href="/api/export.csv?asOf=${asOf}">${icon('download')} Download CSV</a>
      </section>
      <section class="card">
        <div class="card-icon slate">${icon('print')}</div>
        <h2>Print Summary</h2>
        <p>Print the current page or save as PDF. Includes key stats, CAPAs, and deviation summary.</p>
        <button data-action="print">${icon('print')} Print / Save as PDF</button>
      </section>
    </div>

    <section class="card report-preview">
      <h3>${icon('analytics')} Report Preview — as of ${asOf}</h3>
      <p>
        <strong>${data.summary.findings}</strong> deviations found across <strong>${data.summary.sites}</strong> sites.
        <strong>${data.summary.dataGapVisits}</strong> visits are missing information and need source verification.
        <strong>${data.capas.length}</strong> CAPAs have been created.
      </p>
      ${data.capas.length ? `
        <h3 style="margin-top:12px">CAPA Summary</h3>
        <table>
          <thead><tr><th>CAPA</th><th>Site</th><th>Issue</th><th>Status</th><th>Due</th></tr></thead>
          <tbody>
            ${data.capas.map(c => `
              <tr>
                <td class="mono" style="font-size:11px">${esc(c.id)}</td>
                <td>${esc(c.siteId)}</td>
                <td>${esc(c.findingSnapshot.title)}</td>
                <td>${badge(c.status)}</td>
                <td class="mono" style="font-size:11px">${esc(c.dueDate)}</td>
              </tr>`).join('')}
          </tbody>
        </table>` : ''}
    </section>

    ${stats()}`;
}

// ═════════════════════════════════════════════════════════════
// PROTOCOL RULES PAGE
// ═════════════════════════════════════════════════════════════
function rules() {
  const p = data.protocol;
  const ruleDescriptions = {
    wrong_dose: `Patient must receive exactly ${p.doseMg} mg (no variation allowed)`,
    banned_medication: `Patient must NOT take: ${p.bannedMedications.join(', ')}`,
    missed_visit: `Patient must attend all scheduled visits`,
    visit_window: `Visits must happen within ±${p.visitWindowDays} days of scheduled date`,
    documentation: `All required documentation must be completed`,
  };
  return head() + `
    <div class="notice">
      ${icon('info')}
      <span>Rule violations are automatically flagged. Any parameter changes require a new version number and are recorded in the audit trail.</span>
    </div>
    <div class="grid-split">
      <section class="card">
        <div class="section-head">
          <div>
            <h2>Active Protocol Rules</h2>
            <div class="section-desc">Protocol ${esc(p.id)} · Version ${esc(p.version)} · Effective from ${esc(p.effectiveDate)}</div>
          </div>
          <span class="badge generic">v${esc(p.version)}</span>
        </div>
        <div class="table-wrap">
          <table class="responsive">
            <thead><tr>
              <th>Rule</th>
              <th>Definition</th>
              <th>Severity Class</th>
            </tr></thead>
            <tbody>
              ${Object.keys(p.severity).map(k => `
                <tr>
                  <td>
                    <strong>${esc(k.replaceAll('_', ' ').replace(/\b\w/g, l => l.toUpperCase()))}</strong>
                    <div class="muted subtitle" style="margin-top:2px">${esc(p.references[k])}</div>
                  </td>
                  <td style="max-width:240px;font-size:12px">${esc(ruleDescriptions[k] || k)}</td>
                  <td>${badge(p.severity[k])}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
        <div class="recommendation" style="margin-top:14px">
          <strong>${icon('auto_awesome', {size: 14})} How Rules Work</strong>
          If a patient visit violates any of these rules, it is automatically flagged as a deviation.
          A human reviewer must confirm or dismiss each flag. Old rule versions are preserved in the audit history.
        </div>
      </section>
      <section class="card">
        <h2>${icon('edit_note')} Update Protocol Rules</h2>
        <p class="subtitle" style="margin-top:4px">Change parameters below and enter a new version number. Your name is recorded in the audit log.</p>
        <form id="protocol-form" class="centered-box" style="margin-top:14px">
          <div class="form-grid">
            <label>New Version Number<input name="version" required placeholder="e.g. 1.1" value=""></label>
            <label>Effective Date<input type="date" name="effectiveDate" required value=""></label>

            <label>Required Dose (mg)<input type="number" name="doseMg" required value="${p.doseMg}"></label>
            <label>Dose Tolerance (mg)<input type="number" name="doseToleranceMg" required value="${p.doseToleranceMg}"></label>

            <label>Visit Window (± days)<input type="number" name="visitWindowDays" required value="${p.visitWindowDays}"></label>
            <label>Banned Medications<input name="bannedMedications" required value="${esc(p.bannedMedications.join(', '))}"></label>

            <h4 class="full" style="margin-top:8px;font-size:12px;color:var(--text-secondary)">Rule Severities</h4>
            ${Object.keys(p.severity).map(k => `
              <label>${esc(k.replaceAll('_', ' ').replace(/\b\w/g, l => l.toUpperCase()))} Severity
                <select name="sev_${k}">
                  ${['administrative','minor','major'].map(s => `<option value="${s}" ${p.severity[k]===s?'selected':''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`).join('')}
                </select>
              </label>
            `).join('')}

            <label class="full" style="margin-top:10px;border-top:1px solid var(--border-light);padding-top:12px">
              Your name (reviewer)
              <input name="actor" required placeholder="Enter your full name" maxlength="100">
            </label>
          </div>
          <div class="form-actions">
            <button class="primary" type="submit">${icon('save')} Save New Version</button>
          </div>
          <div class="inline-error" role="alert"></div>
        </form>
      </section>
    </div>`;
}

// ═════════════════════════════════════════════════════════════
// SETTINGS PAGE
// ═════════════════════════════════════════════════════════════
function settings() {
  return head() + `
    <div class="grid-split">
      <section class="card">
        <h2>${icon('tune')} Study Configuration</h2>
        <p class="subtitle" style="margin-top:4px">Change the evaluation date to view historical data or run the analysis at a past point in time.</p>
        <form id="date-form" style="display:flex;gap:10px;align-items:flex-end;margin-top:12px;flex-wrap:wrap">
          <label style="font-size:12px;font-weight:500;color:var(--text-secondary)">
            ${icon('calendar_today', {size: 15})} Evaluation Date
            <input type="date" name="date" value="${asOf}" required style="display:block;margin-top:5px">
          </label>
          <button type="submit" style="height:36px">${icon('check')} Apply</button>
        </form>

        <div style="margin-top:20px;padding:16px;background:var(--slate-50);border:1px solid var(--border-light);border-radius:var(--radius)">
          <h3>${icon('upload_file')} Replace Study Dataset</h3>
          <p class="subtitle" style="margin:4px 0 10px">Upload a new complete patient dataset. The system will validate it before saving.</p>
          <a class="button" style="margin-bottom:12px" href="/api/data" download="arcguard-sample-data.json">
            ${icon('download')} Download Current Data
          </a>
          <form id="import-form" class="form-grid" style="margin-top:8px">
            <label class="full">
              Select data file (.json)
              <input name="file" type="file" accept=".json,application/json" required style="display:block;margin-top:5px;background:white">
            </label>
            <label class="full">
              Your name (data manager)
              <input name="actor" required maxlength="100" placeholder="Enter your full name" style="display:block;margin-top:5px">
            </label>
            <label class="full">
              <span style="display:flex;align-items:center;gap:8px;font-weight:400;margin-top:8px">
                <input type="checkbox" required style="width:auto;margin:0">
                I confirm I want to replace the entire current dataset with this file.
              </span>
            </label>
            <div class="full form-actions">
              <button type="submit" class="primary">${icon('publish')} Validate & Import</button>
            </div>
            <div class="inline-error full" role="alert"></div>
          </form>
        </div>

        <h3 style="margin-top:20px">${icon('calculate')} Risk Score Methodology</h3>
        <p class="subtitle" style="margin-bottom:8px">Composite risk score is calculated from five weighted factors:</p>
        <div style="display:flex;flex-direction:column;gap:4px;font-size:12px;line-height:1.8;color:var(--text-secondary)">
          <div style="display:flex;justify-content:space-between"><span><strong style="color:var(--text)">30%</strong> — Upcoming visits not yet confirmed</span></div>
          <div style="display:flex;justify-content:space-between"><span><strong style="color:var(--text)">25%</strong> — Number of protocol deviations</span></div>
          <div style="display:flex;justify-content:space-between"><span><strong style="color:var(--text)">20%</strong> — Overdue unanswered queries</span></div>
          <div style="display:flex;justify-content:space-between"><span><strong style="color:var(--text)">15%</strong> — Staff without current training</span></div>
          <div style="display:flex;justify-content:space-between"><span><strong style="color:var(--text)">10%</strong> — Data staleness (record age)</span></div>
        </div>
        <p class="subtitle" style="margin-top:8px;font-family:var(--font-mono);font-size:11px">Thresholds: Critical ≥ 80 · High ≥ 60 · Moderate ≥ 35</p>
      </section>

      <section class="card">
        <div class="section-head">
          <h2>${icon('history')} Audit Trail</h2>
          <span class="badge generic">Recent Events</span>
        </div>
        <p class="subtitle" style="margin-bottom:12px">Every action is recorded with timestamp and actor identity.</p>
        <div id="audit" class="audit-timeline" style="max-height:540px;overflow-y:auto">
          <div style="text-align:center;padding:20px;color:var(--text-muted)">${icon('hourglass_empty')} Loading audit trail...</div>
        </div>
      </section>
    </div>`;
}

// ═════════════════════════════════════════════════════════════
// RENDER
// ═════════════════════════════════════════════════════════════
function render() {
  page = location.hash.slice(1) || 'overview';
  if (!labels[page]) page = 'overview';
  nav();
  const pages = { overview, sites, deviations, participants, capa: capas, reports, rules, settings };
  $('#main').innerHTML = pages[page]();
  if (page === 'settings') {
    api('/api/audit').then(events => {
      const el = $('#audit');
      if (!el) return;
      const actionLabels = {
        seed_created: ['science', 'System initialized'],
        data_replaced: ['upload_file', 'Data imported'],
        finding_reviewed: ['rate_review', 'Deviation reviewed'],
        capa_saved: ['checklist', 'CAPA updated'],
        protocol_updated: ['verified_user', 'Protocol rules updated']
      };
      el.innerHTML = events.length
        ? events.map(e => {
            const [ic, lbl] = actionLabels[e.action] || ['event', e.action.replaceAll('_', ' ')];
            return `
              <div class="timeline-item ${e.action === 'seed_created' ? 'system' : ''}">
                <div class="tl-action">${icon(ic, {size: 15})} ${esc(lbl)}</div>
                <div class="tl-meta">${esc(e.actor)} · ${new Date(e.timestamp).toLocaleString()} · #${e.id}</div>
              </div>`;
          }).join('')
        : '<div style="text-align:center;padding:20px;color:var(--text-muted)">No audit events recorded yet.</div>';
    }).catch(e => toast(e.message, true));
  }
}

// ═════════════════════════════════════════════════════════════
// DIALOG HELPERS
// ═════════════════════════════════════════════════════════════
function openDialog(html) { const d = $('#dialog'); d.innerHTML = html; d.showModal(); }
function dialogHead(title) {
  return `<div class="section-head">
    <h2 id="dialog-title">${title}</h2>
    <button data-action="close" aria-label="Close dialog" style="border:none;background:none;font-size:18px;cursor:pointer;color:var(--text-secondary)">✕</button>
  </div>`;
}

// ── Site detail dialog ────────────────────────────────────
function siteDialog(id) {
  const s = data.sites.find(s => s.id === id);
  if (!s) return;
  const componentLabels = {
    upcoming:  'Upcoming visits not confirmed',
    queries:   'Overdue unanswered queries',
    training:  'Staff without current training',
    freshness: 'Age of most recent records',
    burden:    'Protocol deviations at site',
  };
  openDialog(dialogHead(`${icon('location_on')} ${esc(s.id)} · ${esc(s.name)}`) + `
    <div class="notice" style="align-items:center">
      ${badge(s.band, 'pill')} &nbsp; Risk score: <strong class="mono">${s.score ?? '—'} / 100</strong> &nbsp;·&nbsp;
      ${s.evaluatedVisits} visits evaluated · ${s.dataGapVisits} with missing data
    </div>
    <h3>Score Breakdown</h3>
    <p class="subtitle">Each factor contributes points to the composite risk score.</p>
    <div class="driver-bar-group" style="margin:12px 0">
      ${Object.entries(s.components).map(([k, v], i) => {
        const colors = ['var(--red-600)', 'var(--orange-500)', 'var(--amber-500)', 'var(--slate-400)', 'var(--teal-500)'];
        return `
        <div class="driver-bar-item">
          <div class="driver-bar-header">
            <span class="driver-label">
              <span class="driver-dot" style="background:${colors[i]}"></span>
              ${esc(componentLabels[k] || k)}
            </span>
            <span class="driver-pct mono">${v.points} / ${v.weight} pts</span>
          </div>
          <div class="driver-bar-track">
            <span class="driver-bar-fill" style="width:${v.value * 100}%;background:${colors[i]}"></span>
          </div>
        </div>`;
      }).join('')}
    </div>
    <p class="subtitle" style="margin-top:10px;font-family:var(--font-mono);font-size:11px">
      ${s.upcomingCount} upcoming · ${s.overdueQueries}/${s.openQueries} queries overdue ·
      ${s.untrainedStaff}/${s.staffCount} staff untrained · records ${s.dataAgeDays}d old
    </p>
    <div class="form-actions">
      <button class="primary" data-action="site-findings" data-id="${esc(id)}">${icon('arrow_forward')} Review Deviations at This Site</button>
    </div>`);
}

// ── Finding detail dialog ─────────────────────────────────
function findingDialog(id) {
  const f = data.findings.find(f => f.id === id);
  if (!f) return;
  const visits = source.visits.filter(v => v.participantId === f.participantId && v.siteId === f.siteId);
  openDialog(dialogHead(`${icon('search')} Deviation Review · ${esc(f.participantId)}`) + `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
      ${badge(f.severity)} ${badge(f.status)}
      <span class="mono subtitle muted">${esc(f.id)}</span>
    </div>
    <h2 style="margin-bottom:10px">${esc(f.title)}</h2>
    <div class="detail-list">
      <div><small>Observed</small>${esc(f.observed)}</div>
      <div><small>Expected (per ${esc(f.reference)})</small>${esc(f.expected)}</div>
      <div><small>Site · Visit</small>${esc(f.siteId)} / ${esc(f.visitId)}</div>
      <div><small>Protocol Version · Date</small>${esc(f.protocolVersion)} / ${esc(f.eventDate)}</div>
    </div>
    <div class="recommendation">
      <strong>${icon('lightbulb', {size: 14})} Suggested Action</strong>${esc(f.recommendation)}
    </div>
    <h3>Patient Visit Records at This Site</h3>
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>Visit</th><th>Scheduled</th><th>Actual</th><th>Dose (mg)</th><th>Medications</th>
        </tr></thead>
        <tbody>
          ${visits.map(v => `
            <tr>
              <td class="mono" style="font-size:11px">${esc(v.id)}</td>
              <td class="mono" style="font-size:11px">${esc(v.scheduledDate)}</td>
              <td class="mono" style="font-size:11px">${esc(v.actualDate || '⚠️ Not recorded')}</td>
              <td>${v.doseMg ?? '⚠️ Unknown'}</td>
              <td>${esc(v.medications === null ? '⚠️ Unknown' : v.medications.join(', ') || 'None')}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <h3 style="margin-top:16px">Review Decision</h3>
    <p class="subtitle">Review the patient records above, then record your decision.</p>
    <form id="review-form" data-id="${esc(f.id)}">
      <div class="form-grid">
        <label>
          Your name (reviewer)
          <input name="actor" value="${esc(f.review?.actor || '')}" maxlength="100" required placeholder="Enter your full name">
        </label>
        <label>
          Decision
          <select name="decision">
            <option value="under review" ${f.status === 'under review' ? 'selected' : ''}>Under Review</option>
            <option value="confirmed" ${f.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="dismissed" ${f.status === 'dismissed' ? 'selected' : ''}>Dismissed</option>
          </select>
        </label>
        <label class="full">
          Reason / notes
          <textarea name="reason" maxlength="4000" required placeholder="Describe what you checked in the source records...">${esc(f.review?.reason || '')}</textarea>
        </label>
      </div>
      <div class="inline-error" role="alert"></div>
      <div class="form-actions">
        <button type="button" data-action="capa-finding" data-id="${esc(f.id)}">${icon('edit_note')} Create CAPA</button>
        <button class="primary" type="submit">${icon('save')} Save Review</button>
      </div>
    </form>`);
}

// ── CAPA dialog ───────────────────────────────────────────
function capaDialog(findingId, capa) {
  const f = data.findings.find(f => f.id === findingId);
  if (!f) { toast('This deviation no longer exists in the current analysis. Please refresh.', true); return; }
  $('#dialog').close();
  const fieldConfig = [
    ['rootCause',          'Root Cause Analysis',                            'What went wrong and why?'],
    ['correctiveAction',   'Corrective Action (Immediate)',                  f.recommendation],
    ['preventiveAction',   'Preventive Action (Future)',                     'How to prevent recurrence?'],
    ['effectiveness',      'Effectiveness Measurement',                     'How will you verify the fix worked?'],
    ['closureEvidence',    'Closure Evidence (required to close)',           ''],
  ];
  openDialog(dialogHead(capa ? `${icon('edit')} Edit CAPA · ${esc(capa.id)}` : `${icon('add')} Create New CAPA`) + `
    <div class="notice" style="align-items:center">
      ${icon('warning', {size: 15})}
      <div><strong>Linked Deviation:</strong> ${esc(f.siteId)} · ${esc(f.title)} · ${esc(f.observed)}</div>
    </div>
    <form id="capa-form" data-finding="${esc(f.id)}" data-id="${esc(capa?.id || '')}">
      <div class="form-grid">
        <label>
          Assigned Owner
          <input name="owner" value="${esc(capa?.owner || '')}" required maxlength="100" placeholder="Full name of responsible person">
        </label>
        <label>
          Due Date
          <input name="dueDate" type="date" value="${esc(capa?.dueDate || '')}" required>
        </label>
        <label>
          Your name (reviewer)
          <input name="actor" value="${esc(capa?.actor || '')}" required maxlength="100" placeholder="Your full name">
        </label>
        <label>
          Status
          <select name="status">
            <option value="draft" ${(!capa || capa.status === 'draft') ? 'selected' : ''}>Draft</option>
            <option value="in progress" ${capa?.status === 'in progress' ? 'selected' : ''}>In Progress</option>
            <option value="effectiveness check" ${capa?.status === 'effectiveness check' ? 'selected' : ''}>Effectiveness Check</option>
            <option value="closed" ${capa?.status === 'closed' ? 'selected' : ''}>Closed</option>
          </select>
        </label>
        ${fieldConfig.map(([k, label, placeholder]) => `
          <label class="full">
            ${label}
            <textarea name="${k}" maxlength="4000" ${k !== 'closureEvidence' ? 'required' : ''} placeholder="${esc(placeholder)}">${esc(capa?.[k] ?? (k === 'correctiveAction' ? f.recommendation : ''))}</textarea>
          </label>`).join('')}
      </div>
      <div class="inline-error" role="alert"></div>
      <div class="form-actions">
        <button class="primary" type="submit">${icon('save')} Save CAPA</button>
      </div>
    </form>`);
}

// ═════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ═════════════════════════════════════════════════════════════
document.addEventListener('click', async e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const id = el.dataset.id;
  try {
    switch (el.dataset.action) {
      case 'refresh':
        el.disabled = true;
        await load();
        toast('Analysis refreshed successfully.');
        break;
      case 'close':         $('#dialog').close(); break;
      case 'site':          siteDialog(id); break;
      case 'select-site':
        selectedSite = id;
        render();
        break;
      case 'site-link':
        e.preventDefault();
        filter = { q: '', severity: 'all', site: id }; offset = 0;
        location.hash = 'sites'; render(); break;
      case 'participant-link':
        e.preventDefault();
        selectedParticipant = id;
        location.hash = 'participants'; render(); break;
      case 'finding':       findingDialog(id); break;
      case 'capa-finding':  capaDialog(id); break;
      case 'edit-capa': {
        const c = data.capas.find(c => c.id === id);
        if (c) capaDialog(c.findingId, c);
        break;
      }
      case 'new-capa':
        if (!data.findings.length) { toast('No deviations available. Deviations are needed to create a CAPA.'); break; }
        openDialog(dialogHead(`${icon('edit_note')} Select Deviation for CAPA`) + `
          <p class="subtitle" style="margin-bottom:10px">Select the confirmed deviation this CAPA addresses:</p>
          <label style="font-size:12px;font-weight:500">
            Deviation
            <select id="capa-select" style="display:block;margin-top:5px;width:100%">
              ${data.findings.map(f => `<option value="${esc(f.id)}">${esc(f.siteId)} · ${esc(f.participantId)} · ${esc(f.title)}</option>`).join('')}
            </select>
          </label>
          <div class="form-actions">
            <button class="primary" data-action="choose-capa">${icon('arrow_forward')} Continue</button>
          </div>`);
        break;
      case 'choose-capa':   capaDialog($('#capa-select').value); break;
      case 'capa-from-site':
        const siteFindings = data.findings.filter(f => f.siteId === id);
        if (siteFindings.length) capaDialog(siteFindings[0].id);
        else toast('No deviations found for this site.');
        break;
      case 'site-findings':
        $('#dialog').close();
        filter = { q: '', severity: 'all', site: id }; offset = 0;
        location.hash = 'deviations'; render(); break;
      case 'clear':
        filter = { q: '', severity: 'all', site: 'all' }; offset = 0; render(); break;
      case 'prev': offset = Math.max(0, offset - 20); render(); break;
      case 'next': offset += 20; render(); break;
      case 'page': offset = parseInt(el.dataset.page) * 20; render(); break;
      case 'print': window.print(); break;
      case 'capa-view':
        capaView = el.dataset.view; render(); break;
    }
  } catch (error) {
    toast(error.message, true);
  } finally {
    el.disabled = false;
  }
});

// ── Search / filter inputs ────────────────────────────────
document.addEventListener('input', e => {
  if (e.target.id === 'search' || e.target.id === 'site-quick-filter') {
    const pos = e.target.selectionStart;
    filter.q = e.target.value; offset = 0; render();
    const el = $(`#${e.target.id}`);
    el?.focus();
    el?.setSelectionRange(pos, pos);
  }
});
document.addEventListener('change', e => {
  if (e.target.id === 'participant-select') {
    selectedParticipant = e.target.value;
    render();
  } else if (e.target.id === 'site-filter' || e.target.id === 'severity-filter') {
    filter[e.target.id === 'site-filter' ? 'site' : 'severity'] = e.target.value;
    offset = 0; render();
  }
});

// ── Form submissions ──────────────────────────────────────
document.addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  const values = Object.fromEntries(new FormData(form));
  const button = $('button[type="submit"]', form);
  const error = $('.inline-error', form);
  if (error) error.textContent = '';
  if (button) button.disabled = true;
  try {
    if (form.id === 'review-form') {
      await api('/api/reviews', { ...values, findingId: form.dataset.id });
      $('#dialog').close(); await load();
      toast('Review decision saved successfully.');
    } else if (form.id === 'capa-form') {
      await api('/api/capas', { ...values, findingId: form.dataset.finding, ...(form.dataset.id ? { id: form.dataset.id } : {}) });
      $('#dialog').close(); location.hash = 'capa'; await load();
      toast('CAPA saved successfully.');
    } else if (form.id === 'protocol-form') {
      const p = {
        id: data.protocol.id,
        version: values.version,
        effectiveDate: values.effectiveDate,
        visitWindowDays: Number(values.visitWindowDays),
        doseMg: Number(values.doseMg),
        doseToleranceMg: Number(values.doseToleranceMg),
        bannedMedications: values.bannedMedications.split(',').map(s => s.trim()).filter(Boolean),
        severity: {
          wrong_dose: values.sev_wrong_dose,
          banned_medication: values.sev_banned_medication,
          missed_visit: values.sev_missed_visit,
          visit_window: values.sev_visit_window,
          documentation: values.sev_documentation
        },
        references: data.protocol.references
      };
      await api('/api/protocol', { actor: values.actor, protocol: p });
      await load(); toast('Protocol rules updated successfully.');
    } else if (form.id === 'date-form') {
      const previous = asOf; asOf = values.date;
      try { await load(); toast('Evaluation date updated.'); }
      catch (err) { asOf = previous; throw err; }
    } else if (form.id === 'import-form') {
      const file = values.file;
      if (file.size > 20_000_000) throw Error('File is too large (max 20 MB)');
      await api('/api/import', { actor: values.actor, data: JSON.parse(await file.text()) });
      await load(); toast('Dataset validated and imported successfully.');
    }
  } catch (err) {
    if (error) error.textContent = err.message;
    else toast(err.message, true);
  } finally {
    if (button) button.disabled = false;
  }
});

// ── Routing ───────────────────────────────────────────────
window.addEventListener('hashchange', () => { offset = 0; selectedSite = null; render(); });

// ── Skip link ─────────────────────────────────────────────
$('.skip').addEventListener('click', event => { event.preventDefault(); $('#main').focus(); });

// ── Quick search (Ctrl+K) ─────────────────────────────────
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    toggleSearch();
  }
  if (e.key === 'Escape') {
    const overlay = $('#search-overlay');
    if (!overlay.hidden) { overlay.hidden = true; }
  }
});

// Topbar search click
const cmdSearch = $('#cmd-search');
if (cmdSearch) {
  cmdSearch.addEventListener('focus', e => { e.target.blur(); toggleSearch(); });
}

function toggleSearch() {
  const overlay = $('#search-overlay');
  overlay.hidden = !overlay.hidden;
  if (!overlay.hidden) {
    const input = $('#search-input');
    input.value = '';
    input.focus();
    $('#search-results').innerHTML = `<div class="search-empty">${icon('search', {size: 20})} Type to search sites, participants, and deviations...</div>`;
  }
}

document.addEventListener('input', e => {
  if (e.target.id === 'search-input' && data) {
    const q = e.target.value.toLowerCase().trim();
    const results = $('#search-results');
    if (!q) {
      results.innerHTML = `<div class="search-empty">${icon('search', {size: 20})} Type to search...</div>`;
      return;
    }
    let html = '';
    // Search sites
    data.sites.filter(s => (s.id + s.name + s.region).toLowerCase().includes(q)).slice(0, 5).forEach(s => {
      html += `<div class="search-result" data-action="search-nav" data-target="sites" data-filter="${esc(s.id)}">
        ${icon('domain')}
        <div>
          <div class="sr-label">${esc(s.name)}</div>
          <div style="font-size:11px;color:var(--text-muted)">${esc(s.id)} · ${esc(s.region)}</div>
        </div>
        <span class="sr-meta">${badge(s.band, 'pill')}</span>
      </div>`;
    });
    // Search participants
    const matchingPts = [...new Set(data.findings.map(f => f.participantId).concat(source?.visits ? source.visits.slice(0, 100).map(v => v.participantId) : []))].filter(pid => pid.toLowerCase().includes(q)).slice(0, 4);
    matchingPts.forEach(pid => {
      const devCount = data.findings.filter(f => f.participantId === pid).length;
      html += `<div class="search-result" data-action="search-participant" data-id="${esc(pid)}">
        ${icon('group')}
        <div>
          <div class="sr-label">${esc(pid)}</div>
          <div style="font-size:11px;color:var(--text-muted)">Participant Dossier · ${devCount} Deviations</div>
        </div>
        <span class="sr-meta">${devCount > 0 ? badge('critical', 'pill') : badge('low', 'pill')}</span>
      </div>`;
    });
    // Search findings
    data.findings.filter(f => (f.participantId + f.title + f.id + f.siteId).toLowerCase().includes(q)).slice(0, 5).forEach(f => {
      html += `<div class="search-result" data-action="search-finding" data-id="${esc(f.id)}">
        ${icon('warning')}
        <div>
          <div class="sr-label">${esc(f.title)}</div>
          <div style="font-size:11px;color:var(--text-muted)">${esc(f.participantId)} · ${esc(f.siteId)}</div>
        </div>
        <span class="sr-meta">${badge(f.severity)}</span>
      </div>`;
    });
    results.innerHTML = html || `<div class="search-empty">No results for "${esc(q)}"</div>`;
  }
});

// Search result clicks
document.addEventListener('click', e => {
  const sr = e.target.closest('.search-result');
  if (!sr) return;
  const overlay = $('#search-overlay');
  overlay.hidden = true;
  if (sr.dataset.action === 'search-nav') {
    filter = { q: '', severity: 'all', site: sr.dataset.filter }; offset = 0;
    location.hash = sr.dataset.target; render();
  } else if (sr.dataset.action === 'search-finding') {
    findingDialog(sr.dataset.id);
  } else if (sr.dataset.action === 'search-participant') {
    selectedParticipant = sr.dataset.id;
    location.hash = 'participants';
    render();
  }
});

// Close search on backdrop click
document.addEventListener('click', e => {
  if (e.target.id === 'search-overlay') {
    e.target.hidden = true;
  }
});

// ── Initial load ──────────────────────────────────────────
load().catch(e => {
  $('#main').innerHTML = `
    <section class="card" style="text-align:center;padding:40px">
      <div style="font-size:40px;margin-bottom:16px">${icon('cloud_off', {size: 48})}</div>
      <h1>Unable to Load Data</h1>
      <p style="color:var(--text-secondary);margin:10px 0 18px">${esc(e.message)}</p>
      <p class="subtitle">Make sure the backend server is running, then try again.</p>
      <button data-action="refresh" class="primary" style="margin-top:8px">${icon('refresh')} Try Again</button>
    </section>`;
});

// ── Auto-refresh (read-only pages only) ───────────────────
setInterval(() => {
  if (!data || document.hidden || $('#dialog').open ||
      !['overview', 'sites', 'deviations', 'participants', 'capa'].includes(page) ||
      ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
  load().catch(err => toast('Auto-refresh failed: ' + err.message, true));
}, 30000);

// ── Freshness indicator ───────────────────────────────────
setInterval(() => {
  if (!lastLoad) return;
  const el = $('#freshness-text');
  if (!el) return;
  const ago = Math.round((Date.now() - lastLoad) / 1000);
  if (ago < 5) el.textContent = 'Analysis Current';
  else if (ago < 60) el.textContent = `Refreshed ${ago}s ago`;
  else el.textContent = `Refreshed ${Math.round(ago / 60)}m ago`;
}, 1000);
