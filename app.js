const goBtn = document.getElementById('goBtn');
const results = document.getElementById('results');
const lineStrip = document.getElementById('lineStrip');
const swapBtn = document.getElementById('swapBtn');
const fromField = document.getElementById('fromField');
const toField = document.getElementById('toField');
const fromFieldValue = document.getElementById('fromFieldValue');
const toFieldValue = document.getElementById('toFieldValue');
const pickerModal = document.getElementById('pickerModal');
const pickerSearchInput = document.getElementById('pickerSearchInput');
const pickerModalResults = document.getElementById('pickerModalResults');
const pickerModalClose = document.getElementById('pickerModalClose');

// Selected station ids (ALL_STATIONS .id, shared across line entries for
// transfer stations). Defaults match the app's original Nana -> Siam demo.
let selectedFrom = 'nana';
let selectedTo = 'siam';
let activeField = null; // 'from' | 'to' while the modal is open

function findStationById(id) {
  // ALL_STATIONS has one entry per line for transfer stations; any of them
  // carries the right name/code for display purposes.
  return ALL_STATIONS.find(s => s.id === id);
}

function updateFieldDisplays() {
  const fromStation = findStationById(selectedFrom);
  const toStation = findStationById(selectedTo);
  fromFieldValue.textContent = fromStation ? `${fromStation.code} · ${fromStation.name}` : 'Select station';
  fromFieldValue.className = `picker-field-value ${fromStation ? '' : 'placeholder'}`;
  toFieldValue.textContent = toStation ? `${toStation.code} · ${toStation.name}` : 'Select station';
  toFieldValue.className = `picker-field-value ${toStation ? '' : 'placeholder'}`;
}

function renderLineStrip() {
  // The line strip still only reflects the real Sukhumvit routing engine.
  // If either pick falls outside it (Silom/Gold), show the full line with
  // nothing highlighted rather than breaking — routing across lines isn't
  // built yet, this is just the picker's data layer landing first.
  const fromIdx = LINE_ORDER.indexOf(selectedFrom);
  const toIdx = LINE_ORDER.indexOf(selectedTo);
  const bothOnSukhumvit = fromIdx > -1 && toIdx > -1;
  const lo = bothOnSukhumvit ? Math.min(fromIdx, toIdx) : -1;
  const hi = bothOnSukhumvit ? Math.max(fromIdx, toIdx) : -1;

  lineStrip.innerHTML = LINE_ORDER.map((key, idx) => {
    const s = STATIONS[key];
    const isInterchange = !!s.interchange;
    const isSelected = key === selectedFrom || key === selectedTo;
    const onRoute = lo > -1 && idx >= lo && idx <= hi;
    const trackInRange = lo > -1 && idx > lo && idx <= hi;

    return `
      <div class="strip-stop ${isInterchange ? 'interchange' : ''} ${isSelected ? 'selected' : ''} ${onRoute ? 'on-route' : ''}">
        <div class="strip-track ${trackInRange ? 'in-range' : ''}"></div>
        <div class="strip-dot"></div>
        <div class="strip-code">${s.code}</div>
        <div class="strip-name">${s.name}</div>
      </div>
    `;
  }).join('');
}

function renderEmpty() {
  results.innerHTML = `
    <div class="empty-state">
      <div class="display">Where are you headed?</div>
      <div>Choose your start and destination above.</div>
    </div>
  `;
}

// ===== Searchable station picker modal =====

function openPickerModal(field) {
  activeField = field;
  pickerSearchInput.value = '';
  pickerModal.classList.remove('hidden');
  renderPickerResults('');
  // Focus after the modal is visible so mobile keyboards behave.
  setTimeout(() => pickerSearchInput.focus(), 50);
}

function closePickerModal() {
  pickerModal.classList.add('hidden');
  activeField = null;
}

function matchesQuery(station, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    station.name.toLowerCase().includes(q) ||
    station.code.toLowerCase().includes(q) ||
    station.line.toLowerCase().includes(q) ||
    (station.nameTh && station.nameTh.toLowerCase().includes(q))
  );
}

function lineCssClass(line) {
  if (line === 'Silom Line') return 'line-silom';
  if (line === 'Gold Line') return 'line-gold';
  return 'line-sukhumvit';
}

