/* ============================================================
   ArcGuardAI – Non-Technical Friendly Frontend
   All jargon replaced with plain English. Every section has
   a purpose description and a "what to do next" guide.
   ============================================================ */

// ── Tiny utilities ──────────────────────────────────────────
const $ = (s, root = document) => root.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ── SVG icon paths ────────────────────────────────────────────
const icons = {
  overview: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  sites:    'M4 21V4h12v17 M8 8h4 M8 12h4 M8 16h4 M16 11h4v10 M2 21h20',
  deviations: 'M12 3 2 21h20L12 3z M12 9v5 M12 17v1',
  capa:     'M8 4H5v17h14V4h-3 M8 3h8v4H8z M8 13l3 3 5-6',
  reports:  'M4 3h16v18H4z M8 16v-4 M12 16V8 M16 16v-6',
  rules:    'M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3z M8 12l3 3 5-6',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2',
  refresh:  'M20 7v5h-5 M4 17v-5h5 M6 6a8 8 0 0 1 13 2 M18 18A8 8 0 0 1 5 16',
  arrow:    'M4 12h16 M14 6l6 6-6 6',
  download: 'M12 3v12 M7 10l5 5 5-5 M4 16v5h16v-5',
  trend:    'M3 17l6-7 5 4 7-9 M16 5h5v5',
};
const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[name] || icons.overview}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// ── Friendly badge labels ─────────────────────────────────────
const friendlyBadge = {
  major:              'Serious Problem',
  minor:              'Small Issue',
  administrative:     'Paperwork Issue',
  critical:           '🔴 Critical',
  high:               '🟠 High Risk',
  moderate:           '🟡 Moderate',
  low:                '🟢 Low Risk',
  'under review':     '👀 Being Reviewed',
  confirmed:          '✅ Confirmed',
  dismissed:          'Dismissed',
  draft:              '📝 Draft',
  'in progress':      '🔧 In Progress',
  'effectiveness check': '🔍 Checking Results',
  closed:             '✅ Closed',
  'needs review':     '⚠️ Needs Attention',
  overdue:            '🚨 Overdue',
};
const badge = v => {
  const key = String(v).toLowerCase();
  const label = friendlyBadge[key] || v;
  const cls = key.replaceAll(' ', '-');
  return `<span class="badge ${cls}">${esc(label)}</span>`;
};

// ── Tooltip helper ─────────────────────────────────────────────
const tip = (label, explanation) =>
  `<span class="help-tip" tabindex="0">${esc(label)}<span class="ht-icon" title="${esc(explanation)}">?</span><span class="ht-bubble">${esc(explanation)}</span></span>`;

// ── App state ─────────────────────────────────────────────────
let data, source, auth = null, asOf = '2026-09-15', page = 'overview';
let filter = { q: '', severity: 'all', site: 'all' }, offset = 0;
let welcomeDismissed = false;

// ── Navigation labels (plain English) ─────────────────────────
const labels = {
  overview:    'Dashboard',
  sites:       'Research Sites',
  deviations:  'Issues Found',
  capa:        'Action Plans',
  reports:     'Reports',
  rules:       'Study Rules',
  settings:    'Settings',
};

// ── Page titles & plain-English descriptions ───────────────────
const titles = {
  overview:   ['Study Dashboard', 'Your at-a-glance view of how the entire study is performing. Look here first every day.'],
  sites:      ['Research Sites', 'See which hospitals or clinics running this study need attention. Higher score = more urgent.'],
  deviations: ['Issues Found', 'These are things that didn\'t go according to plan. Each one needs to be reviewed and either confirmed or dismissed.'],
  capa:       ['Action Plans (CAPAs)', 'Once an issue is confirmed, an Action Plan is created here to fix the root cause and prevent it from happening again.'],
  reports:    ['Reports & Downloads', 'Download official reports for your records, inspections, or to share with your team.'],
  rules:      ['Study Rules', 'The specific rules this study must follow (e.g. correct dose, visit timing). Violations create issues automatically.'],
  settings:   ['Settings', 'Change the evaluation date, upload new data, or see a full history of every change made.'],
};

// ── Page "what to do" guides ───────────────────────────────────
const guides = {
  overview: '👋 <strong>Start here.</strong> Check the number of <em>High-Risk Sites</em>. If any are flagged as Critical or High, go to <em>Research Sites</em> and inspect the top ones first.',
  sites: '📋 <strong>Review top-priority sites.</strong> Click <em>"Inspect Site"</em> on any row to see exactly what is driving the risk score. Then go to <em>Issues Found</em> to review specific problems.',
  deviations: '🔍 <strong>Review each issue.</strong> Click <em>"View Details"</em> to see the patient\'s records and decide if the issue is real. Choose <em>Confirmed</em>, <em>Being Reviewed</em>, or <em>Dismissed</em>.',
  capa: '✅ <strong>Track your fixes.</strong> Create an Action Plan from a confirmed issue. Fill in who is responsible, what they will do, and by when.',
  reports: '📥 <strong>Download reports</strong> for your quality review, inspection preparation, or regulatory submission. All data is as of the selected date.',
  rules: '📖 <strong>Read the study rules.</strong> These define what counts as a violation. You can publish a new rule version if the study protocol changes.',
  settings: '⚙️ <strong>Advanced options.</strong> Change the date to view historical data, import a new dataset, or check the audit log for all recent changes.',
};

// ── Toast notification ────────────────────────────────────────
function toast(message, error = false) {
  const el = $('#toast');
  el.textContent = message;
  el.className = error ? 'error' : '';
  el.style.display = 'block';
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.style.display = 'none', 6000);
}

// ── API calls ─────────────────────────────────────────────────
async function api(path, body) {
  const headers = { ...(body ? { 'Content-Type': 'application/json' } : {}) };
  if (auth?.csrf) headers['X-CSRF-Token'] = auth.csrf;
  const res = await fetch(path, {
    credentials: 'same-origin',
    headers,
    ...(body ? { method: 'POST', body: JSON.stringify({ ...body, asOf }) } : {})
  });
  const result = await res.json();
  if (!res.ok) throw Error(result.error || 'Request failed');
  return result;
}

