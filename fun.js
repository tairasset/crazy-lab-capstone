import { setupFunCombat } from './fun-controls.js';
import { createPropAudio } from './fun-chair-audio.js';

const labels = { 'fun-blast': 'Blast', 'fun-splash': 'Splash', 'fun-reset': 'Reset' };
const actions = Object.keys(labels);
const facts = {
  blast: 'Lab fact · In the patent, a tube carries hydrogen from the tank to a separate reactor.',
  splash: 'Lab fact · A filter lets liquid through and keeps the solid grains.',
};
const find = (id) => document.getElementById(id);

function startSiren(audio, ended) {
  const siren = audio.createOscillator();
  const sweep = audio.createOscillator();
  const depth = audio.createGain();
  const volume = audio.createGain();
  const start = audio.currentTime;
  siren.type = 'triangle';
  siren.frequency.setValueAtTime(595, start);
  sweep.type = 'triangle';
  sweep.frequency.value = 1.2;
  depth.gain.value = 135;
  volume.gain.setValueAtTime(0, start);
  volume.gain.linearRampToValueAtTime(.075, start + .15);
  sweep.connect(depth).connect(siren.frequency);
  siren.connect(volume).connect(audio.destination);
  siren.onended = () => {
    sweep.stop();
    sweep.disconnect();
    depth.disconnect();
    volume.disconnect();
    ended(siren);
  };
  sweep.start();
  siren.start();
  return siren;
}

