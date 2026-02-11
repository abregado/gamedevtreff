const CALENDAR_ID = '7nl41p01vtd41env5ga49r2p3o@group.calendar.google.com';
const API_KEY = 'AIzaSyAx6fZAbVhJFzw9U8la5AJtf8OjlCnrKgA';
const KEYWORDS = ['Bochum', 'Frankfurt'];

async function fetchEvents() {
  const now = new Date().toISOString();
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?key=${API_KEY}&timeMin=${now}&orderBy=startTime&singleEvents=true&maxResults=50`;

  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) {
    const msg = data?.error?.message || response.statusText;
    throw new Error(`${response.status}: ${msg}`);
  }
  return data.items || [];
}

function findNextEventWithKeyword(events, keyword) {
  const lowerKeyword = keyword.toLowerCase();
  return events.find(event => {
    const title = (event.summary || '').toLowerCase();
    const description = (event.description || '').toLowerCase();
    const location = (event.location || '').toLowerCase();
    return title.includes(lowerKeyword) || description.includes(lowerKeyword) || location.includes(lowerKeyword);
  });
}

function formatDate(event) {
  const start = event.start.dateTime || event.start.date;
  const date = new Date(start);

  const dateStr = date.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  if (event.start.dateTime) {
    const timeStr = date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return { date: dateStr, time: timeStr + ' Uhr' };
  }

  return { date: dateStr, time: 'Ganztägig' };
}

function renderCard(containerId, keyword, event) {
  const container = document.getElementById(containerId);

  if (!event) {
    container.innerHTML = `
      <span class="card-keyword">${keyword}</span>
      <div class="card-error">Kein bevorstehendes Event gefunden.</div>
    `;
    return;
  }

  const { date, time } = formatDate(event);
  const location = event.location || 'Kein Ort angegeben';
  const description = event.description || 'Keine Beschreibung verfügbar.';

  container.innerHTML = `
    <span class="card-keyword">${keyword}</span>
    <div class="card-title">${escapeHtml(event.summary)}</div>
    <div class="card-meta">
      <div class="card-meta-row"><span class="icon">&#128197;</span> ${escapeHtml(date)}</div>
      <div class="card-meta-row"><span class="icon">&#128336;</span> ${escapeHtml(time)}</div>
      <div class="card-meta-row"><span class="icon">&#128205;</span> ${escapeHtml(location)}</div>
    </div>
    <div class="card-description">${escapeHtml(description)}</div>
    <div class="card-expand-hint">Klicken f&uuml;r Details</div>
  `;

  container.addEventListener('click', () => {
    container.classList.toggle('expanded');
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function init() {
  const containers = KEYWORDS.map((kw, i) => ({
    keyword: kw,
    id: `card-${kw.toLowerCase()}`,
  }));

  // Show loading state
  containers.forEach(({ keyword, id }) => {
    document.getElementById(id).innerHTML = `
      <span class="card-keyword">${keyword}</span>
      <div class="card-loading">Laden…</div>
    `;
  });

  try {
    const events = await fetchEvents();
    containers.forEach(({ keyword, id }) => {
      const event = findNextEventWithKeyword(events, keyword);
      renderCard(id, keyword, event);
    });
  } catch (err) {
    console.error('Failed to fetch calendar events:', err);
    containers.forEach(({ keyword, id }) => {
      document.getElementById(id).innerHTML = `
        <span class="card-keyword">${keyword}</span>
        <div class="card-error">Fehler beim Laden der Events.<br><small>${escapeHtml(err.message)}</small></div>
      `;
    });
  }
}

init();
