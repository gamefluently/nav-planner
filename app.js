const goBtn = document.getElementById('goBtn');
const results = document.getElementById('results');
const lineStrip = document.getElementById('lineStrip');
const fromSelect = document.getElementById('fromSelect');
const toSelect = document.getElementById('toSelect');
const swapBtn = document.getElementById('swapBtn');

function populateSelects() {
  LINE_ORDER.forEach(key => {
    const station = STATIONS[key];
    const label = `${station.code} · ${station.name}`;

    const opt1 = document.createElement('option');
    opt1.value = key;
    opt1.textContent = label;
    fromSelect.appendChild(opt1);

    const opt2 = document.createElement('option');
    opt2.value = key;
    opt2.textContent = label;
    toSelect.appendChild(opt2);
  });
  fromSelect.value = 'nana';
  toSelect.value = 'siam';
}

function renderLineStrip() {
  const fromKey = fromSelect.value;
  const toKey = toSelect.value;
  const fromIdx = LINE_ORDER.indexOf(fromKey);
  const toIdx = LINE_ORDER.indexOf(toKey);
  const lo = Math.min(fromIdx, toIdx);
  const hi = Math.max(fromIdx, toIdx);

  lineStrip.innerHTML = LINE_ORDER.map((key, idx) => {
    const s = STATIONS[key];
    const isInterchange = !!s.interchange;
    const isSelected = key === fromKey || key === toKey;
    const onRoute = idx >= lo && idx <= hi;
    const trackInRange = idx > lo && idx <= hi;

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
    const card2 = journeyCards[journeyIndex];
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
    <div class="jc-icon">🚊</div>
    <div class="ride-direction">${card.rideDirection}</div>
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

populateSelects();
renderLineStrip();
renderEmpty();

goBtn.addEventListener('click', () => {
  startJourney(fromSelect.value, toSelect.value);
});

fromSelect.addEventListener('change', () => {
  renderLineStrip();
  results.innerHTML = '';
  renderEmpty();
});

toSelect.addEventListener('change', () => {
  renderLineStrip();
  results.innerHTML = '';
  renderEmpty();
});

swapBtn.addEventListener('click', () => {
  const temp = fromSelect.value;
  fromSelect.value = toSelect.value;
  toSelect.value = temp;
  renderLineStrip();
  results.innerHTML = '';
  renderEmpty();
});
