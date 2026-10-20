// 🔔 Âm thanh lớp học (Web Audio, không tải tệp) – chép từ app Lớp học số
let AC = null;
export function moAmThanh() { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); AC.resume && AC.resume(); } catch { /* máy không có âm thanh */ } }
export function beep(freq = 1047, dur = 0.35, vol = 0.35, delay = 0, type = 'sine') {
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + delay;
    o.type = type; o.frequency.value = freq; o.connect(g); g.connect(AC.destination);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o.stop(t + dur + 0.05);
  } catch { /* bỏ qua */ }
}
export const ting = () => beep(1319, 0.5);
export const fanfare = () => [523, 659, 784, 1047].forEach((f, i) => beep(f, i === 3 ? 0.6 : 0.16, 0.4, i * 0.11, 'triangle'));
export const ring3 = () => [0, 0.45, 0.9].forEach(d => { beep(1047, 0.35, 0.4, d); beep(1319, 0.35, 0.3, d + 0.12); });