function renderPickerResults(query) {
  const filtered = ALL_STATIONS.filter(s => matchesQuery(s, query));

  if (filtered.length === 0) {
    pickerModalResults.innerHTML = `<div class="picker-no-results">No stations match "${query}"</div>`;
    return;
  }

  let html = '';
  LINE_ORDER_DISPLAY.forEach(lineName => {
    const lineStations = filtered.filter(s => s.line === lineName);
    if (!lineStations.length) return;

    html += `<div class="picker-group-label">${lineName}</div>`;
    lineStations.forEach(s => {
      html += `
        <div class="picker-station-row" data-id="${s.id}">
          <span class="picker-code-badge ${lineCssClass(s.line)}">${s.code}</span>
          <span class="picker-station-name">${s.name}</span>
          <div class="picker-line-badges">
            <span class="picker-line-badge">${s.line}</span>
            ${s.transfer ? `<span class="picker-transfer-badge">⇄ ${s.transfer}</span>` : ''}
          </div>
        </div>
      `;
    });
  });

  pickerModalResults.innerHTML = html;

  pickerModalResults.querySelectorAll('.picker-station-row').forEach(row => {
    row.addEventListener('click', () => {
      selectStation(row.dataset.id);
    });
  });
}

function selectStation(id) {
  if (activeField === 'from') {
    selectedFrom = id;
  } else if (activeField === 'to') {
    selectedTo = id;
  }
  closePickerModal();
  updateFieldDisplays();
  renderLineStrip();
  results.innerHTML = '';
  renderEmpty();
}

// ===== Journey mode: converts a route into a sequence of full-screen cards,
// one action at a time, navigable with Next/Previous — like turn-by-turn guidance.

