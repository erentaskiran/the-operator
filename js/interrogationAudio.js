import './interrogationSound.js';

function hasWord(text, words) {
  const normalized = String(text || '').toLowerCase();
  return words.some((w) => normalized.includes(w));
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function clamp100(v) {
  return Math.max(0, Math.min(100, v));
}

function mapMechanicLevel(value, table) {
  return table[String(value || '').toUpperCase()] || 0;
}

function stressFromEvidence(evidence) {
  const hr = mapMechanicLevel(evidence.heartRate, {
    STABLE: 0,
    BASELINE: 0,
    RISE: 0.22,
    INCREASE: 0.28,
    SPIKE: 0.5,
    MAX_SPIKE: 0.75,
    DROP: -0.18,
  });
  const gsr = mapMechanicLevel(evidence.gsr, {
    BASELINE: 0,
    DECREASE: -0.18,
    INCREASE: 0.24,
    SPIKE: 0.44,
    SURGE: 0.58,
    MAX: 0.72,
  });
  const eeg = mapMechanicLevel(evidence.eeg, {
    BASELINE: 0,
    FOCUSED: 0.05,
    ERRATIC: 0.36,
    CHAOTIC: 0.6,
    FLATLINE: 0.7,
  });
  return clamp01(0.45 * hr + 0.3 * gsr + 0.25 * eeg + 0.25);
}

function parseDialogueSignals(evidence) {
  const q = String(evidence.question || '').toLowerCase();
  const a = String(evidence.answer || '').toLowerCase();
  const type = String(evidence.choiceType || '').toUpperCase();

  let fear = 0;
  let excitement = 0;

  if (hasWord(a, ['itiraf', 'tamam', 'okudum', 'sildim', 'bilmiyorum', 'yalan'])) fear += 0.28;
  if (hasWord(a, ['avukat', 'cevap vermeyecegim', 'tehdit', 'kabul etmiyorum'])) fear += 0.18;
  if (hasWord(a, ['nefes', 'yikildim', 'titri', 'agla', 'cocuk', 'aile'])) excitement += 0.2;
  if (hasWord(q, ['kim yapti', 'kanit', 'log', 'e-imza', 'rapor', 'sahtecilik'])) fear += 0.24;

  if (type === 'AGGRESSIVE' || type === 'LEGAL_THREAT') fear += 0.16;
  if (type === 'EMPATHIC') excitement += 0.2;
  if (type === 'TRAP' || type === 'FORENSIC_CALL_OUT' || type === 'NARROW_TARGET') {
    fear += 0.22;
    excitement += 0.08;
  }

  if ((evidence.fearDelta || 0) > 18) fear += 0.18;
  if ((evidence.fearDelta || 0) < -8) {
    fear -= 0.18;
    excitement -= 0.1;
  }

  return {
    fear: clamp01(fear),
    excitement: clamp01(excitement),
  };
}

let scene = null;
let available = true;

function ensureScene() {
  if (!available) return null;
  if (scene) return scene;

  const Ctor = globalThis.InterrogationSound;
  if (!Ctor) {
    available = false;
    return null;
  }

  scene = new Ctor({
    volume: 0.52,
    mood: 'tense',
    tension: 10,
    autoEvents: true,
    eventInterval: [3200, 8200],
  });

  scene.toggleLayer('air', false);
  scene.setLayer('room', 42);
  scene.setLayer('radio', 10);
  scene.setLayer('drone', 48);
  scene.setLayer('rumble', 28);
  scene.setLayer('pulse', 16);
  return scene;
}

export function enterInterrogationAudio() {
  const s = ensureScene();
  if (!s) return;
  s.play();
  s.setMood('tense');
  s.setMod('calm', 0);
  s.setTension(10);
}

export function stopInterrogationAudio() {
  if (!scene) return;
  scene.stop();
}

export function applyAmbientProfile(profile) {
  const s = ensureScene();
  if (!s) return;
  s.play();

  if (profile === 'title') {
    s.setMood('cold');
    s.setMod('calm', 0);
    s.setTension(6);
    s.setVolume(38);
    s.setLayer('room', 46);
    s.setLayer('drone', 34);
    s.setLayer('organ', 18);
    s.setLayer('rumble', 8);
    s.setLayer('radio', 0);
    s.setLayer('pulse', 0);
    s.toggleLayer('air', false);
    return;
  }

  if (profile === 'menu') {
    s.setMood('cold');
    s.setMod('calm', 0);
    s.setTension(12);
    s.setVolume(44);
    s.setLayer('room', 44);
    s.setLayer('drone', 40);
    s.setLayer('organ', 24);
    s.setLayer('rumble', 12);
    s.setLayer('radio', 8);
    s.setLayer('pulse', 8);
    s.toggleLayer('air', false);
    return;
  }

  if (profile === 'verdict') {
    s.setMood('breaking');
    s.setMod('both', 42);
    s.setTension(58);
    s.setVolume(52);
    s.setLayer('room', 28);
    s.setLayer('drone', 68);
    s.setLayer('rumble', 62);
    s.setLayer('pulse', 42);
    s.setLayer('clock', 58);
    s.trigger('clock');
    s.trigger('pulse');
    return;
  }

  if (profile === 'result-good') {
    s.setMood('reveal');
    s.setMod('excited', 20);
    s.setTension(24);
    s.setVolume(46);
    s.setLayer('piano', 72);
    s.setLayer('organ', 42);
    s.setLayer('room', 36);
    s.setLayer('rumble', 18);
    s.setLayer('pulse', 10);
    return;
  }

  if (profile === 'result-bad') {
    s.setMood('silent');
    s.setMod('afraid', 34);
    s.setTension(30);
    s.setVolume(46);
    s.setLayer('room', 54);
    s.setLayer('drone', 44);
    s.setLayer('organ', 18);
    s.setLayer('piano', 20);
    s.setLayer('radio', 10);
    s.trigger('metal');
  }
}

export function applyNodeAtmosphere(node) {
  const s = ensureScene();
  if (!s || !node) return;

  const text = `${node.theme || ''} ${node.description || ''}`.toLowerCase();
  let mood = 'tense';
  let tension = 18;

  if (hasWord(text, ['sogutma', 'ilk temas', 'baseline'])) {
    mood = 'cold';
    tension = 14;
  }
  if (hasWord(text, ['kagit', 'alarm', 'teknik', 'forensic', 'silinen', 'celiski'])) {
    mood = 'tense';
    tension = 32;
  }
  if (hasWord(text, ['surgun', 'itiraf', 'breakdown', 'kilitlenme'])) {
    mood = 'breaking';
    tension = 55;
  }
  if (hasWord(text, ['camli vitrin', 'success', 'verdict'])) {
    mood = 'reveal';
    tension = 28;
  }
  if (hasWord(text, ['fail'])) {
    mood = 'silent';
    tension = 12;
  }

  s.setMood(mood);
  s.setTension(tension);
}

export function applyDialogueAudio(evidence, fearBar, maxFearBar) {
  const s = ensureScene();
  if (!s || !evidence) return;

  const pressure = stressFromEvidence(evidence);
  const signal = parseDialogueSignals(evidence);
  const fearRatio = maxFearBar > 0 ? clamp01(fearBar / maxFearBar) : 0;

  const fearScore = clamp01(pressure * 0.62 + signal.fear * 0.38 + fearRatio * 0.2);
  const excitementScore = clamp01(
    pressure * 0.35 + signal.excitement * 0.65 + Math.max(0, evidence.fearDelta || 0) / 90
  );

  let mod = 'calm';
  if (fearScore > 0.55 && excitementScore > 0.45) mod = 'both';
  else if (fearScore > excitementScore + 0.08) mod = 'afraid';
  else if (excitementScore > 0.38) mod = 'excited';

  const intensity = clamp100(
    18 +
      fearRatio * 34 +
      pressure * 32 +
      Math.max(fearScore, excitementScore) * 26 +
      (evidence.fearDelta || 0) * 0.6
  );

  s.setMod(mod, intensity);
  s.setModIntensity(intensity);

  if (evidence.fearDelta >= 25 || pressure >= 0.72) {
    s.trigger('slam');
    s.trigger('metal');
  } else if (evidence.fearDelta >= 14 || fearScore >= 0.62) {
    s.trigger('chair');
  }

  if (excitementScore >= 0.58) {
    s.trigger('clock');
    s.trigger('pulse');
  }

  if (mod === 'both' && intensity > 74) {
    s.trigger('radio');
    s.setLayer('room', 26);
    s.setLayer('drone', 74);
    s.setLayer('rumble', 78);
  } else {
    s.setLayer('room', 44 - fearRatio * 10);
    s.setLayer('drone', 46 + fearRatio * 18);
    s.setLayer('rumble', 26 + fearRatio * 20);
  }
}
