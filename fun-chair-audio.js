const sampleRate = 24000;
const chair = {
  duration: .16,
  resonance: [[147, .12, 115], [282, .14, 113], [537, .18, 143], [1118, .12, 190]],
  grain: .47, contact: .66, scatter: [[.022, .34], [.047, .19]],
  air: [.105, .23, .11],
};
const plateTaps = [[617, .20, 68], [967, .21, 57], [1627, .20, 69], [2933, .11, 108]];
const casingTaps = [[396, .20, 110], [663, .16, 117], [1079, .14, 160], [1567, .07, 176]];
const robotTaps = [[491, .13, 75], [932, .21, 81], [1811, .15, 91]];
const items = {
  Chair: chair,
  Box: {
    duration: .21,
    resonance: [[83, .27, 61], [135, .19, 76], [268, .15, 97], [581, .10, 149]],
    grain: .59, contact: .90, scatter: [[.035, .31], [.073, .20]],
    air: [.133, .21, .15],
  },
  'Copper plate': {
    duration: 1.05,
    resonance: [[138, .14, 76], [372, .08, 25], [617, .16, 6.8], [967, .24, 5.7],
      [1627, .23, 8.5], [2183, .15, 11], [2933, .13, 15], [3869, .08, 27], [4733, .04, 45]],
    grain: .16, contact: .84, scatter: [[.019, .27], [.047, .19], [.089, .12], [.134, .07]],
    tapModes: plateTaps, taps: [[.019, .75], [.047, .51], [.089, .33], [.134, .19]],
    air: [.084, .30, .075],
  },
  Generator: {
    duration: .34,
    resonance: [[47, .47, 43], [76, .34, 55], [119, .19, 64], [218, .14, 71], [347, .09, 82]],
    grain: .72, contact: .81, scatter: [[.012, .45], [.031, .30], [.059, .20], [.095, .11]],
    tapModes: casingTaps, taps: [[.012, .55], [.031, .38], [.059, .23], [.095, .12]],
    air: [.170, .16, .225],
  },
  Filter: {
    duration: .28,
    resonance: [[108, .26, 66], [177, .20, 56], [644, .14, 90]],
    grain: .40, contact: .62, scatter: [[.021, .31], [.039, .25], [.062, .13]],
    air: [.120, .23, .13],
  },
  Reactor: {
    duration: .34,
    resonance: [[77, .34, 42], [163, .20, 49], [331, .17, 53], [697, .10, 76]],
    grain: .32, contact: .62, scatter: [[.033, .28], [.068, .20]],
    air: [.145, .18, .16],
  },
  Hammer: {
    duration: .20,
    resonance: [[125, .17, 61], [389, .14, 83], [847, .14, 93]],
    grain: .20, contact: .52, scatter: [[.031, .31]],
    air: [.095, .28, .096],
  },
  Crowbar: {
    duration: .32,
    resonance: [[221, .23, 38], [519, .22, 31], [1097, .23, 29], [2313, .18, 37], [3737, .075, 65]],
    grain: .38, contact: .86, scatter: [[.012, .32], [.038, .18]],
    tapModes: robotTaps, taps: [[.014, .52], [.041, .27]],
    air: [.11, .26, .14],
  },
  'Weapon strike': {
    duration: .27,
    resonance: [[143, .30, 52], [383, .22, 40], [731, .18, 46], [1681, .14, 59]],
    grain: .49, contact: .83, scatter: [[.016, .31], [.037, .20], [.074, .12]],
    air: [.09, .25, .13],
  },
  'Robot strike': {
    duration: .26,
    resonance: [[70, .35, 36], [149, .28, 46], [337, .20, 57], [973, .13, 72]],
    grain: .53, contact: .85, scatter: [[.012, .31], [.030, .19]],
    air: [.11, .22, .12],
  },
  'Robot head': {
    duration: .54,
    resonance: [[171, .19, 43], [519, .18, 14], [1059, .21, 12], [1931, .15, 25], [2789, .071, 39]],
    grain: .32, contact: .71, scatter: [[.023, .31], [.049, .22], [.078, .11]],
    tapModes: robotTaps, taps: [[.023, .63], [.049, .36], [.078, .23]],
    air: [.109, .26, .125],
  },
  'Robot torso': {
    duration: .47,
    resonance: [[65, .35, 49], [145, .24, 39], [327, .17, 24], [688, .18, 15], [1371, .12, 26]],
    grain: .50, contact: .76, scatter: [[.012, .38], [.032, .23], [.057, .14]],
    tapModes: robotTaps, taps: [[.012, .49], [.032, .29], [.057, .18]],
    air: [.157, .18, .20],
  },
  'Robot arm': {
    duration: .51,
    resonance: [[233, .19, 41], [787, .17, 15], [1301, .21, 13], [2293, .13, 22], [3477, .063, 33]],
    grain: .23, contact: .69, scatter: [[.018, .30], [.043, .21], [.069, .12]],
    tapModes: robotTaps, taps: [[.018, .53], [.043, .35], [.069, .18]],
    air: [.092, .29, .11],
  },
  'Robot leg': {
    duration: .49,
    resonance: [[103, .27, 45], [624, .18, 15], [1091, .20, 13], [1801, .13, 24], [2911, .058, 38]],
    grain: .38, contact: .78, scatter: [[.016, .29], [.035, .22], [.065, .16]],
    tapModes: robotTaps, taps: [[.016, .52], [.035, .32], [.065, .20]],
    air: [.126, .21, .15],
  },
};
const surfaces = {
  floor: { duration: .15, resonance: [[69, .18, 74]], contact: .18 },
  wood: { duration: .16, resonance: [[112, .13, 81], [219, .10, 126]], contact: .13 },
  glass: {
    duration: .29,
    resonance: [[1723, .075, 36], [2791, .065, 38], [3872, .048, 56]],
    contact: .22,
    debris: [[.022, .17], [.056, .13], [.091, .084], [.128, .046]],
  },
  generator: {
    duration: .24, resonance: [[92, .27, 58], [174, .16, 77], [337, .10, 83], [591, .08, 95]],
    contact: .32, debris: [[.009, .16], [.026, .12], [.047, .09], [.078, .05]],
    tapModes: casingTaps, taps: [[.009, .54], [.026, .41], [.047, .24], [.078, .12]],
  },
  equipment: { duration: .21, resonance: [[230, .12, 66], [817, .10, 59]], contact: .21 },
  metal: { duration: .25, resonance: [[311, .11, 48], [968, .10, 45], [1684, .077, 61], [2713, .043, 96]], contact: .28 },
  robot: {
    duration: .18, resonance: [[203, .15, 77], [589, .065, 61]],
    contact: .25, debris: [[.024, .11], [.054, .06]],
  },
  shield: {
    duration: .28, resonance: [[102, .23, 49], [277, .14, 55], [632, .11, 49], [1657, .10, 41]],
    contact: .31, debris: [[.016, .17], [.055, .08]],
  },
};
const splinters = [[.008, .33], [.019, .22], [.028, .17]];
const brokenPieces = [[.047, .35], [.082, .25], [.133, .16], [.169, .10]];
const materialVoices = {
  wood: 'Chair', crate: 'Box', copper: 'Copper plate', generator: 'Generator', metal: 'Hammer', 'robot-metal': 'Robot torso',
};
const radians = 2 * Math.PI;