const journeyScreen = document.getElementById('journeyScreen');
const journeyCard = document.getElementById('journeyCard');
const journeyTripLabel = document.getElementById('journeyTripLabel');
const journeyProgressLabel = document.getElementById('journeyProgressLabel');
const progressRail = document.getElementById('progressRail');
const journeyEndBtn = document.getElementById('journeyEndBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const rideSubstepper = document.getElementById('rideSubstepper');
const ridePrevBtn = document.getElementById('ridePrevBtn');
const rideNextBtn = document.getElementById('rideNextBtn');
const rideArriveBtn = document.getElementById('rideArriveBtn');

let journeyCards = [];
let journeyIndex = 0;

// Sub-stepper state for the active "On the train" card — tracks progress
// through that ride's real stations, independent of the outer card sequence.
let rideStationIndex = 0;
let rideArrived = false;

function renderRideCard(card) {
  const stations = card.rideStations;
  const destIdx = stations.length - 1;
  const stopsRemaining = destIdx - rideStationIndex;
  const currentName = stations[rideStationIndex];
  const nextName = stations[rideStationIndex + 1] || null;
  const destName = stations[destIdx];

  // Arrival state takes over the whole card once we reach the destination.
  if (rideArrived) {
    const exitsCard = journeyCards.find(c => c.kind === 'exits');
    const firstExit = exitsCard && exitsCard.exits && exitsCard.exits[0];
    return `
      <div class="jc-icon">🛑</div>
      <div class="jc-title" style="color:var(--green);">GET OFF NOW</div>
      <div class="ride-arrival-row">
        <div class="ride-arrival-chip">Doors open: left</div>
        <div class="ride-arrival-chip">${firstExit ? 'Use Exit ' + firstExit.id : 'Check exits'}</div>
      </div>
      <div class="jc-detail" style="margin-top:14px;">You've arrived at <strong style="color:var(--text);">${destName}</strong>. Tap Next to continue.</div>
    `;
  }

  const compact = stations.length <= 6; // "5 stops or fewer" = 6 stations inclusive

  let stationListHtml = '';
  if (compact) {
    stationListHtml = `
      <div class="ride-station-row">
        ${stations.map((name, idx) => {
          const cls = idx < rideStationIndex ? 'passed' : (idx === rideStationIndex ? 'current' : '');
          return `
            <div class="ride-stop ${cls}">
              <div class="ride-stop-dot"></div>
              <div class="ride-stop-name">${name}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else {
    const upcoming = stations.slice(rideStationIndex + 1, rideStationIndex + 4);
    const pct = Math.round((rideStationIndex / destIdx) * 100);
    stationListHtml = `
      <div class="ride-progress-track"><div class="ride-progress-fill" style="width:${pct}%"></div></div>
      <div class="ride-endpoints-row">
        <span>${stations[0]}</span>
        <span>${destName}</span>
      </div>
      ${upcoming.length ? `
        <div class="ride-upcoming-label">Coming up</div>
        <div class="ride-upcoming-list">
          ${upcoming.map(name => `<div class="ride-upcoming-item">${name}</div>`).join('')}
        </div>
      ` : ''}
    `;
  }

  const nearArrival = stopsRemaining === 1;

  return `
    <div class="ride-direction">${card.rideDirection}</div>
    <div class="jc-icon">🚊</div>
    <div class="jc-title">${currentName}</div>
    <div class="ride-next-row">
      <div class="ride-next-label">Next</div>
      <div class="ride-next-name">${nextName || '— end of line —'}</div>
    </div>
    <div class="ride-stops-remaining">${stopsRemaining} stop${stopsRemaining !== 1 ? 's' : ''} to ${destName}</div>
    ${stationListHtml}
    ${nearArrival ? `
      <div class="ride-warning">⚠️ Next stop: ${destName}. Get ready.</div>
    ` : ''}
  `;
}

function stepKindIcon(kind) {
  if (kind === 'start') return '📍';
  if (kind === 'ride') return '🚊';
  if (kind === 'transfer') return '⚠️';
  if (kind === 'arrive') return '🏁';
  if (kind === 'exits') return '🚪';
  if (kind === 'warn') return '⚠️';
  return '●';
}

function stepKindLabel(kind) {
  if (kind === 'start') return 'Start';
  if (kind === 'ride') return 'On the train';
  if (kind === 'transfer') return 'Watch for this';
  if (kind === 'arrive') return 'Arrival';
  if (kind === 'exits') return 'Exits here';
  if (kind === 'warn') return 'Heads up';
  return '';
}

// Build the flat sequence of cards for a route: base steps from getRoute(),
// plus synthesized cards for exits, MRT/other-line transfers, and interchange
// logic — each gets its own screen instead of being stacked on one page.
function buildJourneyCards(fk, tk) {
  const route = getRoute(fk, tk);
  if (!route) return null;
  const { from, to, steps } = route;

  const cards = [];
  const fromIdx = LINE_ORDER.indexOf(fk);
  const toIdx = LINE_ORDER.indexOf(tk);
  const goingNorth = toIdx < fromIdx;

  steps.forEach(step => {
    if (step.type === 'ride') {
      // Pull the real station slice for this specific ride segment so the
      // sub-stepper always reflects the actual line, not invented stations.
      const lo = Math.min(fromIdx, toIdx);
      const hi = Math.max(fromIdx, toIdx);
      let slice = LINE_ORDER.slice(lo, hi + 1).map(k => STATIONS[k].name);
      if (goingNorth) slice = slice.reverse();

      cards.push({
        kind: 'ride',
        title: step.title,
        detail: step.detail,
        rideStations: slice,
        rideDirection: goingNorth ? 'Toward ' + STATIONS[LINE_ORDER[0]].name : 'Toward ' + to.name
      });
    } else {
      cards.push({
        kind: step.type,
        title: step.title,
        detail: step.detail
      });
    }
  });

  if (to.exits && to.exits.length) {
    cards.push({
      kind: 'exits',
      title: `Exits at ${to.name}`,
      exits: to.exits,
      exitToUse: to.exits[0]
    });
  }

  if (to.transfer) {
    cards.push({
      kind: 'warn',
      title: `Connecting to ${to.transfer.to}?`,
      detail: to.transfer.notes
    });
  }

  if (from.interchange) {
    cards.push({ kind: 'interchange', title: `${from.name} interchange`, interchange: from.interchange });
  }
  if (to.interchange && fk !== 'siam') {
    cards.push({ kind: 'interchange', title: `${to.name} interchange`, interchange: to.interchange });
  }

  return { from, to, cards };
}

function renderJourneyCard() {
  const card = journeyCards[journeyIndex];
  if (!card) return;

  let html = `<div class="jc-kind kind-${card.kind}">${stepKindLabel(card.kind)}</div>`;

  if (card.kind === 'ride') {
    html += renderRideCard(card);
  } else if (card.kind === 'exits') {
    html += `
      <div class="jc-icon">${stepKindIcon(card.kind)}</div>
      <div class="jc-title">${card.title}</div>
      <div class="jc-detail">
        ${card.exits.map(ex => `
          <div class="jc-exit-row">
            <span class="jc-exit-num">${ex.id}</span>
            <span class="jc-exit-desc">${ex.desc}</span>
          </div>
        `).join('')}
      </div>
    `;
  } else if (card.kind === 'interchange') {
    const ic = card.interchange;
    html += `
      <div class="jc-icon">🔀</div>
      <div class="jc-title">${card.title}</div>
      <div class="jc-detail">${ic.headline}</div>
      <div class="jc-levels">
        ${ic.levels.map((lvl, i) => `
          <div class="jc-level-row ${i === 0 ? 'upper' : 'lower'}">
            <div class="jc-level-top">
              <span class="jc-level-tag">${lvl.tag}</span>
              <span class="jc-level-dir">${lvl.direction}</span>
            </div>
            <p>${lvl.lines}</p>
          </div>
        `).join('')}
      </div>
      <div class="jc-detail" style="margin-top:14px;">${ic.watch}</div>
    `;
  } else {
    html += `
      <div class="jc-icon">${stepKindIcon(card.kind)}</div>
      <div class="jc-title">${card.title}</div>
      <div class="jc-detail">${card.detail}</div>
    `;
  }

  journeyCard.className = `journey-card jc-card ${card.kind === 'warn' ? 'warn-card' : ''}`;
  journeyCard.innerHTML = html;

  renderProgressRail();

  prevBtn.disabled = journeyIndex === 0;
  const isLast = journeyIndex === journeyCards.length - 1;
  nextBtn.textContent = isLast ? 'Done ✓' : 'Next →';
  nextBtn.className = `nav-btn next ${isLast ? 'finish' : ''}`;

  // Sub-stepper only shows for the ride card, and only while not yet arrived
  // (once arrived, the main Next button is the way to continue the journey).
  if (card.kind === 'ride' && !rideArrived) {
    rideSubstepper.classList.remove('hidden');
    ridePrevBtn.disabled = rideStationIndex === 0;
    rideNextBtn.disabled = false;
  } else {
    rideSubstepper.classList.add('hidden');
  }
}

function renderProgressRail() {
  progressRail.innerHTML = journeyCards.map((_, idx) => {
    const cls = idx < journeyIndex ? 'done' : (idx === journeyIndex ? 'current' : '');
    return `<div class="progress-dot ${cls}"></div>`;
  }).join('');
  journeyProgressLabel.textContent = `Step ${journeyIndex + 1} of ${journeyCards.length}`;
}

function startJourney(fk, tk) {
  if (fk === tk) return;
  const built = buildJourneyCards(fk, tk);
  if (!built) return;

  journeyCards = built.cards;
  journeyIndex = 0;
  journeyTripLabel.textContent = `${built.from.code} → ${built.to.code}`;
  journeyScreen.classList.remove('hidden');
  resetRideStateIfNeeded();
  renderJourneyCard();
}

function resetRideStateIfNeeded() {
  const card = journeyCards[journeyIndex];
  if (card && card.kind === 'ride') {
    rideStationIndex = 0;
    rideArrived = false;
  }
}

function endJourney() {
  journeyScreen.classList.add('hidden');
}

prevBtn.addEventListener('click', () => {
  if (journeyIndex > 0) {
    journeyIndex -= 1;
    resetRideStateIfNeeded();
    renderJourneyCard();
  }
});

nextBtn.addEventListener('click', () => {
  if (journeyIndex < journeyCards.length - 1) {
    journeyIndex += 1;
    resetRideStateIfNeeded();
    renderJourneyCard();
  } else {
    endJourney();
  }
});

journeyEndBtn.addEventListener('click', endJourney);

ridePrevBtn.addEventListener('click', () => {
  if (rideStationIndex > 0) {
    rideStationIndex -= 1;
    renderJourneyCard();
  }
});

rideNextBtn.addEventListener('click', () => {
  const card = journeyCards[journeyIndex];
  if (!card || card.kind !== 'ride') return;
  const destIdx = card.rideStations.length - 1;
  if (rideStationIndex < destIdx) {
    rideStationIndex += 1;
    if (rideStationIndex === destIdx) rideArrived = true;
    renderJourneyCard();
  }
});

rideArriveBtn.addEventListener('click', () => {
  const card = journeyCards[journeyIndex];
  if (!card || card.kind !== 'ride') return;
  rideStationIndex = card.rideStations.length - 1;
  rideArrived = true;
  renderJourneyCard();
});

updateFieldDisplays();
renderLineStrip();
renderEmpty();

goBtn.addEventListener('click', () => {
  if (LINE_ORDER.indexOf(selectedFrom) === -1 || LINE_ORDER.indexOf(selectedTo) === -1) {
    results.innerHTML = `
      <div class="empty-state">
        <div class="display">Cross-line routing coming soon</div>
        <div>Guidance currently only works within the Sukhumvit Line. Silom and Gold Line routing is on the way.</div>
      </div>
    `;
    return;
  }
  startJourney(selectedFrom, selectedTo);
});

fromField.addEventListener('click', () => openPickerModal('from'));
toField.addEventListener('click', () => openPickerModal('to'));
pickerModalClose.addEventListener('click', closePickerModal);

pickerSearchInput.addEventListener('input', () => {
  renderPickerResults(pickerSearchInput.value);
});

swapBtn.addEventListener('click', () => {
  const temp = selectedFrom;
  selectedFrom = selectedTo;
  selectedTo = temp;
  updateFieldDisplays();
  renderLineStrip();
  results.innerHTML = '';
  renderEmpty();
});