export function setupFunLab(world) {
  const panel = find('fun-panel');
  const game = find('game-scene');
  const status = find('fun-status');
  const sound = find('fun-sound');
  const fact = find('fun-fact');
  const banner = find('fun-alarm');
  const stopSiren = find('fun-stop-siren');
  let audio;
  let source;
  let audioVersion = 0;
  let propSoundVersion = 0;
  const propSounds = createPropAudio();
  let incidentTimer;
  let deployTimer;
  let sirenDisabled = false;

  panel.hidden = false;
  find('location').textContent = 'Security Lab';
  world?.update({
    fun: true, crazy: true, room: 'lab', wing: 'basics', phase: 'idle', seen: new Set(),
  }, actions, 'Fun Mode', 'Hit lab equipment or press Blast to call security.', labels);
  const combat = setupFunCombat(world, () => choose('fun-blast'), silenceSiren);
  if (world) {
    world.setFunChairAudio(playPropSound);
    game.addEventListener('pointerdown', unlockSound);
    window.addEventListener('keydown', unlockSound);
  }

  function getAudio() {
    const Audio = window.AudioContext ?? window.webkitAudioContext;
    if (sound.checked && Audio) audio ??= new Audio();
    return sound.checked ? audio : undefined;
  }

  function unlockSound() {
    try {
      const context = getAudio();
      if (context?.state === 'suspended') void context.resume().catch(() => {});
    } catch {}
  }

  function stopPropSounds() {
    propSoundVersion += 1;
    propSounds.stop();
  }

  function playPropSound(event) {
    try {
      const context = getAudio();
      if (!context) return;
      if (context.state === 'running') propSounds.play(context, event);
      else {
        const version = propSoundVersion;
        void context.resume().then(() => {
          if (version === propSoundVersion && sound.checked) propSounds.play(context, event);
        }).catch(() => {});
      }
    } catch {}
  }

  function stopSound() {
    audioVersion += 1;
    source?.stop();
    source = undefined;
  }

  function soundEnded(playback) {
    playback.disconnect();
    if (source === playback) source = undefined;
  }

  function playSound(effect) {
    stopSound();
    const version = audioVersion;
    try {
      if (!getAudio()) return;
      void audio.resume().then(() => {
        if (version !== audioVersion) return;
        if (effect === 'alarm') {
          source = startSiren(audio, soundEnded);
          return;
        }
        const blast = effect === 'blast';
        const frames = Math.round(audio.sampleRate * (blast ? .83 : .51));
        const buffer = audio.createBuffer(1, frames, audio.sampleRate);
        const samples = buffer.getChannelData(0);
        for (let i = 0; i < frames; i++) {
          const progress = i / frames;
          const grain = Math.random() * 2 - 1;
          const thump = blast ? Math.sin(i * .009) * .5 : 0;
          samples[i] = (grain + thump) * (1 - progress) ** 3 * (blast ? .52 : .32);
        }
        const filter = audio.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = blast ? 520 : 1900;
        const playback = audio.createBufferSource();
        playback.buffer = buffer;
        playback.connect(filter).connect(audio.destination);
        source = playback;
        playback.onended = () => {
          filter.disconnect();
          soundEnded(playback);
        };
        playback.start();
      }).catch(() => {});
    } catch {
      // The effects still run when audio is unavailable.
    }
  }

  function showMessage(text) {
    status.textContent = text;
  }

  function setIncident(stage) {
    game.dataset.incident = panel.dataset.incident = stage;
    const alarming = stage === 'alarm';
    game.classList.toggle('has-fun-alarm', alarming);
    stopSiren.hidden = !alarming;
    world?.setFunAlarm?.(alarming);
    banner.hidden = !alarming && stage !== 'sprinklers';
  }

  function clearIncident() {
    window.clearTimeout(incidentTimer);
    window.clearTimeout(deployTimer);
    stopSound();
    setIncident('ready');
  }

  function restart() {
    clearIncident();
    sirenDisabled = false;
    stopPropSounds();
    world?.resetFunRoom();
    combat.reset();
    world?.clearFunEffect?.();
    world?.center();
    delete game.dataset.effect;
    game.classList.remove('crazy-fallback-effect', 'fun-fallback-splash');
    fact.hidden = true;
    find('fun-prop-status').textContent = 'Aim at an item and press E to grab. G throws it.';
    showMessage('Ready');
  }

  function silenceSiren() {
    if (panel.dataset.incident !== 'alarm') return;
    sirenDisabled = true;
    window.clearTimeout(incidentTimer);
    setIncident('sprinklers');
    showMessage('Siren disabled · Sprinklers on');
    find('fun-alarm-title').textContent = 'Sprinklers on';
    find('fun-alarm-note').textContent = 'The siren went quiet.';
    if (world?.playFunSprinklers) world.playFunSprinklers();
    else if (world?.playFunEffect) world.playFunEffect('splash');
    else {
      game.classList.remove('crazy-fallback-effect');
      game.classList.add('fun-fallback-splash');
    }
    playSound('splash');
    incidentTimer = window.setTimeout(() => {
      setIncident('clear');
      const battle = combat.status();
      showMessage(battle === 'active' ? 'Sprinklers off · Security still active' : battle === 'lost' ? 'Shield down' : 'All clear');
    }, 3000);
  }

  function startAlarm(equipmentHit = false) {
    find('fun-alarm-title').textContent = 'Lab alarm';
    find('fun-alarm-note').textContent = world ? 'You can also shoot the red siren overhead.' : '';
    setIncident('alarm');
    showMessage(equipmentHit ? 'Equipment hit · Lab alarm' : 'Lab alarm');
    playSound('alarm');
    deployTimer = window.setTimeout(() => {
      if (combat.status() !== 'active' && combat.start() && panel.dataset.incident === 'alarm') {
        showMessage('Security deployed · Lab alarm');
      }
    }, 500);
  }

  function choose(id) {
    if (id === 'fun-aim-place' || id === 'fun-aim-toss' || id === 'fun-aim-box') {
      combat.furniture(id.slice('fun-'.length));
      return;
    }
    if (id === 'fun-siren-hit') {
      silenceSiren();
      return;
    }
    if (id === 'fun-equipment-hit') {
      if (sirenDisabled || ['impact', 'alarm'].includes(panel.dataset.incident)) return;
      clearIncident();
      startAlarm(true);
      return;
    }
    if (id?.startsWith('fun-prop-')) {
      combat.furniture('grab', Number(id.slice('fun-prop-'.length)));
      return;
    }
    if (id?.startsWith('fun-weapon-')) {
      combat.select(id.slice('fun-weapon-'.length));
      return;
    }
    if (id === 'fun-reset') {
      if (panel.dataset.incident !== 'alarm' || ['won', 'lost'].includes(combat.status())) restart();
      else if (world) showMessage('Press M or select Stop siren to silence the alarm.');
      else silenceSiren();
      return;
    }
    if (id !== 'fun-blast' && id !== 'fun-splash') return;
    const effect = id === 'fun-blast' ? 'blast' : 'splash';
    if (effect === 'blast') {
      if (panel.dataset.incident === 'alarm' && ['active', 'idle'].includes(combat.status())) {
        showMessage('Press M or select Stop siren to silence the alarm.');
        return;
      }
      sirenDisabled = false;
      clearIncident();
      combat.reset();
      world?.clearFunEffect?.();
    }
    if (world?.playFunEffect) world.playFunEffect(effect);
    else {
      const fallback = effect === 'blast' ? 'crazy-fallback-effect' : 'fun-fallback-splash';
      game.classList.remove('crazy-fallback-effect', 'fun-fallback-splash');
      void game.offsetWidth;
      game.classList.add(fallback);
    }
    game.dataset.effect = effect;
    if (panel.dataset.incident !== 'alarm') playSound(effect);
    if (combat.status() !== 'active') showMessage(effect === 'blast' ? 'Blast triggered' : 'Splash triggered');
    if (effect === 'blast') {
      setIncident('impact');
      incidentTimer = window.setTimeout(startAlarm, 750);
    }
    fact.textContent = facts[effect];
    fact.hidden = false;
  }

  for (const id of actions) find(id).addEventListener('click', () => choose(id));
  stopSiren.addEventListener('click', silenceSiren);
  sound.addEventListener('change', () => {
    if (!sound.checked) {
      stopSound();
      stopPropSounds();
    } else {
      unlockSound();
      if (panel.dataset.incident === 'alarm') playSound('alarm');
    }
  });
  return { choose, restart, showMessage };
}