function impactEnvelope(time, decay, attack = .0009) {
  return time < 0 ? 0 : Math.min(time / attack, 1) * Math.exp(-time * decay);
}

function vibrate(time, modes) {
  let result = 0;
  for (const [pitch, strength, decay] of modes) {
    result += strength * Math.sin(radians * pitch * time) * impactEnvelope(time, decay);
  }
  return result;
}

function impacts(time, markers, tone, highGrain, decay) {
  let result = 0;
  for (const [offset, strength] of markers) {
    result += strength * impactEnvelope(time - offset, decay) * (.26 * tone + .74 * highGrain);
  }
  return result;
}

function resonateTaps(time, taps, modes) {
  let result = 0;
  for (const [offset, strength] of taps) {
    if (time < offset) break;
    result += strength * vibrate(time - offset, modes);
  }
  return result;
}

export function createPropAudio() {
  const buffers = new Map();
  const active = new Set();

  function createBuffer(audio, item, target, phase, wear) {
    const air = phase === 'throw';
    const [airDuration, airFilter, airGain] = item.air;
    const duration = air ? airDuration : Math.max(item.duration, target.duration, wear === 'broken' ? .31 : 0);
    const buffer = audio.createBuffer(1, Math.ceil(duration * sampleRate), sampleRate);
    const samples = buffer.getChannelData(0);
    let bodyNoise = 0;
    let edgeNoise = 0;
    for (let i = 0; i < samples.length; i++) {
      const time = i / sampleRate;
      const noise = Math.random() * 2 - 1;
      bodyNoise += (noise - bodyNoise) * (air ? airFilter : .15);
      edgeNoise += (noise - edgeNoise) * .52;
      const grain = edgeNoise - bodyNoise;
      let sample;
      if (air) {
        const progress = time / duration;
        const gust = Math.sin(Math.PI * progress) ** 2;
        sample = gust * airGain * (.78 * bodyNoise + .22 * grain);
      } else {
        const contact = impactEnvelope(time, 295) * (item.contact + target.contact) * grain;
        const body = impactEnvelope(time, 115) * item.grain * bodyNoise;
        const rattle = impacts(time, item.scatter, bodyNoise, grain, 220);
        sample = contact + body + rattle + vibrate(time, item.resonance) + vibrate(time, target.resonance);
        if (item.taps) sample += resonateTaps(time, item.taps, item.tapModes);
        if (target.taps) sample += resonateTaps(time, target.taps, target.tapModes);
        if (target.debris) sample += impacts(time, target.debris, 0, grain, 158);
        if (wear !== 'solid') sample += impacts(time, splinters, bodyNoise, grain, 182);
        if (wear === 'broken') sample += impacts(time, brokenPieces, bodyNoise, grain, 110);
      }
      samples[i] = .87 * Math.tanh(sample * (air ? 1.08 : 1.75)) * Math.min(1, (samples.length - 1 - i) / 140);
    }
    return buffer;
  }

  function play(audio, { item = 'Chair', material, surface = 'floor', phase, cracked, broken }) {
    const name = Object.hasOwn(items, item) ? item : (Object.hasOwn(materialVoices, material) ? materialVoices[material] : 'Chair');
    const target = phase === 'throw' || !Object.hasOwn(surfaces, surface) ? 'floor' : surface;
    const wear = broken ? 'broken' : cracked ? 'cracked' : 'solid';
    const key = [name, target, phase === 'throw' ? 'throw' : wear].join(':');
    if (!buffers.has(key)) buffers.set(key, createBuffer(audio, items[name], surfaces[target], phase, wear));
    const source = audio.createBufferSource();
    source.buffer = buffers.get(key);
    source.playbackRate.value = .97 + Math.random() * .06;
    source.connect(audio.destination);
    source.onended = () => {
      active.delete(source);
      source.disconnect();
    };
    source.start();
    active.add(source);
  }

  function stop() {
    for (const source of active) source.stop();
    active.clear();
  }

  return { play, stop };
}