// ── Load data ─────────────────────────────────────────────────
async function load() {
  try {
    auth = await api('/api/auth/me');
  } catch (error) {
    auth = null;
    render();
    return;
  }
  [data, source] = await Promise.all([api(`/api/analysis?asOf=${asOf}`), api('/api/data')]);
  $('#site-count').textContent = `${data.summary.sites} Sites`;
  render();
}

function authScreen(error = '') {
  $('#main').innerHTML = `
    <section class="auth-shell" aria-labelledby="login-title">
      <div class="auth-card">
        <img src="/assets/arcguard-logo.png" alt="ArcGuard" class="auth-logo">
        <p class="eyebrow">Clinical trial risk monitor</p>
        <h1 id="login-title">Sign in to ArcGuard</h1>
        <p class="subtitle">Use your authorised reviewer account to view study data and manage findings.</p>
        ${error ? `<div class="inline-error" role="alert">${esc(error)}</div>` : ''}
        <form id="login-form" class="auth-form">
          <label>Email<input name="email" type="email" autocomplete="username" required autofocus placeholder="you@example.com"></label>
          <label>Password<input name="password" type="password" autocomplete="current-password" required placeholder="Enter your password"></label>
          <button class="primary" type="submit">Sign in</button>
        </form>
        <p class="auth-note">Administrator access only. Use the credentials supplied with your local deployment.</p>
      </div>
    </section>`;
}

// ── Navigation ─────────────────────────────────────────────────
function nav() {
  const openCapas = data.capas.filter(c => c.status !== 'closed').length;
  $('#nav').innerHTML =
    `<div class="nav-label">Main Menu</div>` +
    Object.entries(labels).map(([id, label], i) =>
      `${i === 5 ? '<div class="nav-label controls">Study Setup</div>' : ''}
       <a href="#${id}" id="nav-${id}" ${id === page ? 'class="active" aria-current="page"' : ''}>
         ${icon(id)}<span>${label}</span>
         ${id === 'deviations' ? `<span class="count">${data.findings.length}</span>` : ''}
         ${id === 'capa' && openCapas > 0 ? `<span class="count">${openCapas}</span>` : ''}
       </a>`
    ).join('') + `<button class="nav-logout" data-action="logout" type="button">Sign out</button>`;
}

// ── Page header ──────────────────────────────────────────────
function head(extra = '') {
  return `
    <div class="page-head">
      <div>
        <h1>${titles[page][0]}</h1>
        <p class="page-title-desc">${titles[page][1]}</p>
      </div>
      <div class="actions">
        ${extra || `<span class="subtle muted">Showing data as of ${asOf}</span>
                    <button id="btn-refresh" data-action="refresh">${icon('refresh')} Refresh</button>`}
      </div>
    </div>
    <div class="action-guide">
      <span class="ag-icon">💡</span>
      <p>${guides[page]}</p>
    </div>`;
}

// ── Welcome banner ─────────────────────────────────────────────
function welcomeBanner() {
  if (welcomeDismissed) return '';
  return `
    <div class="welcome-banner" id="welcome-banner">
      <span class="wb-icon">🛡️</span>
      <div>
        <h2>Welcome to ArcGuardAI – Clinical Trial Monitor</h2>
        <p>This tool helps your team spot problems in the clinical trial early — before they become serious.
           It automatically checks patient visit records against the study rules and flags anything that doesn't match.
           You don't need a technical background to use it. Start on the <strong>Dashboard</strong> tab.</p>
      </div>
      <button class="dismiss" data-action="dismiss-welcome">Got it ✓</button>
    </div>`;
}

// ── How-it-works steps (shown on overview only) ────────────────
function howItWorks() {
  return `
    <div class="how-steps">
      <div class="how-step"><div class="step-num">1</div>
        <div><h4>Check the Dashboard</h4><p>See an instant summary of all sites, visits, and issues.</p></div>
      </div>
      <div class="how-step"><div class="step-num">2</div>
        <div><h4>Review High-Risk Sites</h4><p>Sites with a high score need urgent attention. Inspect them first.</p></div>
      </div>
      <div class="how-step"><div class="step-num">3</div>
        <div><h4>Investigate Issues</h4><p>Go to "Issues Found" to review flagged problems one by one.</p></div>
      </div>
      <div class="how-step"><div class="step-num">4</div>
        <div><h4>Create Action Plans</h4><p>For confirmed issues, create a CAPA to fix the problem and prevent recurrence.</p></div>
      </div>
      <div class="how-step"><div class="step-num">5</div>
        <div><h4>Download Reports</h4><p>Export a full report for your records or regulatory submission.</p></div>
      </div>
    </div>`;
}

// ── Stat cards ─────────────────────────────────────────────────
function stats() {
  const s = data.summary;
  const regions = new Set(data.sites.map(s => s.region)).size;
  const compliance = s.compliance === null ? '—' : s.compliance + '%';
  return `
    <div class="cards">
      <section class="card stat">
        <div class="stat-label">
          ${tip('Sites Being Monitored', 'A "site" is a hospital or clinic participating in the study. We check each one automatically.')}
          ${icon('sites')}
        </div>
        <div class="stat-value">${s.sites}</div>
        <div class="stat-desc">Across ${regions} world regions</div>
      </section>
      <section class="card stat">
        <div class="stat-label">
          ${tip('Total Patient Visits', 'Each time a patient comes in for a check-up or treatment, that is counted as one visit.')}
          ${icon('overview')}
        </div>
        <div class="stat-value">${s.visits.toLocaleString()}</div>
        <div class="stat-desc">${s.pendingVisits.toLocaleString()} upcoming visits scheduled</div>
      </section>
      <section class="card stat success">
        <div class="stat-label">
          ${tip('Visit Compliance Rate', 'What percentage of visits followed all the study rules correctly. Higher is better.')}
          ${icon('rules')}
        </div>
        <div class="stat-value teal">${compliance}</div>
        <div class="stat-desc">${s.evaluatedVisits.toLocaleString()} visits fully checked · ${s.dataGapVisits} with missing info</div>
      </section>
      <section class="card stat danger">
        <div class="stat-label">
          ${tip('High-Risk Sites', 'Sites that need urgent review based on their compliance score and number of issues found.')}
          ${badge('needs review')}
        </div>
        <div class="stat-value">${s.highRiskSites}</div>
        <div class="stat-desc">${data.sites.filter(s => s.band === 'critical').length} Critical · ${data.sites.filter(s => s.band === 'high').length} High Risk</div>
      </section>
    </div>`;
}

