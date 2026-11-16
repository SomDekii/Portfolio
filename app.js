const menuButton = document.querySelector('.menu-toggle');
const navigation = document.getElementById('main-navigation');
function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('is-open');
}
menuButton.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(expanded));
  navigation.classList.toggle('is-open', expanded);
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navigation.classList.contains('is-open')) {
    closeMenu();
    menuButton.focus();
  }
});
matchMedia('(min-width: 851px)').addEventListener('change', closeMenu);

let lastTrigger;
document.querySelectorAll('[data-case]').forEach(button => button.addEventListener('click', () => {
  const dialog = document.getElementById('case-' + button.dataset.case);
  lastTrigger = button;
  dialog.showModal();
  dialog.scrollTop = 0;
  document.body.classList.add('modal-open');
}));
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelectorAll('.close').forEach(button => button.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    lastTrigger?.focus();
  });
});

if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('reveal');
      observer.unobserve(entry.target);
    }
  }), { threshold: 0.08 });
  document.querySelectorAll('.skill-card, .project-item').forEach(element => observer.observe(element));
}

// Use section positions so Home/About do not depend on observer callback order.
const sectionLinks = [...navigation.querySelectorAll('a[href^="#"]')];
const linkedSections = sectionLinks.map(link => ({
  link,
  section: document.getElementById(link.hash.slice(1))
})).filter(item => item.section);
const header = document.querySelector('.site-header');
let navigationTarget = null;
let scrollFrame = null;
let settleTimer = null;

function headerOffset() {
  return Math.ceil(header.getBoundingClientRect().height) + 20;
}
function setCurrentSection(id) {
  sectionLinks.forEach(link => {
    if (link.hash === '#' + id) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
function updateCurrentSection() {
  scrollFrame = null;
  if (navigationTarget) {
    setCurrentSection(navigationTarget.id);
    return;
  }
  let current = linkedSections[0];
  const activationLine = headerOffset() + 2;
  linkedSections.forEach(item => {
    if (item.section.getBoundingClientRect().top <= activationLine) current = item;
  });
  if (current) setCurrentSection(current.section.id);
}
function queueSectionUpdate() {
  if (scrollFrame === null) scrollFrame = requestAnimationFrame(updateCurrentSection);
}
function finishNavigation() {
  clearTimeout(settleTimer);
  navigationTarget = null;
  queueSectionUpdate();
}
function handlePageScroll() {
  queueSectionUpdate();
  if (navigationTarget) {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(finishNavigation, 160);
  }
}
// Lock the clicked highlight during smooth scrolling through other sections.
document.querySelectorAll('a[href^="#"]').forEach(link => {
  const target = document.getElementById(link.hash.slice(1));
  if (!target || !linkedSections.some(item => item.section === target)) return;
  link.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    closeMenu();
    navigationTarget = target;
    setCurrentSection(target.id);
    const top = target.id === 'home' ? 0 : Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerOffset());
    if (window.location.hash !== link.hash) history.pushState(null, '', link.hash);
    clearTimeout(settleTimer);
    settleTimer = setTimeout(finishNavigation, 160);
    window.scrollTo({ top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  });
});
window.addEventListener('scroll', handlePageScroll, { passive: true });
window.addEventListener('scrollend', finishNavigation);
window.addEventListener('resize', queueSectionUpdate);
window.addEventListener('hashchange', finishNavigation);
window.addEventListener('popstate', finishNavigation);
window.addEventListener('wheel', finishNavigation, { passive: true });
window.addEventListener('touchstart', finishNavigation, { passive: true });
window.addEventListener('keydown', event => {
  if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) finishNavigation();
});
function updateHeaderOffset() {
  document.documentElement.style.setProperty('--navigation-offset', headerOffset() + 'px');
  queueSectionUpdate();
}
if ('ResizeObserver' in window) new ResizeObserver(updateHeaderOffset).observe(header);
window.addEventListener('resize', updateHeaderOffset);
window.addEventListener('load', updateHeaderOffset);
updateHeaderOffset();

const contactForm = document.getElementById('contact-form');
contactForm.addEventListener('submit', event => {
  event.preventDefault();
  const recipient = contactForm.dataset.email;
  if (!recipient) {
    document.getElementById('contact-form-status').textContent = 'Contact email to be added. This form is not connected yet.';
    return;
  }
  if (!contactForm.reportValidity()) return;
  const data = new FormData(contactForm);
  const subject = String(data.get('subject')).trim();
  const body = String(data.get('message')).trim() + '\n\nFrom: ' + String(data.get('name')).trim() + '\nEmail: ' + String(data.get('email')).trim();
  document.getElementById('contact-form-status').textContent = 'Your email app will open a draft. Review it and send it there.';
  window.location.href = 'mailto:' + encodeURIComponent(recipient) + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
});
