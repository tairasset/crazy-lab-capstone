import { answerQuestion } from './guide.js';
import { checkedCrazySources, lookupCrazyAnswer, normalizeCrazyContext } from './crazy-guide.js';
import { checkedLearningSources, lookupLearningAnswer, normalizeLearningContext } from './learning-guide.js';
import { publicLesson, publicTurn, unknownPublicAnswer } from './public-guide.js';
import { validExplanation } from './explain-policy.js';

const providerNames = { neural: 'Lab AI', flan: 'FLAN-T5', openai: 'OpenAI', gemini: 'Gemini' };

export function setupEnglishGuide(getContext, {
  title = 'Lab guide',
  lead = 'Ask what an instrument does, what is happening or what to do next.',
  prompts = ['What do I do next?', 'What does the filter do?', 'Why does the reactor need two inputs?'],
} = {}) {
  const find = (id) => document.getElementById(id);
  const dialog = find('guide-dialog');
  find('guide-title').textContent = title;
  find('guide-lead').textContent = lead;
  const close = dialog.querySelector('form[method="dialog"] button');
  close.textContent = 'Close';
  close.setAttribute('aria-label', 'Close chat');
  dialog.querySelector('.guide-head .eyebrow').hidden = true;
  dialog.querySelector('.guide-prompts').setAttribute('aria-label', 'Suggested questions');
  find('guide-log').setAttribute('aria-label', 'Chat with the lab guide');
  dialog.querySelector('label[for="guide-input"]').textContent = 'Your question';
  find('guide-input').placeholder = 'Type a question…';
  find('guide-send').textContent = 'Send';
  dialog.querySelectorAll('[data-question]').forEach((button, index) => {
    const prompt = prompts[index];
    button.hidden = !prompt;
    if (prompt) [button.dataset.question, button.textContent] = Array.isArray(prompt) ? prompt : [prompt, prompt];
  });
  setupGuide(getContext);
}

