'use strict';

const phone = '27839937622';
const whatsapp = message => `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
document.getElementById('year').textContent = new Date().getFullYear();
document.querySelectorAll('svg.icon').forEach(icon => {
  icon.setAttribute('aria-hidden', 'true');
  icon.setAttribute('focusable', 'false');
});

function createArrowIcon() {
  const namespace = 'http://www.w3.org/2000/svg';
  const icon = document.createElementNS(namespace, 'svg');
  const path = document.createElementNS(namespace, 'path');
  const attributes = { class: 'arrow-icon', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', focusable: 'false' };
  Object.entries(attributes).forEach(([name, value]) => icon.setAttribute(name, value));
  path.setAttribute('d', 'M5 19 19 5M5 5h14v14');
  icon.appendChild(path);
  return icon;
}

// Mobile navigation uses native links and keeps focus on its trigger when dismissed.
const menu = document.querySelector('.menu-toggle');
const navigation = document.getElementById('navigation');
function setMenu(open, restoreFocus = false) {
  navigation.classList.toggle('open', open);
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  if (restoreFocus) menu.focus();
}
menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('click', event => {
  if (!event.target.closest('.site-header')) setMenu(false);
});
matchMedia('(min-width: 851px)').addEventListener('change', event => {
  if (event.matches) setMenu(false);
});

// Masked word reveals follow native scrolling in both directions.
const textAnimations = [];
const introAnimations = [];
let introPlayed = false;
let frame = 0;
let textObserver;
let revealObserver;
const clamp = value => Math.max(0, Math.min(1, value));

function prepareScrollText() {
  document.querySelectorAll('[data-scroll-text]').forEach(heading => {
    if (heading.dataset.textPrepared) return;
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const fragment = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          fragment.appendChild(document.createTextNode(part));
          return;
        }
        const word = document.createElement('span');
        const inner = document.createElement('span');
        word.className = 'scroll-word';
        inner.className = 'scroll-word-inner';
        inner.textContent = part;
        word.appendChild(inner);
        fragment.appendChild(word);
      });
      node.replaceWith(fragment);
    });
    heading.dataset.textPrepared = 'true';
    heading.classList.add('scroll-text');
    textAnimations.push({
      heading,
      words: [...heading.querySelectorAll('.scroll-word-inner')],
      intro: heading.dataset.scrollText === 'intro',
      active: true
    });
  });
}

function revealIntro() {
  if (introPlayed) return;
  introPlayed = true;
  textAnimations.filter(item => item.intro).forEach(item => {
    // An anchor link or restored scroll position should not trigger an unseen intro.
    const bounds = item.heading.getBoundingClientRect();
    if (bounds.bottom <= 0 || bounds.top >= window.innerHeight) return;
    item.words.forEach((word, index) => {
      if (!word.animate) return;
      introAnimations.push(word.animate([
        { transform: 'translate3d(0, 110%, 0)', opacity: 0 },
        { transform: 'translate3d(0, 0, 0)', opacity: 1 }
      ], {
        duration: 1000,
        delay: 120 + index * 130,
        easing: 'cubic-bezier(.16, 1, .3, 1)',
        fill: 'backwards'
      }));
    });
  });
}

function renderScrollText() {
  frame = 0;
  const height = window.innerHeight;
  const positions = textAnimations.filter(item => item.active && !item.intro).map(item => ({
    item, top: item.heading.getBoundingClientRect().top
  }));
  positions.forEach(({ item, top }) => {
    // Spread the reveal over half the viewport, so a short scroll no longer
    // completes the entire heading before the visitor notices the effect.
    const progress = clamp((height * .95 - top) / (height * .48));
    item.words.forEach((word, index) => {
      const stagger = item.words.length > 1 ? index / (item.words.length - 1) * .4 : 0;
      const eased = 1 - Math.pow(1 - clamp((progress - stagger) / .6), 2);
      word.style.transform = `translate3d(0, ${(1 - eased) * 110}%, 0)`;
      word.style.opacity = String(eased);
    });
  });
}

function requestTextFrame() {
  if (!reducedMotion.matches && !frame) frame = requestAnimationFrame(renderScrollText);
}

function configureMotion() {
  textObserver?.disconnect();
  revealObserver?.disconnect();
  if (reducedMotion.matches) {
    cancelAnimationFrame(frame);
    frame = 0;
    document.documentElement.classList.remove('js-motion');
    introAnimations.forEach(animation => animation.cancel());
    introAnimations.length = 0;
    textAnimations.forEach(item => item.words.forEach(word => {
      word.style.removeProperty('transform');
      word.style.removeProperty('opacity');
    }));
    return;
  }
  prepareScrollText();
  revealIntro();
  textAnimations.forEach(item => { item.active = true; });
  if ('IntersectionObserver' in window) {
    document.documentElement.classList.add('js-motion');
    revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    }), { threshold: .06 });
    document.querySelectorAll('.reveal:not(.visible)').forEach(item => revealObserver.observe(item));
    textObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const item = textAnimations.find(animation => animation.heading === entry.target);
        if (item) item.active = entry.isIntersecting;
      });
      requestTextFrame();
    }, { rootMargin: '120px 0px' });
    textAnimations.forEach(item => textObserver.observe(item.heading));
  }
  requestTextFrame();
}
window.addEventListener('scroll', requestTextFrame, { passive: true });
window.addEventListener('resize', requestTextFrame, { passive: true });
reducedMotion.addEventListener('change', configureMotion);
configureMotion();
if (document.fonts) document.fonts.ready.then(requestTextFrame);

// An enquiry is handed to WhatsApp for the visitor to review and send.
document.querySelectorAll('[data-service]').forEach(link => link.addEventListener('click', () => {
  document.getElementById('service').value = link.dataset.service;
}));
const enquiryForm = document.getElementById('enquiry-form');
const requiredFields = [...enquiryForm.querySelectorAll('[required]')];
requiredFields.forEach(field => field.addEventListener('input', () => field.setCustomValidity('')));
enquiryForm.addEventListener('submit', event => {
  event.preventDefault();
  requiredFields.forEach(field => field.setCustomValidity(field.value.trim() ? '' : 'Please complete this field.'));
  if (!enquiryForm.reportValidity()) return;
  const data = new FormData(enquiryForm);
  const message = `Hi William, my name is ${data.get('name').trim()}.\nSuburb: ${data.get('suburb').trim()}\nService: ${data.get('service')}\n\n${data.get('message').trim()}`;
  const url = whatsapp(message);
  window.open(url, '_blank', 'noopener,noreferrer');
  const feedback = document.getElementById('form-feedback');
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = 'Open your enquiry here.';
  feedback.replaceChildren(document.createTextNode('WhatsApp didn’t open? '), link);
  feedback.hidden = false;
});

// This demo assistant has bounded service replies; it cannot confirm bookings.
const panel = document.getElementById('assistant-panel');
const toggle = document.getElementById('assistant-toggle');
const chatInput = document.getElementById('chat-input');
const messages = document.getElementById('chat-messages');
function setChat(open) {
  panel.hidden = !open;
  toggle.setAttribute('aria-expanded', String(open));
  if (open) chatInput.focus({ preventScroll: true });
  else toggle.focus({ preventScroll: true });
}
toggle.addEventListener('click', () => setChat(panel.hidden));
document.getElementById('close-chat').addEventListener('click', () => setChat(false));
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (!panel.hidden) setChat(false);
  else if (navigation.classList.contains('open')) setMenu(false, true);
});
function addMessage(text, type) {
  const bubble = document.createElement('p');
  bubble.className = `${type}-message`;
  bubble.textContent = text;
  messages.appendChild(bubble);
  messages.scrollTop = messages.scrollHeight;
  return bubble;
}
function reply(question) {
  addMessage(question, 'user');
  const q = question.toLowerCase();
  let answer;
  if (/danger|spark|shock|smoke|fire|burning/.test(q)) answer = 'Keep clear of the affected area. If there is immediate danger, contact emergency services. Call William on 083 993 7622 for an urgent service enquiry. This assistant cannot diagnose hazards.';
  else if (/hour|open|night|24/.test(q)) answer = 'The business is listed as open 24 hours. Call 083 993 7622 to confirm current availability and arrange assistance.';
  else if (/price|cost|quote|rate|charge/.test(q)) answer = 'Send William a description of the job, your suburb and any useful photos on WhatsApp. He can confirm whether a visit is needed before quoting. Prices and call-out fees must be confirmed directly.';
  else if (/where|address|area|location|randburg/.test(q)) answer = 'William Electrical & Plumbing is based at 27 Trident St, Claremont, Randburg, 2092. Share your suburb to confirm availability in your area.';
  else if (/book|appointment|urgent|emergency/.test(q)) answer = 'Call 083 993 7622 for urgent availability, or send your preferred time and job details on WhatsApp. William will confirm the visit directly with you.';
  else if (/plumb|leak|tap|geyser|drain|toilet|pipe|water/.test(q)) answer = 'Describe the plumbing issue, tell us your suburb and include any useful photos. William can discuss the service you need, availability and the next step on WhatsApp.';
  else if (/electr|power|light|switch|plug|trip/.test(q)) answer = 'Tell William what has stopped working, when it started and where you are based. Leave electrical repairs to a qualified professional and contact William to discuss your job.';
  else if (/\bai\b|human|bot|real person/.test(q)) answer = 'I’m an automated demo assistant for common service questions. To speak to a person, contact William on WhatsApp or call 083 993 7622.';
  else answer = 'I can help with electrical or plumbing enquiries, opening hours, the address and requesting a quote. For questions about your particular job, contact William directly.';
  const bubble = addMessage(answer, 'bot');
  const link = document.createElement('a');
  link.href = whatsapp(`Hi William, I have an enquiry: ${question}`);
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = 'Message William on WhatsApp ';
  link.appendChild(createArrowIcon());
  bubble.appendChild(document.createElement('br'));
  bubble.appendChild(link);
  messages.scrollTop = messages.scrollHeight;
}
document.getElementById('chat-form').addEventListener('submit', event => {
  event.preventDefault();
  const question = chatInput.value.trim();
  if (!question) return;
  reply(question);
  chatInput.value = '';
  chatInput.focus({ preventScroll: true });
});
document.querySelectorAll('[data-question]').forEach(button => button.addEventListener('click', () => reply(button.dataset.question)));