// ── Site name lookup ──────────────────────────────────────────
const siteName = id => data.sites.find(s => s.id === id)?.name || id;

// ── Finding rows ──────────────────────────────────────────────
function findingRows(rows) {
  if (!rows.length) return `<tr><td colspan="6" class="empty">
    <div class="empty-icon">🎉</div>No issues match these filters.
  </td></tr>`;
  return rows.map(f => `
    <tr>
      <td><span class="mono">${esc(f.participantId)}</span></td>
      <td><span class="mono">${esc(f.siteId)}</span> <span class="muted">·</span> ${esc(siteName(f.siteId))}</td>
      <td>${esc(f.title)}</td>
      <td>${badge(f.severity)}</td>
      <td>${badge(f.status)}</td>
      <td><button class="link" data-action="finding" data-id="${esc(f.id)}">View Details →</button></td>
    </tr>`).join('');
}

function findingTable(rows) {
  return `
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>${tip('Patient ID', 'A code that identifies the patient without revealing their real name, for privacy.')}</th>
          <th>${tip('Site', 'The hospital or clinic where this patient is being treated.')}</th>
          <th>What Went Wrong</th>
          <th>${tip('Severity', 'How serious the issue is. Serious Problem = must act now. Small Issue = review when possible.')}</th>
          <th>${tip('Review Status', 'Has someone looked at this issue yet? Being Reviewed → Confirmed → closed via Action Plan.')}</th>
          <th>Action</th>
        </tr></thead>
        <tbody>${findingRows(rows)}</tbody>
      </table>
    </div>`;
}

// ── Overview page ─────────────────────────────────────────────
function overview() {
  const top = data.sites.slice(0, 5), first = top[0];
  return welcomeBanner() + head() + howItWorks() + stats() + `
    <div class="grid">
      <section class="card">
        <div class="section-head">
          <div>
            <h2>Top 5 Sites Needing Attention</h2>
            <p class="subtitle">The higher the bar, the more urgent that site is. Score goes from 0 (all good) to 100 (critical).</p>
          </div>
          <span class="badge mono">Top 5</span>
        </div>
        ${top.map(s => `
          <div class="risk-row">
            <div class="risk-line">
              <a class="mono" href="#sites" data-action="site-link" data-id="${esc(s.id)}">${esc(s.id)}</a>
              <span class="muted">·</span>
              <span>${esc(s.name)}</span>
              ${badge(s.band)}
              <span class="score mono">${s.score ?? '—'}</span>
            </div>
            <div class="bar ${s.band}"><span style="width:${s.score || 0}%"></span></div>
          </div>`).join('')}
        <div class="axis mono">
          <span>0 (No issues)</span><span>25</span><span>50</span><span>75</span><span>100 (Most Urgent)</span>
        </div>
      </section>

      <section class="card insight">
        <div class="section-head">
          <h2>${icon('trend')} Most Urgent Site</h2>
          ${first ? badge(first.band) : ''}
        </div>
        ${first ? `
          <h3>${esc(first.id)} – ${esc(first.name)}</h3>
          <p>This site has the highest risk score right now. It has <strong>${first.affectedVisits} visits with issues</strong> and needs immediate attention.</p>
          <div class="eyebrow">Main reasons for high score</div>
          <div class="tags">
            ${Object.entries(first.components)
              .filter(([k]) => k !== 'burden')
              .sort((a, b) => b[1].points - a[1].points)
              .slice(0, 3)
              .map(([k, v]) => `<span class="badge">${esc({ upcoming: 'Upcoming visits unconfirmed', queries: 'Overdue queries', training: 'Untrained staff', freshness: 'Old records' }[k] || k)} · ${v.points} pts</span>`)
              .join('')}
          </div>
          <div class="recommendation">
            <strong>👉 Recommended Next Step</strong>
            Go to this site's record, check upcoming visits, follow up on overdue questions, and verify staff training is up to date.
          </div>
          <button class="primary wide" data-action="site" data-id="${esc(first.id)}">
            Inspect ${esc(first.id)} Now →
          </button>` : ''}
      </section>
    </div>

    <section class="card">
      <div class="section-head">
        <div>
          <h2>Recent Issues Found</h2>
          <p class="subtitle">The most recently detected problems. Each needs to be reviewed.</p>
        </div>
        <a href="#deviations">See all ${data.findings.length} issues →</a>
      </div>
      ${findingTable([...data.findings].sort((a, b) => b.eventDate.localeCompare(a.eventDate)).slice(0, 5))}
    </section>`;
}

// ── Toolbar ──────────────────────────────────────────────────
function toolbar(showSeverity = false) {
  return `
    <div class="toolbar">
      <label class="search">
        🔍 Search by site, patient, or issue description
        <input id="search" type="search" value="${esc(filter.q)}" placeholder="Type to search…">
      </label>
      <label>
        Filter by Site
        <select id="site-filter">
          <option value="all">All Sites</option>
          ${data.sites.map(s => `<option value="${esc(s.id)}" ${filter.site === s.id ? 'selected' : ''}>${esc(s.name)} (Site ${esc(s.id.replace('SITE-',''))})</option>`).join('')}
        </select>
      </label>
      ${showSeverity ? `<label>
        Filter by Severity
        <select id="severity-filter">
          ${['all', 'major', 'minor', 'administrative'].map(s =>
            `<option ${s === filter.severity ? 'selected' : ''} value="${s}">
              ${s === 'all' ? 'All Severities' : s === 'major' ? 'Serious Problems' : s === 'minor' ? 'Small Issues' : 'Paperwork Issues'}
            </option>`).join('')}
        </select>
      </label>` : ''}
      <button data-action="clear">Clear Filters</button>
    </div>`;
}

