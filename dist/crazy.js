import { crazyCases } from './crazy-cases.js';
import { clearVictory, showVictory } from './victory.js';

const letters = ['A', 'B', 'C', 'D'];
const choiceIds = letters.map((letter) => `crazy-${letter.toLowerCase()}`);
const find = (id) => document.getElementById(id);

export function setupCrazyLab(world) {
  const game = find('viewport').closest('.game');
  const options = find('crazy-options');
  const feedback = find('crazy-feedback');
  const advanceButton = find('crazy-continue');
  const sound = find('crazy-sound');
  const seen = new Set();
  let index = 0;
  let choice = null;
  let mistakes = 0;
  let score = 0;
  let retried = false;
  let complete = false;
  let audio;

  find('crazy-panel').hidden = false;
  find('guide-title').textContent = 'Lab guide';
  find('guide-lead').textContent = 'Ask about the current stage, a warning sign or why the equipment stopped.';
  const close = document.querySelector('#guide-dialog form[method="dialog"] button');
  close.textContent = 'Close';
  close.setAttribute('aria-label', 'Close chat');
  document.querySelector('.guide-head .eyebrow').hidden = true;
  document.querySelector('.guide-prompts').setAttribute('aria-label', 'Suggested questions');
  find('guide-log').setAttribute('aria-label', 'Chat with the lab guide');
  find('guide-status').textContent = 'Offline guide';
  document.querySelector('label[for="guide-input"]').textContent = 'Your question';
  find('guide-input').placeholder = 'Type a question…';
  find('guide-send').textContent = 'Send';
  const prompts = [
    ['What should I do next?', 'What next?'],
    ['What is the early warning sign?', 'Warning sign'],
    ['Why did this happen?', 'Why did this happen?'],
    ['What source supports this scenario?', 'Show sources'],
  ];
  document.querySelectorAll('.guide-prompts [data-question]').forEach((button, i) => {
    [button.dataset.question, button.textContent] = prompts[i];
  });

  function playAlarmSound(dramatic) {
    if (!sound.checked || !window.AudioContext) return;
    try {
      audio ??= new AudioContext();
      void audio.resume().then(() => {
        const start = audio.currentTime;
        const tones = dramatic ? [[90, 0, .32], [460, .28, .18], [550, .56, .18]] : [[470, 0, .16], [470, .24, .16]];
        for (const [frequency, delay, duration] of tones) {
          const oscillator = audio.createOscillator();
          const volume = audio.createGain();
          const begin = start + delay;
          oscillator.type = frequency < 100 ? 'triangle' : 'sine';
          oscillator.frequency.value = frequency;
          volume.gain.setValueAtTime(.001, begin);
          volume.gain.linearRampToValueAtTime(.12, begin + .025);
          volume.gain.exponentialRampToValueAtTime(.001, begin + duration);
          oscillator.connect(volume).connect(audio.destination);
          oscillator.start(begin);
          oscillator.stop(begin + duration);
        }
      }).catch(() => {});
    } catch {
      // The visible alarm also conveys the stop.
    }
  }

  function showMessage(text) {
    const notice = find('crazy-notice');
    notice.textContent = text;
    notice.hidden = !text;
  }

  function render() {
    const scenario = crazyCases[index];
    const selected = choice === null ? null : scenario.options[choice];
    const correct = choice === scenario.correct;
    const alarm = scenario.id === 'gas-alarm' && Boolean(selected) && !correct;
    const action = complete ? 'crazy-restart' : correct ? 'crazy-next' : 'crazy-retry';
    const title = complete ? 'Shift complete' : scenario.title;

    find('crazy-stage').textContent = complete ? 'All stages complete' : `Stage ${index + 1} of ${crazyCases.length}`;
    find('crazy-score').textContent = `${score} / ${crazyCases.length * 100} points`;
    find('crazy-title').textContent = title;
    find('crazy-setup').textContent = complete
      ? `The sediment is ready for the next stage. Mistakes this shift — ${mistakes}.`
      : scenario.setup;
    find('location').textContent = alarm ? 'Equipment stopped' : complete ? 'Shift complete' : 'Safety Drill';
    game.classList.toggle('has-crazy-alarm', alarm);
    find('crazy-alarm').hidden = !alarm;
    const dramatic = alarm && selected.dramatic === true;
    find('crazy-effect-label').hidden = !dramatic;
    game.classList.toggle('crazy-fallback-effect', dramatic && !world?.playAlarm);

    options.hidden = Boolean(selected) || complete;
    options.toggleAttribute('data-guided-action', !options.hidden);
    options.replaceChildren(...scenario.options.map((option, i) => {
      const button = document.createElement('button');
      const letter = document.createElement('span');
      button.type = 'button';
      button.dataset.choice = choiceIds[i];
      letter.className = 'crazy-letter';
      letter.textContent = letters[i];
      button.append(letter, document.createTextNode(option.text));
      return button;
    }));

    feedback.hidden = !selected || complete;
    feedback.dataset.result = alarm ? 'alarm' : correct ? 'correct' : 'retry';
    if (selected && !complete) {
      find('crazy-result').textContent = alarm ? 'Emergency shutdown' : correct ? 'Correct choice' : 'Check your choice';
      find('crazy-outcome').textContent = `${letters[choice]} · ${selected.text}\n${selected.result}`;
      const entries = [
        ['Why', selected.why],
        ['What to notice', selected.sign],
        ['Safer choice', selected.safer],
        ['Batch status', selected.batch],
      ];
      find('crazy-explanation').replaceChildren(...entries.map(([term, explanation]) => {
        const row = document.createElement('div');
        const dt = document.createElement('dt');
        const dd = document.createElement('dd');
        dt.textContent = term;
        dd.textContent = explanation;
        row.append(dt, dd);
        return row;
      }));
      find('crazy-sources').replaceChildren(...scenario.sources.map(({ title, url, locator }) => {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = `${title} · ${locator}`;
        return link;
      }));
    }

    advanceButton.hidden = !selected && !complete;
    advanceButton.toggleAttribute('data-guided-action', Boolean(selected) && !complete);
    advanceButton.dataset.action = action;
    advanceButton.textContent = complete ? 'Restart shift'
      : !correct ? 'Try again' : index === crazyCases.length - 1 ? 'Finish shift' : 'Next';

    const phase = complete ? 'ready' : scenario.id === 'sample-prep' ? 'route'
      : scenario.id === 'gas-alarm' ? 'observe' : scenario.id === 'power' && correct ? 'electrolysis' : 'idle';
    const active = selected || complete ? [action] : choiceIds;
    const labels = Object.fromEntries(scenario.options.map((option, i) => [choiceIds[i], `${letters[i]} · ${option.text}`]));
    labels[action] = advanceButton.textContent;
    world?.update({
      crazy: true, room: 'lab', wing: 'basics', phase, seen,
      comparePower: !selected, gas: scenario.id === 'sample-prep' || (scenario.id === 'gas-alarm' && !selected),
      solid: complete, focus: scenario.focus,
    }, active, title, complete ? find('crazy-setup').textContent : selected ? `${selected.result} ${selected.why}` : scenario.setup, labels);
  }

  function restart() {
    clearVictory();
    index = 0;
    choice = null;
    score = 0;
    mistakes = 0;
    retried = false;
    complete = false;
    world?.clearAlarm?.();
    world?.reset();
    showMessage('');
    render();
    find('crazy-title').focus();
  }

  function choose(id) {
    if (complete) {
      if (id === 'crazy-restart') restart();
      return;
    }
    const scenario = crazyCases[index];
    if (choice !== null) {
      if (choice === scenario.correct && id === 'crazy-next') {
        if (index === crazyCases.length - 1) {
          complete = true;
          showVictory('safety');
        }
        else {
          index += 1;
          choice = null;
          retried = false;
        }
      } else if (choice !== scenario.correct && id === 'crazy-retry') choice = null;
      else return;
      world?.clearAlarm?.();
      showMessage('');
      render();
      find('crazy-title').focus();
      return;
    }
    const option = choiceIds.indexOf(id);
    if (option < 0) return;
    choice = option;
    const wrong = choice !== scenario.correct;
    if (wrong) {
      mistakes += 1;
      retried = true;
    } else score += retried ? 50 : 100;
    showMessage('');
    render();
    if (wrong && scenario.id === 'gas-alarm') {
      const dramatic = scenario.options[choice].dramatic === true;
      world?.playAlarm?.({ dramatic });
      playAlarmSound(dramatic);
    }
    find('crazy-result').focus();
  }

  options.addEventListener('click', (event) => {
    choose(event.target.closest('button')?.dataset.choice);
  });
  advanceButton.addEventListener('click', () => choose(advanceButton.dataset.action));
  render();

  return {
    choose, restart, showMessage,
    context: () => ({
      mission: 'crazy', caseId: crazyCases[index].id, choice,
      stageStatus: complete ? 'complete' : choice === null ? 'choosing' : 'feedback',
    }),
  };
}
