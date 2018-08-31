/* jshint esversion: 6 */

// Provides an interface for synthesizing and playing sounds.
const audio = (() => {

  // Only initialize the audio context once.
  const audioContext = new AudioContext();

  // Settings.
  const volume = 0.05;

  return {
    // Plays a brief sine wave at the given frequency.
    playNote: (freq) => {
      const now = audioContext.currentTime;
      const then = now + 0.25;

      const osc = audioContext.createOscillator();
      osc.frequency.setValueAtTime(freq, now);

      const gain = audioContext.createGain();
      gain.gain.setValueAtTime(volume, now);

      osc.connect(gain);
      gain.connect(audioContext.destination);

      osc.start(now);
      osc.stop(then);
    },

    // Plays a drum beat starting at the given frequency.
    playDrum: (freq) => {
      const now = audioContext.currentTime;
      const then = now + 0.25;

      const osc = audioContext.createOscillator();
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(volume / 100, then);

      const gain = audioContext.createGain();
      gain.gain.setValueAtTime(volume, now);
    	gain.gain.exponentialRampToValueAtTime(volume / 100, then);

      osc.connect(gain);
      gain.connect(audioContext.destination);

    	osc.start(now);
    	osc.stop(then);
    },

    // Plays the main beat.
    playTheme: () => {
      let o = 0;
      for (let j = 0; j < 4; j++) {
        for (let i = 0; i < 3; i++) {
          setTimeout(() => audio.playDrum(220), o + i * 1200 / 3);
        }
        o += 1200;
        for (let i = 0.25; i < 2.25; i++) {
          setTimeout(() => audio.playDrum(220), o + i * 800 / 3);
        }
        o += 800;
        for (let i = 0; i < 16; i++) {
          setTimeout(() => audio.playDrum(220), o + i * 2000 / 16);
        }
        o += 2000;
      }
    },
  };
})();
