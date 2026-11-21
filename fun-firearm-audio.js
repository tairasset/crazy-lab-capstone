const reports = {
  sidearm: { duration: .244, snap: .84, snapTime: .005, body: .58, bodyTime: .021,
    tone: 133, wash: .20, reflections: .038, actionAt: .046, action: .096, peak: .85, seed: 71 },
  carbine: { duration: .186, snap: .99, snapTime: .0038, body: .49, bodyTime: .015,
    tone: 160, wash: .17, reflections: .026, actionAt: .020, action: .13, peak: .79, seed: 101 },
  shotgun: { duration: .395, snap: .71, snapTime: .009, body: .93, bodyTime: .039,
    tone: 86, wash: .37, reflections: .052, actionAt: .086, action: .09, peak: .90, seed: 137 },
};

const tau = Math.PI * 2;
const decay = (time, duration) => Math.exp(-time / duration);

function renderReport(context, profile) {
  const { sampleRate } = context;
  const length = Math.ceil(sampleRate * profile.duration);
  const buffer = context.createBuffer(2, length, sampleRate);
  const direct = new Float32Array(length);
  const air = new Float32Array(length);
  const highResponse = 1 - Math.exp(-tau * 2400 / sampleRate);
  const lowResponse = 1 - Math.exp(-tau * 185 / sampleRate);
  let seed = profile.seed;
  let bright = 0;
  let dark = 0;

  for (let frame = 0; frame < length; frame++) {
    const time = frame / sampleRate;
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    const noise = (seed >>> 0) / 2147483648 - 1;
    bright += (noise - bright) * highResponse;
    dark += (noise - dark) * lowResponse;
    const edge = noise - bright;
    const midrange = bright - dark;
    const attack = Math.min(1, time / .0007);
    const crack = (edge * .83 + midrange * .63) * profile.snap * decay(time, profile.snapTime);
    const phase = tau * profile.tone * (time + .019 * (1 - decay(time, .020)));
    const drum = Math.sin(phase) * .58 + Math.sin(phase * 1.81) * .23 + Math.sin(phase * 3.14) * .12;
    const punch = (drum + dark * .68 + midrange * .42) * profile.body * decay(time, profile.bodyTime);
    const actionTime = time - profile.actionAt;
    const action = actionTime < 0 ? 0 : profile.action * Math.min(1, actionTime / .001)
      * (edge + .39 * Math.sin(tau * 1130 * actionTime)) * decay(actionTime, .0055);
    const hit = (crack + punch) * attack + action;
    direct[frame] = hit / (1 + Math.abs(hit) * .48);
    air[frame] = (midrange * .78 + dark * 1.28) * profile.wash
      * (1 - decay(time, .012)) * decay(time, profile.duration * .27);
  }

  const delay = multiplier => Math.max(1, Math.round(sampleRate * profile.reflections * multiplier));
  const leftFirst = delay(1);
  const rightFirst = delay(.67);
  const leftSecond = delay(2.12);
  const rightSecond = delay(1.73);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);
  let peak = 0;
  for (let frame = 0; frame < length; frame++) {
    const release = Math.min(1, (length - 1 - frame) / (sampleRate * .025));
    left[frame] = release * (direct[frame] + air[frame]
      + .24 * (direct[frame - leftFirst] ?? 0) + .13 * (direct[frame - leftSecond] ?? 0));
    right[frame] = release * (direct[frame] + .75 * air[frame]
      + .21 * (direct[frame - rightFirst] ?? 0) + .16 * (direct[frame - rightSecond] ?? 0));
    peak = Math.max(peak, Math.abs(left[frame]), Math.abs(right[frame]));
  }
  const gain = profile.peak / peak;
  for (let frame = 0; frame < length; frame++) {
    left[frame] *= gain;
    right[frame] *= gain;
  }
  return buffer;
}

export function createFirearmAudio(canPlaySound) {
  const sounds = new Map();
  let audio;
  let bus;
  let waking = false;

  function connect(context) {
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -11;
    compressor.knee.value = 8;
    compressor.ratio.value = 5;
    compressor.attack.value = .002;
    compressor.release.value = .065;
    const gain = context.createGain();
    gain.gain.value = .87;
    compressor.connect(gain).connect(context.destination);
    return compressor;
  }

  function start(type) {
    if (!canPlaySound()) return;
    if (!sounds.has(type)) sounds.set(type, renderReport(audio, reports[type]));
    const source = audio.createBufferSource();
    source.buffer = sounds.get(type);
    source.playbackRate.value = .975 + Math.random() * .05;
    source.connect(bus);
    source.onended = () => source.disconnect();
    source.start();
  }

  return function play(type) {
    if (!canPlaySound()) return;
    try {
      const Context = globalThis.AudioContext ?? globalThis.webkitAudioContext;
      if (!Context) return;
      audio ??= new Context();
      bus ??= connect(audio);
      if (audio.state === 'running') start(type);
      else if (!waking) {
        waking = true;
        void audio.resume().then(() => start(type)).catch(() => {}).finally(() => { waking = false; });
      }
    } catch {}
  };
}