export function setupGuide(getContext) {
  const dialog = document.getElementById('guide-dialog');
  const form = document.getElementById('guide-form');
  const input = document.getElementById('guide-input');
  const sendButton = document.getElementById('guide-send');
  const status = document.getElementById('guide-status');
  const option = document.getElementById('guide-online-option');
  const online = document.getElementById('guide-online');
  const privacy = document.getElementById('guide-privacy');
  const styleOption = document.getElementById('guide-style-option');
  const style = document.getElementById('guide-style');
  let previousTopic = '';
  let previousFact = -1;
  const log = document.getElementById('guide-log');
  const prompts = [...dialog.querySelectorAll('[data-question]')];
  let onlineHistory = [];
  const copy = {
    player: 'You', reference: 'Study notes', sources: 'Answer sources',
    fallback: {
      'rate-limit': 'request paused because the lab is busy',
      'provider-limit': 'is limiting requests',
      'provider-cooldown': 'is temporarily paused',
      'provider-unavailable': 'is unavailable',
      'session-limit': 'session limit reached',
      'visitor-limit': 'question limit reached for now',
      'daily-limit': 'daily limit reached',
      'access-denied': 'access denied',
      unavailable: 'unavailable',
      unconfigured: 'unavailable',
    },
  };
  let activeContext;
  let busy = false;
  let lastTopic;
  let providerName = '';
  let privateGuide = false;
  let connectionStatus = '';
  let statusRequest = 0;
  let checkingConnection;
  const preferenceKey = 'crazy-lab-guide-provider';
  let preference = '';
  try { preference = sessionStorage.getItem(preferenceKey) || ''; } catch {}
  function savePreference(choice) {
    preference = choice;
    try {
      if (choice) sessionStorage.setItem(preferenceKey, choice);
      else sessionStorage.removeItem(preferenceKey);
    } catch { /* The checkbox still works without tab storage. */ }
  }

  function showSelectedMode() {
    styleOption.hidden = privateGuide || option.hidden || !online.checked || providerName !== providerNames.neural;
    if (busy) return;
    if (option.hidden) {
      status.textContent = connectionStatus;
      return;
    }
    if (!privateGuide) {
      status.textContent = online.checked
        ? (style.value === 'explain' ? 'Ask a question, then try “Can you give me an example?”' : 'MiniLM finds a passage in the public study notes.')
        : 'Study notes are on. Your questions stay in this browser.';
      return;
    }
    const edition = providerName === 'Gemini' ? 'Private Gemini beta' : 'Local AI edition';
    status.textContent = online.checked
      ? `${edition} · ${providerName} enabled. Quick lesson answers can come from the built-in guide.`
      : `${edition} · Built-in guide selected. Turn on “Use ${providerName} for replies” to ask the model.`;
  }

  function append(role, content, mode, references = [], reason = '') {
    const bubble = document.createElement('div');
    bubble.className = `guide-message ${role}`;
    const author = document.createElement('small');
    const displayMode = Object.hasOwn(providerNames, mode) ? providerNames[mode] : copy.reference;
    author.textContent = role === 'user' ? copy.player : `Pip · ${displayMode}${reason ? ' · ' + reason : ''}`;
    const message = document.createElement('p');
    message.textContent = content;
    bubble.append(author, message);
    if (references.length) {
      const list = document.createElement('ul');
      list.setAttribute('aria-label', copy.sources);
      for (const { title, url, locator } of references) {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = `${title} · ${locator}`;
        item.append(link);
        list.append(item);
      }
      bubble.append(list);
    }
    log.append(bubble);
    log.scrollTop = log.scrollHeight;
  }

  async function showConnection() {
    const request = ++statusRequest;
    const publicStatus = 'Pip can answer from the public study notes.';
    let message = 'Using study notes. Reopen the chat to check the AI connection.';
    let detected = '';
    let defaultOnline = false;
    let detectedPrivate = false;
    privateGuide = false;
    connectionStatus = 'Connecting to the guide…';
    option.hidden = privacy.hidden = true;
    showSelectedMode();
    try {
      const response = await fetch('./api/guide-status', { cache: 'no-store', signal: AbortSignal.timeout(7000) });
      if (response.status === 401) {
        if (request === statusRequest && preference !== 'local') savePreference('');
        message = 'Private Gemini beta · Sign in again to use Gemini. Built-in answers are available.';
      } else if (response.status === 404) {
        message = publicStatus;
      } else if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
        const info = await response.json();
        const neural = info.provider === 'neural' && info.edition === 'public-neural';
        const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
        detectedPrivate = info.configured === true && !info.edition &&
          ((info.provider === 'gemini' && info.defaultOnline === true) || (info.provider === 'openai' && loopback));
        if (info.configured === true && (neural || detectedPrivate)) {
          detected = providerNames[info.provider];
          defaultOnline = info.defaultOnline === true;
        } else message = publicStatus;
      }
    } catch {
      // A failed status check leaves only the browser guide available.
    }
    if (request !== statusRequest) return;
    if (providerName !== detected) onlineHistory = [];
    online.checked = Boolean(detected) && (preference === detected || (preference !== 'local' && defaultOnline));
    providerName = detected;
    privateGuide = detectedPrivate;
    connectionStatus = message;
    if (detected) {
      option.lastChild.textContent = ` Use ${providerName} for replies in this tab`;
      privacy.textContent = !privateGuide
        ? 'Crazy Lab processes your question and game step on its server. Switch off for study notes in this browser.'
        : `Online replies send your question, recent online messages and current activity to ${providerName}.`;
      option.hidden = privacy.hidden = false;
    }
    showSelectedMode();
  }

  async function fetchReply(payload, timeout) {
    const response = await fetch('./api/guide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeout),
    });
    if (response.status === 401) {
      if (preference !== 'local') savePreference('');
      online.checked = false;
      option.hidden = privacy.hidden = true;
      connectionStatus = 'Online access expired. Public study notes are available.';
      privateGuide = false;
      onlineHistory = [];
      throw new Error('access-denied');
    }
    if (!response.ok) throw new Error('unavailable');
    return response.json();
  }

  async function publicReply(question, context, selected) {
    const explain = selected && style.value === 'explain';
    const turn = explain ? publicTurn(question, context, previousTopic, previousFact) : null;
    const lesson = turn?.lesson ?? publicLesson(question, context);
    const local = { text: lesson.text, topic: lesson.topic, sources: lesson.sources, mode: 'local' };
    if (!selected || !lesson.known || lesson.restricted) {
      previousTopic = ''; previousFact = -1;
      return local;
    }
    try {
      const result = await fetchReply({ question, context, ...(explain ? { style: 'explain', previousTopic, previousFact } : {}) }, 45000);
      const text = typeof result.text === 'string' ? result.text.trim() : '';
      previousTopic = lesson.topic;
      previousFact = Number.isInteger(result.fact) ? result.fact : -1;
      const evidence = turn?.sentences?.[previousFact];
      if (explain && result.mode === 'flan' && evidence && validExplanation(text, evidence)) {
        return { ...local, text, mode: 'flan' };
      }
      if (explain && result.mode === 'local' && evidence && text === evidence) return { ...local, text };
      if (result.mode === 'neural' && text && lesson.context.includes(text)) {
        return { ...local, text, mode: 'neural' };
      }
      if (result.mode === 'local' && result.reason === 'no-evidence') {
        return { text: unknownPublicAnswer, topic: 'unknown', sources: [], mode: 'local' };
      }
      if (result.mode === 'local') return { ...local, reason: result.reason };
      return { ...local, reason: 'unavailable' };
    } catch (error) {
      return { ...local, reason: error.message === 'access-denied' ? 'access-denied' : 'unavailable' };
    }
  }

  async function privateReply(question, stage, selected) {
    const learning = normalizeLearningContext(stage);
    const crazy = normalizeCrazyContext(stage);
    const context = learning ?? crazy ?? { ...stage, topic: lastTopic };
    const lookup = learning ? lookupLearningAnswer(question, context) : crazy ? lookupCrazyAnswer(question, context) : null;
    let answer = { ...(lookup?.local ?? answerQuestion(question, context)), mode: 'local' };
    if (selected && !lookup?.fixed) {
      const conversation = onlineHistory;
      try {
        const result = await fetchReply({ question, context, history: conversation.slice(-4) }, 12000);
        if (typeof result.text !== 'string' || !result.text.trim() ||
            !(result.mode === 'local' || providerNames[result.mode] === selected)) throw new Error('unavailable');
        answer = result;
        if (providerNames[result.mode] === selected) {
          conversation.push({ role: 'user', content: question.slice(0, 800) }, { role: 'assistant', content: answer.text.slice(0, 800) });
          if (conversation.length > 4) conversation.splice(0, 2);
        }
      } catch (error) {
        answer.reason = error.message === 'access-denied' ? 'access-denied' : 'unavailable';
      }
    }
    if (!privateGuide) return publicReply(question, learning ?? crazy ?? {}, false);
    if (answer.topic && answer.topic !== 'unknown') lastTopic = answer.topic;
    const sources = learning ? checkedLearningSources(answer.sources) : crazy ? checkedCrazySources(answer.sources) : [];
    return { ...answer, sources };
  }

  async function send(question) {
    if (busy || !question) return;
    const stage = activeContext ?? getContext();
    const pending = checkingConnection;
    busy = true;
    sendButton.disabled = true;
    for (const prompt of prompts) prompt.disabled = true;
    input.value = '';
    append('user', question);
    try {
      if (pending) await pending;
      const selected = online.checked && !option.hidden && (!privateGuide || !pending) ? providerName : '';
      if (selected) status.textContent = `Looking up your question with ${selected}…`;
      const answer = privateGuide ? await privateReply(question, stage, selected)
        : await publicReply(question, normalizeLearningContext(stage) ?? normalizeCrazyContext(stage) ?? {}, selected === providerNames.neural);
      const detail = Object.hasOwn(copy.fallback, answer.reason) ? copy.fallback[answer.reason] : '';
      append('assistant', answer.text, answer.mode, answer.sources, detail);
      busy = false;
      showSelectedMode();
      if (detail) status.textContent = `Study notes answered · ${detail}.`;
    } finally {
      busy = false;
      sendButton.disabled = false;
      for (const prompt of prompts) prompt.disabled = false;
    }
  }

  document.getElementById('guide-open').addEventListener('click', () => {
    activeContext = getContext();
    if (document.pointerLockElement) document.exitPointerLock();
    if (!dialog.open) dialog.showModal();
    const pending = showConnection();
    checkingConnection = pending;
    pending.finally(() => { if (checkingConnection === pending) checkingConnection = undefined; });
  });
  online.addEventListener('change', () => {
    if (!online.checked) onlineHistory = [];
    savePreference(online.checked ? providerName : 'local');
    showSelectedMode();
  });
  style.addEventListener('change', showSelectedMode);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    send(input.value.trim());
  });
  for (const prompt of prompts) prompt.addEventListener('click', () => send(prompt.dataset.question));
}
