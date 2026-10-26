const phone = '27839937622';
const whatsapp = (message) => `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
document.getElementById('year').textContent = new Date().getFullYear();
const menu = document.querySelector('.menu-toggle');
const navigation = document.getElementById('navigation');
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  navigation.classList.toggle('open', open);
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  navigation.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Open navigation');
}));
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.classList.add('js-motion');
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
  }), { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// Keep native scrolling; animate only text, with no scroll interception.
const textMotionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const textHeadings = [...document.querySelectorAll('main h1, main h2')];
const textAnimations = [];
let textFrame = 0;
let textObserver;
const clampProgress = value => Math.max(0, Math.min(1, value));

function prepareScrollText() {
  textHeadings.forEach(heading => {
    if (heading.dataset.textPrepared) return;
    // Split text nodes only, preserving emphasis, explicit line breaks and spaces.
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const fragment = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) { fragment.appendChild(document.createTextNode(part)); return; }
        const word = document.createElement('span');
        word.className = 'scroll-word';
        const inner = document.createElement('span');
        inner.className = 'scroll-word-inner';
        inner.textContent = part;
        word.appendChild(inner); fragment.appendChild(word);
      });
      node.replaceWith(fragment);
    });
    heading.dataset.textPrepared = 'true';
    heading.classList.add('scroll-text');
    const words = [...heading.querySelectorAll('.scroll-word-inner')];
    textAnimations.push({ heading, words, active: true, hero: heading.matches('h1') });
  });
}

function renderScrollText() {
  textFrame = 0;
  const height = window.innerHeight;
  // Read positions before writing styles to avoid interleaved layout work.
  const positions = textAnimations.filter(item => item.active).map(item => ({
    item, top: item.heading.getBoundingClientRect().top
  }));
  positions.forEach(({ item, top }) => {
    const progress = item.hero ? 1 : clampProgress((height * 0.94 - top) / (height * 0.38));
    item.words.forEach((word, index) => {
      const stagger = item.words.length > 1 ? index / (item.words.length - 1) * 0.36 : 0;
      const amount = clampProgress((progress - stagger) / 0.64);
      const eased = 1 - Math.pow(1 - amount, 3);
      word.style.transform = `translate3d(0, ${(1 - eased) * 65}%, 0)`;
      word.style.opacity = String(0.18 + eased * 0.82);
    });
  });
}

function requestTextFrame() {
  if (!textMotionPreference.matches && !textFrame) textFrame = requestAnimationFrame(renderScrollText);
}

function configureScrollText() {
  if (textMotionPreference.matches) {
    cancelAnimationFrame(textFrame); textFrame = 0;
    textObserver?.disconnect();
    textAnimations.forEach(item => item.words.forEach(word => {
      word.style.removeProperty('transform'); word.style.removeProperty('opacity');
    }));
    return;
  }
  prepareScrollText();
  textAnimations.forEach(item => { item.active = true; });
  if ('IntersectionObserver' in window) {
    textObserver?.disconnect();
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
textMotionPreference.addEventListener('change', configureScrollText);
configureScrollText();
if (document.fonts) document.fonts.ready.then(requestTextFrame);
document.querySelectorAll('[data-service]').forEach(link => link.addEventListener('click', () => {
  document.getElementById('service').value = link.dataset.service;
}));
document.getElementById('enquiry-form').addEventListener('submit', event => {
  event.preventDefault();
  const name = document.getElementById('name').value.trim();
  const message = document.getElementById('message').value.trim();
  if (!name || !message) { event.currentTarget.reportValidity(); return; }
  window.open(whatsapp(`Hi William, my name is ${name}.\nService: ${document.getElementById('service').value}\n\n${message}`), '_blank', 'noopener,noreferrer');
});
const panel = document.getElementById('assistant-panel');
const toggle = document.getElementById('assistant-toggle');
const chatInput = document.getElementById('chat-input');
const messages = document.getElementById('chat-messages');
function setChat(open) {
  panel.hidden = !open; toggle.setAttribute('aria-expanded', String(open));
  if (open) chatInput.focus(); else toggle.focus();
}
toggle.addEventListener('click', () => setChat(panel.hidden));
document.getElementById('close-chat').addEventListener('click', () => setChat(false));
document.addEventListener('keydown', event => { if (event.key === 'Escape') { if (!panel.hidden) setChat(false); navigation.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); } });
function addMessage(text, type) {
  const bubble = document.createElement('p'); bubble.className = `${type}-message`; bubble.textContent = text;
  messages.appendChild(bubble); messages.scrollTop = messages.scrollHeight; return bubble;
}
function reply(question) {
  addMessage(question, 'user');
  const q = question.toLowerCase();
  let answer;
  if (/danger|sparking|shock|smoke|fire|burning/.test(q)) answer = 'Please keep clear of the affected area. If there is immediate danger, contact emergency services. Call William on 083 993 7622 for an urgent service enquiry. I cannot diagnose electrical hazards.';
  else if (/hour|open|time|night|24/.test(q)) answer = 'The business listing shows open 24 hours. Call 083 993 7622 to confirm current availability and arrange assistance.';
  else if (/price|cost|quote|rate|charge/.test(q)) answer = 'Pricing depends on the job. Send William a description, your location and any photos on WhatsApp to request a quote. I cannot confirm prices or call-out fees.';
  else if (/where|address|area|location|randburg/.test(q)) answer = 'William Electrical & Plumbing is based at 27 Trident St, Claremont, Randburg, 2092. Share your location with William to confirm whether your area is covered.';
  else if (/plumb|leak|tap|geyser|drain|toilet|pipe|water/.test(q)) answer = 'For a plumbing enquiry, describe the issue, where you are based and any visible leaks or blockages. You can send photos to William on WhatsApp to discuss the next step and availability.';
  else if (/electr|power|light|switch|plug|trip/.test(q)) answer = 'For an electrical enquiry, tell William what has stopped working, when it started and where you are based. Please leave electrical repairs to a qualified professional. Contact William to confirm the right service for your job.';
  else if (/book|appointment|urgent|emergency/.test(q)) answer = 'Call William on 083 993 7622 for urgent availability, or send your preferred time and job details on WhatsApp. A booking is only confirmed directly by William.';
  else if (/ai|human|bot/.test(q)) answer = 'I’m a demo assistant with automated answers to common questions. To talk to a person, contact William directly on WhatsApp or call 083 993 7622.';
  else answer = 'I can help with electrical or plumbing enquiries, opening hours, the address and how to request a quote. For advice specific to your job, please contact William directly.';
  const bubble = addMessage(answer, 'bot');
  const link = document.createElement('a'); link.href = whatsapp(`Hi William, I have an enquiry: ${question}`); link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = 'Message William on WhatsApp ↗';
  bubble.appendChild(document.createElement('br')); bubble.appendChild(link); messages.scrollTop = messages.scrollHeight;
}
document.getElementById('chat-form').addEventListener('submit', event => { event.preventDefault(); const text = chatInput.value.trim(); if (text) { reply(text); chatInput.value = ''; chatInput.focus(); } });
document.querySelectorAll('[data-question]').forEach(button => button.addEventListener('click', () => reply(button.dataset.question)));
