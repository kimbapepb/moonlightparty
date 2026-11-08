const accessPrefix = 'epb-gangbuk-access-';
const notesKey = 'epb-gangbuk-notes';
const room = document.querySelector('[data-room-page]')?.dataset.roomPage;
const noteList = document.querySelector('#notes-list');
let notes = JSON.parse(localStorage.getItem(notesKey) || '[]');

function unlocked(slug) {
  return sessionStorage.getItem(accessPrefix + slug) === '1';
}

function renderNotes() {
  document.querySelector('#note-count').textContent = notes.length;
  noteList.replaceChildren();

  if (!notes.length) {
    const empty = document.createElement('p');
    empty.className = 'note-empty';
    empty.textContent = 'No highlights saved yet.';
    noteList.append(empty);
    return;
  }

  for (const note of notes) {
    const card = document.createElement('article');
    card.className = 'note-card';
    const excerpt = document.createElement('p');
    excerpt.textContent = note.text;
    const attribution = document.createElement('small');
    attribution.textContent = note.title;
    const source = document.createElement('a');
    source.className = 'back';
    source.href = note.room === room ? '#' + note.record : note.room + '.html#' + note.record;
    source.textContent = 'Open source';
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'back';
    remove.textContent = 'Remove note';
    remove.addEventListener('click', () => {
      notes = notes.filter(item => item !== note);
      saveNotes();
      noteList.querySelector('a')?.focus();
    });
    card.append(excerpt, attribution, source, remove);
    noteList.append(card);
  }
}

function saveNotes() {
  localStorage.setItem(notesKey, JSON.stringify(notes));
  renderNotes();
}

function updateBoard() {
  for (const card of document.querySelectorAll('[data-room]')) {
    const open = unlocked(card.dataset.room);
    card.querySelector('.room-status').textContent = open ? 'Unlocked' : 'Locked';
  }
}

function setupRoom() {
  const form = document.querySelector('#access-form');
  const input = document.querySelector('#code');
  const status = document.querySelector('#access-status');
  const dialog = document.querySelector('#record');
  const body = document.querySelector('#record-body');
  const noteStatus = document.querySelector('#note-status');
  let currentRecord;
  let opener;

  function renderHighlights() {
    const content = body.querySelector('.record-content');
    const segments = content.querySelectorAll('p, dd, td, .record-lines li, .timeline li, .chat-record li > span');

    for (const [index, segment] of Array.from(segments).entries()) {
      if (segment.querySelector('a, button') || !segment.textContent.trim()) continue;
      const text = segment.innerText.trim();
      const record = currentRecord;
      const matches = note => note.room === room && note.record === record &&
        (note.segment === index ? note.text === text : note.segment == null && note.text === text);
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'highlight-passage';
      toggle.append(...segment.childNodes);
      segment.append(toggle);
      toggle.setAttribute('aria-pressed', String(notes.some(matches)));
      toggle.addEventListener('click', () => {
        const wasHighlighted = notes.some(matches);
        if (wasHighlighted) {
          notes = notes.filter(note => !matches(note));
        } else {
          notes.push({ room, record, segment: index, text, title: body.querySelector('h2').textContent });
        }
        toggle.setAttribute('aria-pressed', String(!wasHighlighted));
        saveNotes();
        noteStatus.textContent = wasHighlighted ? 'Highlight removed.' : 'Highlight saved to Investigation Notes.';
      });
    }
  }

  function showRecord() {
    if (!unlocked(room)) return;

    const record = location.hash.slice(1);
    const template = document.getElementById(record);
    if (!(template instanceof HTMLTemplateElement)) {
      if (dialog.open) dialog.close();
      return;
    }

    if (!dialog.open) opener = document.activeElement;
    currentRecord = record;
    noteStatus.textContent = '';
    body.replaceChildren(template.content.cloneNode(true));
    const heading = body.querySelector('h2');
    heading.id = 'record-title';
    heading.tabIndex = -1;
    if (!dialog.open) dialog.showModal();
    renderHighlights();
    dialog.scrollTop = 0;
    heading.focus();
  }

  function showRoom(focus) {
    document.querySelector('#access').hidden = true;
    document.querySelector('#room').hidden = false;
    if (focus) document.querySelector('#room-title').focus();
    showRecord();
  }

  function changeCode(value) {
    input.value = value.replace(/[^0-9]/g, '').slice(0, 8);
    status.textContent = '';
  }

  for (const key of form.querySelectorAll('[data-digit]')) {
    key.addEventListener('click', () => changeCode(input.value + key.dataset.digit));
  }
  document.querySelector('#erase').addEventListener('click', () => changeCode(input.value.slice(0, -1)));
  input.addEventListener('input', () => changeCode(input.value));
  input.addEventListener('invalid', () => { status.textContent = 'Enter eight digits.'; });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (input.value !== form.dataset.code) {
      status.textContent = 'Incorrect code. Try again.';
      input.select();
      return;
    }
    sessionStorage.setItem(accessPrefix + room, '1');
    input.value = '';
    showRoom(true);
  });

  window.addEventListener('hashchange', showRecord);
  dialog.addEventListener('close', () => {
    if (location.hash === '#' + currentRecord) {
      history.replaceState(null, '', location.pathname + location.search);
    }
    if (opener && opener !== document.body) opener.focus();
    else document.querySelector('#room-title').focus();
  });

  if (unlocked(room)) showRoom(false);
}

function refreshNotes() {
  notes = JSON.parse(localStorage.getItem(notesKey) || '[]');
  renderNotes();
}

window.addEventListener('pageshow', () => {
  refreshNotes();
  if (!room) updateBoard();
});
window.addEventListener('storage', event => {
  if (event.key === notesKey) refreshNotes();
});
renderNotes();
if (room) setupRoom();
else updateBoard();