// ── Filter helper ─────────────────────────────────────────────
function filtered(rows) {
  return rows.filter(r =>
    (filter.site === 'all' || (r.siteId || r.id) === filter.site) &&
    JSON.stringify(r).toLowerCase().includes(filter.q.toLowerCase()) &&
    (!r.severity || filter.severity === 'all' || r.severity === filter.severity)
  );
}

// ── Pager ─────────────────────────────────────────────────────
function pager(total) {
  return `
    <div class="pagination">
      <span>Showing ${total ? offset + 1 : 0}–${Math.min(offset + 20, total)} of ${total} records</span>
      <div class="actions">
        <button data-action="prev" ${offset === 0 ? 'disabled' : ''}>← Previous</button>
        <button data-action="next" ${offset + 20 >= total ? 'disabled' : ''}>Next →</button>
      </div>
    </div>`;
}

// ── Sites page ────────────────────────────────────────────────
function sites() {
  const rows = filtered(data.sites);
  return head() + stats() + toolbar() + `
    <section class="card">
      <div class="section-head">
        <h2>All Research Sites</h2>
        <span class="subtitle">Sorted by urgency — highest score at the top</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Site Name &amp; Location</th>
            <th>${tip('Compliance %', 'What percentage of visits at this site followed all the study rules.')}</th>
            <th>${tip('Serious Problems', 'Number of high-severity issues found at this site.')}</th>
            <th>${tip('Missing Data', 'Visits where patient records are incomplete or missing.')}</th>
            <th>${tip('Open Action Plans', 'How many CAPAs (fixes) are still in progress at this site.')}</th>
            <th>${tip('Risk Score', 'An automatic score from 0–100. Higher = more urgent attention needed.')}</th>
            <th>Risk Level</th>
            <th>Action</th>
          </tr></thead>
          <tbody>
            ${rows.slice(offset, offset + 20).map(s => `
              <tr>
                <td>
                  <strong class="mono">${esc(s.id)}</strong>
                  <div class="muted subtle">${esc(s.name)} · ${esc(s.region)}</div>
                </td>
                <td>${s.compliance ?? '—'}${s.compliance === null ? '' : '%'}</td>
                <td>${s.majorCount}</td>
                <td>${s.dataGapVisits}</td>
                <td>${data.capas.filter(c => c.siteId === s.id && c.status !== 'closed').length}</td>
                <td class="mono">
                  ${s.score ?? '—'}
                  <div class="bar ${s.band}" style="margin-top:4px"><span style="width:${s.score || 0}%"></span></div>
                </td>
                <td>${badge(s.band)}</td>
                <td><button class="link" data-action="site" data-id="${esc(s.id)}">Inspect Site →</button></td>
              </tr>`).join('') || `<tr><td colspan="8" class="empty"><div class="empty-icon">🔍</div>No matching sites.</td></tr>`}
          </tbody>
        </table>
      </div>
      ${pager(rows.length)}
    </section>`;
}

