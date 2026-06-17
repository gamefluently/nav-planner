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

let journeyCards = [];
let journeyIndex = 0;

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

  steps.forEach(step => {
    cards.push({
      kind: step.type,
      title: step.title,
      detail: step.detail
    });
  });

  if (to.exits && to.exits.length) {
    cards.push({
      kind: 'exits',
      title: `Exits at ${to.name}`,
      exits: to.exits
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

  if (card.kind === 'exits') {
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
  renderJourneyCard();
}

function endJourney() {
  journeyScreen.classList.add('hidden');
}

prevBtn.addEventListener('click', () => {
  if (journeyIndex > 0) {
    journeyIndex -= 1;
    renderJourneyCard();
  }
});

nextBtn.addEventListener('click', () => {
  if (journeyIndex < journeyCards.length - 1) {
    journeyIndex += 1;
    renderJourneyCard();
  } else {
    endJourney();
  }
});

journeyEndBtn.addEventListener('click', endJourney);

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
