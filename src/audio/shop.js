/** Tiny procedural cues, unlocked only after an explicit interaction. */
export function createShopAudio() {
  let context, muted = false;
  return {
    unlock() {
      if (muted) return;
      try {
        const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!context && Audio) context = new Audio();
        if (context?.state === 'suspended') context.resume().catch(() => {});
      } catch { /* A disabled audio device never blocks play. */ }
    },
    mute(value) { muted = value; if (value) this.suspend(); },
    suspend() { if (context?.state === 'running') context.suspend().catch(() => {}); },
    play(events) {
      if (muted || context?.state !== 'running') return;
      for (const event of events) {
        const notes = event.type === 'pickup' ? [660, 880] : event.type === 'checkout' ? [523, 659, 784, 1047] : event.type === 'spill' ? [330, 246, 147, 92] : event.type === 'bump' ? [110] : [];
        notes.forEach((frequency, i) => {
          const at = context.currentTime + i * .09;
          const tone = context.createOscillator(), gain = context.createGain();
          tone.type = event.type === 'bump' ? 'triangle' : 'sine'; tone.frequency.value = frequency;
          gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(.075, at + .008);
          gain.gain.exponentialRampToValueAtTime(.001, at + .18);
          tone.connect(gain); gain.connect(context.destination); tone.start(at); tone.stop(at + .2);
          tone.onended = () => { tone.disconnect(); gain.disconnect(); };
        });
      }
    },
  };
}
