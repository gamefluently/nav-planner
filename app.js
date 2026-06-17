const goBtn = document.getElementById('goBtn');
const results = document.getElementById('results');
const lineStrip = document.getElementById('lineStrip');
const pickerReadout = document.getElementById('pickerReadout');

// Selection state: null, or a station key. Tap flow:
// nothing selected -> tap sets FROM
// FROM selected -> tap a different station sets TO
// both selected -> tap any station restarts selection from that station
let fromKey = null;
let toKey = null;

function renderReadout() {
  function stopHtml(key, placeholder) {
    if (!key) return `<div class="readout-placeholder">${placeholder}</div>`;
    const s = STATIONS[key];
    return `
      <div class="readout-stop">
        <span class="readout-code" style="color:${s.interchange ? 'var(--gold)' : 'var(--green)'}">${s.code}</span>
        <span class="readout-name">${s.name}</span>
      </div>
    `;
  }
  pickerReadout.innerHTML = `
    ${stopHtml(fromKey, 'Start station')}
    <span class="readout-arrow">→</span>
    ${stopHtml(toKey, 'Destination')}
  `;
}

function renderLineStrip() {
  const fromIdx = fromKey ? LINE_ORDER.indexOf(fromKey) : -1;
  const toIdx = toKey ? LINE_ORDER.indexOf(toKey) : -1;
  const lo = fromIdx > -1 && toIdx > -1 ? Math.min(fromIdx, toIdx) : -1;
  const hi = fromIdx > -1 && toIdx > -1 ? Math.max(fromIdx, toIdx) : -1;

  lineStrip.innerHTML = LINE_ORDER.map((key, idx) => {
    const s = STATIONS[key];
    const isInterchange = !!s.interchange;
    const isSelected = key === fromKey || key === toKey;
    const onRoute = lo > -1 && idx >= lo && idx <= hi;
    const trackInRange = lo > -1 && idx > lo && idx <= hi;

    return `
      <div class="strip-stop ${isInterchange ? 'interchange' : ''} ${isSelected ? 'selected' : ''} ${onRoute ? 'on-route' : ''}" data-key="${key}">
        <div class="strip-track ${trackInRange ? 'in-range' : ''}"></div>
        <div class="strip-dot"></div>
        <div class="strip-code">${s.code}</div>
        <div class="strip-name">${s.name}</div>
      </div>
    `;
  }).join('');

  lineStrip.querySelectorAll('.strip-stop').forEach(el => {
    el.addEventListener('click', () => handleStopTap(el.dataset.key));
  });
}

function handleStopTap(key) {
  if (!fromKey || (fromKey && toKey)) {
    // Nothing selected, or both already selected -> start fresh
    fromKey = key;
    toKey = null;
  } else if (key === fromKey) {
    // Tapped the same station again -> deselect
    fromKey = null;
  } else {
    toKey = key;
  }
  renderReadout();
  renderLineStrip();
  updateGoButton();
  results.innerHTML = '';
  if (!fromKey && !toKey) renderEmpty();
}

function updateGoButton() {
  goBtn.disabled = !(fromKey && toKey);
}

function renderEmpty() {
  results.innerHTML = `
    <div class="empty-state">
      <div class="display">Where are you headed?</div>
      <div>Tap your start and destination on the line above.</div>
    </div>
  `;
}

function stepIcon(type) {
  if (type === 'start') return '●';
  if (type === 'ride') return '→';
  if (type === 'transfer') return '⚠';
  if (type === 'arrive') return '◉';
  return '○';
}

function renderInterchangeDiagram(station) {
  if (!station.interchange) return '';
  const ic = station.interchange;
  return `
    <div class="interchange-card">
      <div class="label">${station.name} interchange</div>
      <div class="ic-headline">${ic.headline}</div>
      <div class="levels">
        ${ic.levels.map((lvl, i) => `
          <div class="level-row ${i === 0 ? 'upper' : 'lower'}">
            <div class="level-top">
              <span class="level-tag">${lvl.tag}</span>
              <span class="level-dir">${lvl.direction}</span>
            </div>
            <p>${lvl.lines}</p>
          </div>
        `).join('')}
      </div>
      <div class="key-rule">${ic.watch}</div>
    </div>
  `;
}

function renderRoute(fk, tk) {
  if (fk === tk) {
    results.innerHTML = `
      <div class="empty-state">
        <div class="display">Same station selected</div>
        <div>Pick two different stations to get help.</div>
      </div>
    `;
    return;
  }

  const route = getRoute(fk, tk);
  if (!route) { renderEmpty(); return; }

  const { from, to, steps } = route;
  let html = '';

  // Lead with the single most important thing to know right now.
  const transferStep = steps.find(s => s.type === 'transfer');
  const firstAction = steps[0];
  html += `
    <div class="next-up">
      <div class="next-up-label">Right now</div>
      <div class="next-up-title">${firstAction.title}</div>
      <div class="next-up-detail">${firstAction.detail}</div>
    </div>
  `;

  // Warning banner, only if there's a transfer/interchange to worry about.
  if (transferStep) {
    html += `
      <div class="warn-banner">
        <span class="warn-icon">⚠</span>
        <div>
          <div class="warn-title">${transferStep.title}</div>
          <div class="warn-detail">${transferStep.detail}</div>
        </div>
      </div>
    `;
  }

  // Quiet step list — riding steps are de-emphasized, only arrival/transfer stand out.
  html += `<div class="journey-line">`;
  steps.forEach(step => {
    if (step.type === 'ride') {
      html += `
        <div class="step quiet">
          <div class="step-detail">${step.detail}</div>
        </div>
      `;
    } else {
      const cls = step.type === 'transfer' ? 'transfer' : (step.type === 'arrive' ? 'arrive' : '');
      html += `
        <div class="step ${cls}">
          <div class="step-title">${step.title}</div>
          <div class="step-detail">${step.detail}</div>
        </div>
      `;
    }
  });
  html += `</div>`;

  // Exits at destination — the local knowledge a first-timer actually needs.
  if (to.exits && to.exits.length) {
    html += `
      <div class="exits-card">
        <div class="exits-label">Exits at ${to.name}</div>
        ${to.exits.map(ex => `
          <div class="exit-row">
            <span class="exit-num">${ex.id}</span>
            <span class="exit-desc">${ex.desc}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Other-line transfer note (MRT, etc.) — easy to get caught out by separate ticketing.
  if (to.transfer) {
    html += `
      <div class="warn-banner">
        <span class="warn-icon">⚠</span>
        <div>
          <div class="warn-title">Connecting to ${to.transfer.to}?</div>
          <div class="warn-detail">${to.transfer.notes}</div>
        </div>
      </div>
    `;
  }

  if (from.interchange) html += renderInterchangeDiagram(from);
  if (to.interchange && fk !== 'siam') html += renderInterchangeDiagram(to);

  results.innerHTML = html;
}

renderReadout();
renderLineStrip();
renderEmpty();
updateGoButton();

goBtn.addEventListener('click', () => {
  if (fromKey && toKey) renderRoute(fromKey, toKey);
});
