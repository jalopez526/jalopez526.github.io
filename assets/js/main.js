(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Rotating "Lately: ..." line in the hero
  const rotator = document.querySelector('[data-rotator]');
  if (rotator && !reduceMotion) {
    // The first line comes from the HTML, so the two never drift apart
    const roles = [
      rotator.textContent.trim(),
      'live AI virtual try-on.',
      'custom GPTs on company data.',
      'streaming LLM interfaces.',
      'AI-assisted dev workflows with MCP.'
    ];
    let i = 0;
    let onScreen = true;
    // Only rotate while the hero is visible and the tab is in the foreground
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; }).observe(rotator);
    }
    setInterval(() => {
      if (!onScreen || document.hidden) return;
      rotator.classList.add('is-swapping');
      setTimeout(() => {
        i = (i + 1) % roles.length;
        rotator.textContent = roles[i];
        rotator.classList.remove('is-swapping');
      }, 250);
    }, 2600);
  }

  // Hero glow follows the pointer (one style update per frame, using the latest position)
  const hero = document.querySelector('[data-spotlight]');
  if (hero && !reduceMotion) {
    let frame = 0;
    let x = 0;
    let y = 0;
    hero.addEventListener('pointermove', (e) => {
      x = e.clientX;
      y = e.clientY;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        const r = hero.getBoundingClientRect();
        hero.style.setProperty('--mx', `${((x - r.left) / r.width) * 100}%`);
        hero.style.setProperty('--my', `${((y - r.top) / r.height) * 100}%`);
        frame = 0;
      });
    });
  }

  // Demo chat: pre-written answers, streamed word by word like an LLM response
  const chat = document.querySelector('[data-chat]');
  if (chat) {
    const log = chat.querySelector('[data-chat-log]');
    const announce = chat.querySelector('[data-chat-announce]');
    const promptBox = chat.querySelector('[data-chat-prompts]');
    const prompts = [...promptBox.querySelectorAll('[data-q]')];
    const answers = {
      built: 'Production AI features, mostly in ecommerce. At Swap Commerce he built the live AI virtual try-on — photo capture, age verification and image-generation jobs streamed to the browser — plus the shopping flows around a conversational AI assistant. Before that: a custom GPT on OpenAI and Anthropic models at Truelogic, an OpenAI chatbot at MileIQ, and a TensorFlow kiosk that read handwritten medical documents.',
      stream: 'With Server-Sent Events and WebSockets. On Swap Commerce\'s React 19 server-rendered storefront, AI jobs and assistant updates are pushed to the browser as they happen, so people see progress instead of a spinner. This little box works the same way — just with pre-written answers.',
      tools: 'Every day. He works with Claude Code and Cursor, and connects them through MCP to Linear and GitHub so the assistant has real ticket and repo context.',
      stack: 'Not at all — he has 8+ years of full-stack work. React / Next.js and TypeScript up front; NestJS, Express and FastAPI behind it; PostgreSQL and Redis for data; Docker, Kubernetes and Helm on GCP and AWS. That foundation is what gets AI features into production.'
    };
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const scrollDown = () => { log.scrollTop = log.scrollHeight; };
    const addMsg = (cls, text) => {
      const el = document.createElement('div');
      el.className = `msg ${cls}`;
      el.textContent = text;
      log.appendChild(el);
      scrollDown();
      return el;
    };
    let busy = false;

    promptBox.hidden = false; // prompts only make sense with JS running

    promptBox.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-q]');
      if (!btn || busy) return;
      busy = true;
      prompts.forEach((p) => { p.disabled = true; });
      btn.classList.add('is-asked');

      addMsg('msg-user', btn.textContent);
      const answer = answers[btn.dataset.q];

      if (reduceMotion) {
        addMsg('msg-bot', answer);
      } else {
        const typing = document.createElement('div');
        typing.className = 'msg msg-bot typing';
        typing.setAttribute('aria-hidden', 'true');
        typing.innerHTML = '<span></span><span></span><span></span>';
        log.appendChild(typing);
        scrollDown();
        await wait(700);
        typing.remove();

        const bubble = addMsg('msg-bot is-streaming', '');
        const tokens = answer.match(/\S+\s*/g) || [];
        for (const token of tokens) {
          bubble.textContent += token;
          scrollDown();
          await wait(28 + Math.random() * 40);
        }
        bubble.classList.remove('is-streaming');
      }

      announce.textContent = answer; // screen readers get the full answer once
      prompts.forEach((p) => { p.disabled = false; });
      busy = false;
    });
  }

  // Stack tabs (with arrow-key navigation)
  const tablist = document.querySelector('[data-tabs]');
  if (tablist) {
    const tabs = [...tablist.querySelectorAll('[role="tab"]')];
    const select = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) tab.focus();
    };
    tabs.forEach((tab, idx) => {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', (e) => {
        const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
        if (e.key in keys) {
          e.preventDefault();
          select(tabs[(idx + keys[e.key] + tabs.length) % tabs.length], true);
        } else if (e.key === 'Home' || e.key === 'End') {
          e.preventDefault();
          select(tabs[e.key === 'Home' ? 0 : tabs.length - 1], true);
        }
      });
    });
    // All panels are visible in the HTML (for no-JS and crawlers); show just the selected one now
    select(tabs.find((t) => t.getAttribute('aria-selected') === 'true') || tabs[0]);
  }

  // Experience: expand / collapse
  const jobs = [...document.querySelectorAll('.job')];
  jobs.forEach((job) => {
    const head = job.querySelector('.job-head');
    const body = job.querySelector('.job-body');
    // Collapsed bodies are taken out of the tab order and the accessibility tree
    const setOpen = (open) => {
      job.classList.toggle('is-open', open);
      head.setAttribute('aria-expanded', String(open));
      body.inert = !open;
    };
    setOpen(job.classList.contains('is-open'));
    head.addEventListener('click', () => setOpen(!job.classList.contains('is-open')));
  });

  // Experience: filter by technology
  const filterGroup = document.querySelector('[data-filters]');
  if (filterGroup) {
    const buttons = [...filterGroup.querySelectorAll('[data-filter]')];
    filterGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-filter]');
      if (!btn) return;
      const key = btn.dataset.filter;
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      jobs.forEach((job) => {
        const tags = job.dataset.tags.split(' ');
        const match = key === 'all' || tags.includes(key);
        job.classList.toggle('is-dim', !match);
        job.classList.toggle('is-match', key !== 'all' && match);
        job.querySelectorAll('.chips li').forEach((chip) => {
          const f = (chip.dataset.f || '').split(' ');
          chip.classList.toggle('is-hit', key !== 'all' && f.includes(key));
        });
      });
    });
  }

  // Copy email
  const copyBtn = document.querySelector('[data-copy]');
  if (copyBtn) {
    const label = copyBtn.querySelector('[data-copy-label]');
    let timer;
    const text = copyBtn.querySelector('span');
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(copyBtn.dataset.copy);
        label.textContent = 'copied ✓';
      } catch {
        // Clipboard blocked (permissions / insecure context): select the address so it can be copied by hand
        const range = document.createRange();
        range.selectNodeContents(text);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        label.textContent = 'selected — press Ctrl+C';
      }
      clearTimeout(timer);
      timer = setTimeout(() => { label.textContent = 'copy'; }, 2600);
    });
  }

  // Reveal on scroll
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  // Highlight current section in the nav
  const navLinks = [...document.querySelectorAll('.nav a:not(.nav-cta)')];
  if ('IntersectionObserver' in window) {
    const byId = new Map(navLinks.map((a) => [a.getAttribute('href').slice(1), a]));
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const link = byId.get(entry.target.id);
        if (link) link.classList.toggle('is-active', entry.isIntersecting);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    byId.forEach((_, id) => {
      const section = document.getElementById(id);
      if (section) spy.observe(section);
    });
  }

  // Footer year
  const year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
})();
