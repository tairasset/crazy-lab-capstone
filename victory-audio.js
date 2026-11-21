const stageClips = ['victory-stage-1.mp3', 'victory-stage-2.mp3'];
const finaleClips = ['victory-finale.mp3'];

export function createVictoryAudio() {
  const buffers = new Map();
  const sources = new Set();
  let context;
  let request = 0;

  function loadClip(name) {
    if (!buffers.has(name)) {
      const loading = fetch(new URL(name, import.meta.url)).then(response => {
        if (!response.ok) throw new Error('Victory clip unavailable');
        return response.arrayBuffer();
      }).then(bytes => context.decodeAudioData(bytes)).catch(error => {
        buffers.delete(name);
        throw error;
      });
      buffers.set(name, loading);
    }
    return buffers.get(name);
  }

  function loadClips(finale) {
    return Promise.all((finale ? finaleClips : stageClips).map(loadClip));
  }

  async function unlock(finale = false) {
    const Audio = globalThis.AudioContext ?? globalThis.webkitAudioContext;
    if (!Audio) return false;
    try {
      context ??= new Audio();
      if (context.state !== 'running') await context.resume();
      if (context.state !== 'running') return false;
      void loadClips(finale).catch(() => {});
      return true;
    } catch {
      return false;
    }
  }

  function stop() {
    request += 1;
    for (const source of sources) source.stop();
    sources.clear();
  }

  async function play(finale = false) {
    stop();
    const pending = request;
    try {
      if (!await unlock(finale)) return false;
      const clips = await loadClips(finale);
      if (pending !== request) return false;
      let time = context.currentTime + .015;
      for (const clip of clips) {
        const source = context.createBufferSource();
        source.buffer = clip;
        source.connect(context.destination);
        source.onended = () => {
          source.disconnect();
          sources.delete(source);
        };
        source.start(time);
        sources.add(source);
        time += clip.duration + .06;
      }
      return true;
    } catch {
      return false;
    }
  }

  return { unlock, play, stop };
}
