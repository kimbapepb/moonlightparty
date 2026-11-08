const openButton = document.querySelector('#openmail');
const closeButton = document.querySelector('#closemail');
const mailList = document.querySelector('#mail-list');
const message = document.querySelector('#message');
const readKey = 'epb-gangbuk-read';

function markRead() {
  openButton.classList.add('is-read');
  document.querySelector('#count').textContent = '0';
  document.querySelector('#summary').textContent = '3 messages - 0 unread';
}

function renderMail(focus) {
  const opened = location.hash === '#gangbuk';
  mailList.hidden = opened;
  message.hidden = !opened;
  openButton.setAttribute('aria-expanded', String(opened));
  if (opened) {
    markRead();
    sessionStorage.setItem(readKey, '1');
    if (focus) document.querySelector('#mail-subject').focus();
  } else if (focus) {
    openButton.focus();
  }
}

openButton.addEventListener('click', () => { location.hash = 'gangbuk'; });
closeButton.addEventListener('click', () => {
  history.replaceState(null, '', location.pathname + location.search);
  renderMail(true);
});
window.addEventListener('hashchange', () => renderMail(true));
if (sessionStorage.getItem(readKey)) markRead();
renderMail(false);
