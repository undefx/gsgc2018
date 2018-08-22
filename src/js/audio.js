/* jshint esversion: 6 */

// Provides an interface for playing a short tone at a given frequency.

const playNote = (() => {

  // Only initialize the audio context once.
  const audioContext = new AudioContext();

  // Return a function that plays a brief note at the given frequency.
  return (freq) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.02, audioContext.currentTime);
    osc.start();
    osc.stop(audioContext.currentTime + 0.25);
  };
})();