// ── Deviations (Issues Found) page ───────────────────────────
function deviations() {
  const rows = filtered(data.findings);
  return head(`<a class="button" href="/api/export.csv?asOf=${asOf}">${icon('download')} Export to Excel (CSV)</a>`) +
    (data.summary.dataGapVisits > 0 ? `<div class="notice warning">
      <strong>⚠️ ${data.summary.dataGapVisits} visits have missing records</strong> — these are tracked separately below.
      Missing records must be verified against the original patient files before the study can be considered complete.
    </div>` : '') +
    toolbar(true) + `
    <section class="card">
      ${findingTable(rows.slice(offset, offset + 20))}
      ${pager(rows.length)}
    </section>
    <details class="card" style="margin-top:14px">
      <summary style="cursor:pointer;padding:4px 0;font-weight:600">
        📋 Visits with Missing Information (${data.dataGaps.length} visits need source verification)
      </summary>
      <p class="subtitle" style="margin:10px 0">
        These visits couldn't be fully evaluated because some patient record fields are missing.
        A human reviewer must check the original paper or electronic source records.
      </p>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Visit ID</th>
            <th>Site</th>
            <th>What Information Is Missing</th>
          </tr></thead>
          <tbody>
            ${data.dataGaps.map(g => `
              <tr>
                <td class="mono">${esc(g.visitId)}</td>
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

// ── CAPA (Action Plans) page ──────────────────────────────────
function capas() {
  const statuses = ['draft', 'in progress', 'effectiveness check', 'closed'];
  const statusLabels = { 'draft': 'Draft', 'in progress': 'In Progress', 'effectiveness check': 'Checking Results', 'closed': 'Completed' };
  return head(`
    <a class="button" href="/api/report?asOf=${asOf}">${icon('download')} Export Full Package</a>
    <button class="primary" data-action="new-capa">+ Create Action Plan</button>
  `) + `
    <div class="cards">
      ${statuses.map(status => `
        <section class="card stat">
          <div class="stat-label">${esc(statusLabels[status] || status)}</div>
          <div class="stat-value">${data.capas.filter(c => c.status === status).length}</div>
          <div class="stat-desc">Action Plans</div>
        </section>`).join('')}
    </div>
    <section class="card">
      <div class="section-head">
        <div>
          <h2>All Action Plans</h2>
          <p class="subtitle">Each Action Plan documents how a confirmed issue will be fixed and prevented from happening again.</p>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Plan ID</th>
            <th>Site &amp; Issue</th>
            <th>Person Responsible</th>
            <th>Due Date</th>
            <th>Status</th>
            <th>Action</th>
          </tr></thead>
          <tbody>
            ${data.capas.map(c => `
              <tr>
                <td class="mono">${esc(c.id)}</td>
                <td>
                  ${esc(c.siteId)}
                  <div class="muted subtle">${esc(c.findingSnapshot.title)}</div>
                </td>
                <td>${esc(c.owner)}</td>
                <td>
                  ${esc(c.dueDate)}
                  ${c.dueDate < asOf && c.status !== 'closed' ? badge('overdue') : ''}
                </td>
                <td>${badge(c.status)}</td>
                <td><button class="link" data-action="edit-capa" data-id="${esc(c.id)}">View Plan →</button></td>
              </tr>`).join('') ||
              `<tr><td colspan="6" class="empty">
                <div class="empty-icon">📝</div>
                No action plans yet. Go to <a href="#deviations">Issues Found</a>, open an issue, and click "Create Action Plan".
              </td></tr>`}
          </tbody>
        </table>
      </div>
    </section>`;
}

// ── Reports page ──────────────────────────────────────────────
function reports() {
  const findings = filtered(data.findings);
  return head() + `
    <div class="report-grid">
      <section class="card">
        ${icon('reports')}
        <h2>Full Review Package</h2>
        <p>A complete file with all issues, action plans, audit history, and evidence — for regulatory inspections or quality review.</p>
        <a class="button primary" href="/api/report?asOf=${asOf}">Download Full Package (JSON)</a>
      </section>
      <section class="card">
        ${icon('download')}
        <h2>Issues Spreadsheet</h2>
        <p>All detected issues in a spreadsheet format. Open in Excel or Google Sheets to filter and share with your team.</p>
        <a class="button" href="/api/export.csv?asOf=${asOf}">Download Issues (CSV/Excel)</a>
      </section>
      <section class="card">
        ${icon('rules')}
        <h2>Print Summary</h2>
        <p>Print this page or save as PDF. Shows all key stats, action plans, and issues in a clean format.</p>
        <button data-action="print">🖨️ Print / Save as PDF</button>
      </section>
    </div>` + stats() + `
    <section class="card">
      <div class="section-head">
        <h2>Study Summary – as of ${asOf}</h2>
      </div>
      <p>
        <strong>${data.summary.findings}</strong> issues found across <strong>${data.summary.sites}</strong> sites.
        <strong>${data.summary.dataGapVisits}</strong> visits are missing information and need source verification.
        <strong>${data.capas.length}</strong> action plans have been created.
      </p>
      ${data.capas.length ? `
        <h3 style="margin-top:20px">Action Plans Summary</h3>
        ${data.capas.map(c => `
          <div class="card" style="margin:10px 0">
            <h3>${esc(c.id)} · ${esc(c.siteId)} · ${badge(c.status)}</h3>
            <p><strong>Issue:</strong> ${esc(c.findingSnapshot.title)} — ${esc(c.findingSnapshot.observed)}</p>
            ${[['owner', 'Responsible Person'], ['dueDate', 'Due Date'], ['rootCause', 'Root Cause'], ['correctiveAction', 'Fix Applied'], ['preventiveAction', 'Prevention Plan'], ['effectiveness', 'How Effectiveness Is Checked'], ['closureEvidence', 'Evidence of Closure']].map(([k, l]) =>
              `<p><strong>${l}:</strong> ${esc(c[k] || 'Not recorded yet')}</p>`).join('')}
          </div>`).join('')}` : ''}
      <h3 style="margin-top:24px;margin-bottom:12px">All Issues Found</h3>
      ${toolbar(true)}
      ${findings.map(f => `
        <div class="card" style="margin:8px 0">
          <h3>${esc(f.id)} · ${esc(f.siteId)} · ${esc(f.title)} ${badge(f.severity)}</h3>
          <p>${esc(f.observed)}. Expected: ${esc(f.expected)}. Source: ${esc(f.reference)}. Review status: ${badge(f.status)}.</p>
          <p class="subtitle">${esc(f.recommendation)}</p>
        </div>`).join('')}
      ${!findings.length ? '<p class="empty">No issues match these filters.</p>' : ''}
    </section>`;
}

// ── Rules page ────────────────────────────────────────────────
function rules() {
  const p = data.protocol;
  const ruleDescriptions = {
    wrong_dose: `Patient must receive exactly ${p.doseMg} mg (no variation allowed)`,
    banned_medication: `Patient must NOT take: ${p.bannedMedications.join(', ')}`,
    missed_visit: `Patient must attend all scheduled visits`,
    visit_window: `Visits must happen within ±${p.visitWindowDays} days of scheduled date`,
    documentation: `All required paperwork must be completed`,
  };
  return head() + `
    <div class="notice">
      Rule violations are automatically flagged. Any changes require a new version number.
    </div>
    <div class="split">
      <section class="card">
        <div class="section-head">
          <div>
            <h2>Current Study Rules</h2>
            <p class="subtitle">Protocol ${esc(p.id)} · Version ${esc(p.version)} · Effective from ${esc(p.effectiveDate)}</p>
          </div>
          <span class="badge mono">v${esc(p.version)}</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr>
              <th>Rule</th>
              <th>What It Means</th>
              <th>How Serious If Violated</th>
            </tr></thead>
            <tbody>
              ${Object.keys(p.severity).map(k => `
                <tr class="rule-row">
                  <td>
                    <strong>${esc(k.replaceAll('_', ' ').replace(/\b\w/g, l => l.toUpperCase()))}</strong>
                    <div class="muted subtle">${esc(p.references[k])}</div>
                  </td>
                  <td>${esc(ruleDescriptions[k] || k)}</td>
                  <td>${badge(p.severity[k])}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
        <div class="recommendation" style="margin-top:16px">
          <strong>How rules work</strong>
          If a patient visit violates any of these rules, it is automatically flagged as an issue.
          A human reviewer must confirm or dismiss each flag. Old rule versions are preserved in the audit history.
        </div>
      </section>
      <section class="card">
        <h2>Update Study Rules</h2>
        <p class="subtitle">Change the rules below and enter a new version number. Your name will be recorded in the audit log.</p>
        <form id="protocol-form" class="centered-box" style="margin-top:16px">
          <div class="form-grid">
            <label>New Version Number<input name="version" required placeholder="e.g. 1.1" value=""></label>
            <label>Effective Date<input type="date" name="effectiveDate" required value=""></label>
            
            <label>Required Dose (mg)<input type="number" name="doseMg" required value="${p.doseMg}"></label>
            <label>Dose Tolerance (mg)<input type="number" name="doseToleranceMg" required value="${p.doseToleranceMg}"></label>
            
            <label>Visit Window (± days)<input type="number" name="visitWindowDays" required value="${p.visitWindowDays}"></label>
            <label>Banned Medications (comma separated)<input name="bannedMedications" required value="${esc(p.bannedMedications.join(', '))}"></label>
            
            <h4 class="full" style="margin-top:10px">Rule Severities</h4>
            ${Object.keys(p.severity).map(k => `
              <label>${esc(k.replaceAll('_', ' ').replace(/\b\w/g, l => l.toUpperCase()))} Severity
                <select name="sev_${k}">
                  ${['administrative','minor','major'].map(s => `<option value="${s}" ${p.severity[k]===s?'selected':''}>${s}</option>`).join('')}
                </select>
              </label>
            `).join('')}
            
          </div>
          <div class="form-actions">
            <button class="primary" type="submit">Save New Rules Version</button>
          </div>
          <div class="inline-error" role="alert"></div>
        </form>
      </section>
    </div>`;
}

// ── Settings page ─────────────────────────────────────────────
function settings() {
  return head() + `
    <div class="split">
      <section class="card">
        <h2>Study Configuration</h2>
        <p class="subtitle">Change the date to view historical data or run the analysis at a past point in time.</p>
        <form id="date-form" class="toolbar" style="margin-top:14px">
          <label>
            📅 View data as of this date
            <input type="date" name="date" value="${asOf}" required style="display:block;margin-top:5px">
          </label>
          <button type="submit">Apply Date</button>
        </form>

        <p class="subtitle" style="margin-top:16px;margin-bottom:8px">Change the date to view historical data or run the analysis at a past point in time.</p>

        <div class="centered-box" style="margin-top:20px;border:1px solid var(--border);border-radius:var(--radius);padding:20px;background:#f8fafc">
          <h3 style="margin-top:0">Replace Study Dataset</h3>
          <p class="subtitle">Upload a new complete patient dataset. The system will validate it before saving. You can download the current data first as a reference.</p>
          <a class="button" style="margin:12px 0 20px;display:inline-flex" href="/api/data" download="arcguard-sample-data.json">
            ${icon('download')} Download Current Data (for reference)
          </a>
          <form id="import-form" class="form-grid">
            <label class="full">
              Select your data file (.json)
              <input name="file" type="file" accept=".json,application/json" required style="display:block;margin-top:6px;background:white">
            </label>
            <label class="full">
              <span style="display:flex;align-items:center;gap:8px;font-weight:400;margin-top:10px">
                <input type="checkbox" required style="width:auto;margin:0">
                I confirm I want to replace the entire current dataset with this file.
              </span>
            </label>
            <div class="full form-actions">
              <button type="submit" class="primary">Validate &amp; Import Data</button>
            </div>
            <div class="inline-error full" role="alert"></div>
          </form>
        </div>

        <h3 style="margin-top:24px">How Risk Scores Are Calculated</h3>
        <p class="subtitle">The risk score for each site is made up of these factors:</p>
        <ul style="font-size:13px;line-height:2;padding-left:18px;color:var(--muted)">
          <li><strong>30%</strong> – Upcoming visits not yet confirmed</li>
          <li><strong>25%</strong> – Number of protocol issues found</li>
          <li><strong>20%</strong> – Overdue unanswered queries</li>
          <li><strong>15%</strong> – Staff without up-to-date training</li>
          <li><strong>10%</strong> – How recently records were updated</li>
        </ul>
        <p class="subtle muted">Thresholds: Critical ≥ 80 · High ≥ 60 · Moderate ≥ 35. Score is an indicator, not a probability.</p>
      </section>

      <section class="card">
        <div class="section-head">
          <h2>📋 Change History (Audit Log)</h2>
          <span class="badge">Last 500 events</span>
        </div>
        <p class="subtitle" style="margin-bottom:12px">Every action taken in the system is recorded here with a timestamp and the name of who did it.</p>
        <div id="audit" class="audit">Loading history…</div>
      </section>
    </div>`;
}

// ── Render ────────────────────────────────────────────────────
function render() {
  if (!auth) { authScreen(); return; }
  page = location.hash.slice(1) || 'overview';
  if (!labels[page]) page = 'overview';
  nav();
  const profile = $('.profile');
  if (profile) {
    profile.innerHTML = `<span><strong>${esc(auth.user.name)}</strong><small>${esc(auth.user.email)}</small></span><span class="avatar" aria-hidden="true">${esc(auth.user.name.split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase())}</span><button class="sign-out" data-action="logout" type="button">Sign out</button>`;
  }
  const pages = { overview, sites, deviations, capa: capas, reports, rules, settings };
  $('#main').innerHTML = pages[page]();
  if (page === 'settings') {
    api('/api/audit').then(events => {
      const el = $('#audit');
      if (el) el.innerHTML = events.length
        ? events.map(e => `
            <div class="audit-item">
              <strong>${esc({ seed_created: '🌱 System initialised', data_replaced: '📥 Data imported', finding_reviewed: '✅ Issue reviewed', capa_saved: '📝 Action plan saved', protocol_updated: '📖 Rules updated' }[e.action] || e.action.replaceAll('_', ' '))}</strong>
              <small>${esc(e.actor)} · ${new Date(e.timestamp).toLocaleString()} · Event #${e.id}</small>
            </div>`).join('')
        : '<p class="muted">No changes recorded yet.</p>';
    }).catch(e => toast(e.message, true));
  }
}

// ── Dialog helpers ────────────────────────────────────────────
function openDialog(html) { const d = $('#dialog'); d.innerHTML = html; d.showModal(); }
function dialogHead(title) {
  return `<div class="section-head">
    <h2 id="dialog-title">${title}</h2>
    <button data-action="close" aria-label="Close dialog">✕</button>
  </div>`;
}

// ── Site detail dialog ────────────────────────────────────────
function siteDialog(id) {
  const s = data.sites.find(s => s.id === id);
  if (!s) return;
  const componentLabels = {
    upcoming:  'Upcoming visits not confirmed',
    queries:   'Overdue unanswered queries',
    training:  'Staff without current training',
    freshness: 'Age of most recent records',
    burden:    'Protocol issues found at site',
  };
  openDialog(dialogHead(`📍 ${esc(s.id)} · ${esc(s.name)}`) + `
    <div class="notice">
      ${badge(s.band)} &nbsp; Risk score: <strong>${s.score ?? '—'} / 100</strong> &nbsp;·&nbsp;
      ${s.evaluatedVisits} visits fully checked · ${s.dataGapVisits} with missing data
    </div>
    <h3>Why is the score this high?</h3>
    <p class="subtitle">Each factor below contributes points to the overall score. The higher the bar, the worse that factor is.</p>
    ${Object.entries(s.components).map(([k, v]) => `
      <div class="component">
        <div class="risk-line">
          <strong>${esc(componentLabels[k] || k)}</strong>
          <span class="mono" style="margin-left:auto">${v.points} / ${v.weight} points</span>
        </div>
        <div class="bar"><span style="width:${v.value * 100}%"></span></div>
      </div>`).join('')}
    <p class="subtle muted" style="margin-top:12px">
      ${s.upcomingCount} upcoming visits · ${s.overdueQueries}/${s.openQueries} queries overdue ·
      ${s.untrainedStaff}/${s.staffCount} staff need training · records ${s.dataAgeDays} days old.
    </p>
    <div class="form-actions">
      <button class="primary" data-action="site-findings" data-id="${esc(id)}">Review Issues at This Site →</button>
    </div>`);
}

// ── Finding (issue) detail dialog ─────────────────────────────
function findingDialog(id) {
  const f = data.findings.find(f => f.id === id);
  if (!f) return;
  const visits = source.visits.filter(v => v.participantId === f.participantId && v.siteId === f.siteId);
  openDialog(dialogHead(`🔍 Issue Review · Patient ${esc(f.participantId)}`) + `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
      ${badge(f.severity)} ${badge(f.status)}
      <span class="mono subtle muted">${esc(f.id)}</span>
    </div>
    <h2 style="margin-bottom:12px">${esc(f.title)}</h2>
    <div class="detail-list">
      <div><small>What was observed</small>${esc(f.observed)}</div>
      <div><small>What was expected (per protocol ${esc(f.reference)})</small>${esc(f.expected)}</div>
      <div><small>Site · Visit</small>${esc(f.siteId)} / ${esc(f.visitId)}</div>
      <div><small>Protocol Version · Date</small>${esc(f.protocolVersion)} / ${esc(f.eventDate)}</div>
    </div>
    <div class="recommendation">
      <strong>💡 Suggested Action</strong>${esc(f.recommendation)}
    </div>
    <h3>Patient Visit Records at This Site</h3>
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>Visit</th><th>Scheduled Date</th><th>Actual Date</th><th>Dose Given (mg)</th><th>Medications</th>
        </tr></thead>
        <tbody>
          ${visits.map(v => `
            <tr>
              <td>${esc(v.id)}</td>
              <td>${esc(v.scheduledDate)}</td>
              <td>${esc(v.actualDate || '⚠️ Not recorded')}</td>
              <td>${v.doseMg ?? '⚠️ Unknown'}</td>
              <td>${esc(v.medications === null ? '⚠️ Unknown' : v.medications.join(', ') || 'None')}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <h3 style="margin-top:18px">Your Review Decision</h3>
    <p class="subtitle">Read the patient's records above, then make a decision about this issue.</p>
    <form id="review-form" data-id="${esc(f.id)}">
      <div class="form-grid">
        <label>
          Decision
          <select name="decision">
            <option value="under review" ${f.status === 'under review' ? 'selected' : ''}>👀 Needs Review</option>
            <option value="confirmed" ${f.status === 'confirmed' ? 'selected' : ''}>✅ Confirmed</option>
            <option value="dismissed" ${f.status === 'dismissed' ? 'selected' : ''}>❌ Rejected / Dismissed</option>
          </select>
        </label>
        <label class="full">
          Reason / notes (describe what you checked in the source records)
          <textarea name="reason" maxlength="4000" required placeholder="e.g. Checked original visit log. Patient did attend on the scheduled date but pharmacist recorded wrong dose.">${esc(f.review?.reason || '')}</textarea>
        </label>
      </div>
      <div class="inline-error" role="alert"></div>
      <div class="form-actions">
        <button type="button" data-action="capa-finding" data-id="${esc(f.id)}">Create Action Plan</button>
        <button class="primary" type="submit">Save Review Decision</button>
      </div>
    </form>`);
}

// ── CAPA dialog ───────────────────────────────────────────────
function capaDialog(findingId, capa) {
  const f = data.findings.find(f => f.id === findingId);
  if (!f) { toast('This issue no longer exists in the current analysis. Please refresh and try again.', true); return; }
  $('#dialog').close();
  const fieldConfig = [
    ['rootCause',          'Root Cause (What went wrong and why?)',              'e.g. Site staff were unaware of the updated dosing procedure from the latest protocol amendment.'],
    ['correctiveAction',   'Corrective Action (Immediate fix)',                   f.recommendation],
    ['preventiveAction',   'Preventive Action (How to stop this happening again)', 'e.g. All site staff to complete updated training module within 2 weeks.'],
    ['effectiveness',      'How Will We Check the Fix Worked?',                   'e.g. Review next 5 patient records after training to confirm correct dose recorded.'],
    ['closureEvidence',    'Closure Evidence (required only to mark as Closed)',   ''],
  ];
  openDialog(dialogHead(capa ? `✏️ Edit Action Plan · ${esc(capa.id)}` : '➕ Create New Action Plan') + `
    <div class="notice">
      <strong>Issue:</strong> ${esc(f.siteId)} · ${esc(f.title)} · ${esc(f.observed)}
    </div>
    <form id="capa-form" data-finding="${esc(f.id)}" data-id="${esc(capa?.id || '')}">
      <div class="form-grid">
        <label>
          Person Responsible (Owner)
          <input name="owner" value="${esc(capa?.owner || '')}" required maxlength="100" placeholder="Full name of person responsible">
        </label>
        <label>
          Completion Due Date
          <input name="dueDate" type="date" value="${esc(capa?.dueDate || '')}" required>
        </label>
        <label>
          Current Status
          <select name="status">
            <option value="draft" ${(!capa || capa.status === 'draft') ? 'selected' : ''}>📝 Draft – just started</option>
            <option value="in progress" ${capa?.status === 'in progress' ? 'selected' : ''}>🔧 In Progress – being worked on</option>
            <option value="effectiveness check" ${capa?.status === 'effectiveness check' ? 'selected' : ''}>🔍 Checking if fix worked</option>
            <option value="closed" ${capa?.status === 'closed' ? 'selected' : ''}>✅ Closed – issue resolved</option>
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
        <button class="primary" type="submit">Save Action Plan</button>
      </div>
    </form>`);
}

// ── Event Handlers ────────────────────────────────────────────
document.addEventListener('click', async e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const id = el.dataset.id;
  try {
    switch (el.dataset.action) {
      case 'dismiss-welcome':
        welcomeDismissed = true;
        const wb = $('#welcome-banner');
        if (wb) wb.remove();
        break;
      case 'refresh':
        el.disabled = true;
        await load();
        toast('Data refreshed successfully.');
        break;
      case 'logout':
        await api('/api/auth/logout', {});
        auth = null; data = null; source = null;
        render();
        toast('You have been signed out.');
        break;
      case 'close':         $('#dialog').close(); break;
      case 'site':          siteDialog(id); break;
      case 'site-link':
        e.preventDefault();
        filter = { q: '', severity: 'all', site: id }; offset = 0;
        location.hash = 'sites'; render(); break;
      case 'finding':       findingDialog(id); break;
      case 'capa-finding':  capaDialog(id); break;
      case 'edit-capa': {
        const c = data.capas.find(c => c.id === id);
        capaDialog(c.findingId, c); break;
      }
      case 'new-capa':
        if (!data.findings.length) { toast('No issues available. Issues are needed before creating an action plan.'); break; }
        openDialog(dialogHead('Choose an Issue for this Action Plan') + `
          <p class="subtitle" style="margin-bottom:12px">Select the confirmed issue this action plan is addressing:</p>
          <label style="font-size:13px;font-weight:500">
            Issue
            <select id="capa-select" class="wide" style="display:block;margin-top:6px;width:100%">
              ${data.findings.map(f => `<option value="${esc(f.id)}">${esc(f.siteId)} · ${esc(f.participantId)} · ${esc(f.title)}</option>`).join('')}
            </select>
          </label>
          <div class="form-actions">
            <button class="primary" data-action="choose-capa">Continue →</button>
          </div>`);
        break;
      case 'choose-capa':   capaDialog($('#capa-select').value); break;
      case 'site-findings':
        $('#dialog').close();
        filter = { q: '', severity: 'all', site: id }; offset = 0;
        location.hash = 'deviations'; render(); break;
      case 'clear':
        filter = { q: '', severity: 'all', site: 'all' }; offset = 0; render(); break;
      case 'prev': offset = Math.max(0, offset - 20); render(); break;
      case 'next': offset += 20; render(); break;
      case 'print': window.print(); break;
    }
  } catch (error) {
    toast(error.message, true);
  } finally {
    el.disabled = false;
  }
});

// ── Search / filter inputs ────────────────────────────────────
document.addEventListener('input', e => {
  if (e.target.id === 'search') {
    const pos = e.target.selectionStart;
    filter.q = e.target.value; offset = 0; render();
    $('#search')?.focus();
    $('#search')?.setSelectionRange(pos, pos);
  }
});
document.addEventListener('change', e => {
  if (e.target.id === 'site-filter' || e.target.id === 'severity-filter') {
    filter[e.target.id === 'site-filter' ? 'site' : 'severity'] = e.target.value;
    offset = 0; render();
  }
});

// ── Form submissions ──────────────────────────────────────────
document.addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  const values = Object.fromEntries(new FormData(form));
  const button = $('button[type="submit"]', form);
  const error = $('.inline-error', form);
  if (error) error.textContent = '';
  if (button) button.disabled = true;
  try {
    if (form.id === 'login-form') {
      auth = await api('/api/auth/login', { email: values.email, password: values.password });
      await load();
      toast('Signed in successfully.');
    } else if (form.id === 'review-form') {
      await api('/api/reviews', { ...values, findingId: form.dataset.id });
      $('#dialog').close(); await load();
      toast('Review decision saved successfully.');
    } else if (form.id === 'capa-form') {
      await api('/api/capas', { ...values, findingId: form.dataset.finding, ...(form.dataset.id ? { id: form.dataset.id } : {}) });
      $('#dialog').close(); location.hash = 'capa'; await load();
      toast('Action plan saved successfully.');
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
      await load(); toast('New study rules version saved.');
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

// ── Routing ───────────────────────────────────────────────────
window.addEventListener('hashchange', () => { offset = 0; render(); });

// ── Skip link ─────────────────────────────────────────────────
$('.skip').addEventListener('click', event => { event.preventDefault(); $('#main').focus(); });

// ── Initial load ──────────────────────────────────────────────
load().catch(e => {
  $('#main').innerHTML = `
    <section class="card" style="text-align:center;padding:40px">
      <div style="font-size:40px;margin-bottom:16px">⚠️</div>
      <h1>Unable to Load Data</h1>
      <p style="color:var(--muted);margin:12px 0 20px">${esc(e.message)}</p>
      <p class="subtitle">Make sure the backend server is running, then try again.</p>
      <button data-action="refresh" class="primary" style="margin-top:8px">Try Again</button>
    </section>`;
});

// ── Auto-refresh (read-only pages only) ───────────────────────
setInterval(() => {
  if (!data || document.hidden || $('#dialog').open ||
      !['overview', 'sites', 'deviations', 'capa'].includes(page) ||
      ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
  load().catch(err => toast('Auto-refresh failed: ' + err.message, true));
}, 30000);
