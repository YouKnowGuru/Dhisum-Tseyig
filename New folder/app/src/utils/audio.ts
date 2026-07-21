/**
 * Web Audio API synthesizer for notification sounds.
 * Synthesizes sound in real-time, eliminating the need for loaded audio assets.
 */
export function playNotificationChime(type: 'success' | 'error' | 'info' | 'pos' = 'info') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    if (type === 'success') {
      // Quick ascending major triad (C5, E5, G5)
      const playChime = (freq: number, startOffset: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + startOffset);
        gain.gain.setValueAtTime(0.1, now + startOffset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + startOffset + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + startOffset);
        osc.stop(now + startOffset + dur);
      };
      playChime(523.25, 0, 0.3); // C5
      playChime(659.25, 0.1, 0.3); // E5
      playChime(783.99, 0.2, 0.4); // G5
      
    } else if (type === 'error') {
      // Low dissonant double beep
      const playBeep = (freq: number, startOffset: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + startOffset);
        gain.gain.setValueAtTime(0.05, now + startOffset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + startOffset + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + startOffset);
        osc.stop(now + startOffset + 0.2);
      };
      playBeep(200, 0);
      playBeep(200, 0.15);
      
    } else if (type === 'pos') {
      // Premium ascending sparkly arpeggio using soft sine waves
      const playTone = (freq: number, startOffset: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + startOffset);
        gain.gain.setValueAtTime(0.08, now + startOffset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + startOffset + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + startOffset);
        osc.stop(now + startOffset + dur);
      };
      playTone(523.25, 0, 0.25);     // C5
      playTone(659.25, 0.06, 0.25);  // E5
      playTone(783.99, 0.12, 0.25);  // G5
      playTone(1046.50, 0.18, 0.40); // C6 (sweet top note)
      
    } else {
      // Default info dual-chime
      const playChime = (frequency: number, startOffset: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, now + startOffset);
        gain.gain.setValueAtTime(0.15, now + startOffset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + startOffset + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + startOffset);
        osc.stop(now + startOffset + duration);
      };
      playChime(783.99, 0, 0.4);
      playChime(1046.50, 0.08, 0.5);
    }
  } catch (e) {
    console.warn('Audio play failed:', e);
  }
}
