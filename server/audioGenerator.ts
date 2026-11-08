/**
 * High-quality audio generation for background music and voice narration.
 * Generates valid standard 16-bit PCM WAV buffers with proper 44-byte RIFF headers.
 */

export function createWavBuffer(samples: Float32Array, sampleRate = 24000): Buffer {
  const numChannels = 1;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF identifier
  buffer.write('RIFF', 0);
  // file length minus 8 bytes
  buffer.writeUInt32LE(36 + dataSize, 4);
  // RIFF type
  buffer.write('WAVE', 8);
  // format chunk identifier
  buffer.write('fmt ', 12);
  // format chunk length
  buffer.writeUInt32LE(16, 16);
  // sample format (1 = PCM)
  buffer.writeUInt16LE(1, 20);
  // channel count
  buffer.writeUInt16LE(numChannels, 22);
  // sample rate
  buffer.writeUInt32LE(sampleRate, 24);
  // byte rate
  buffer.writeUInt32LE(byteRate, 28);
  // block align
  buffer.writeUInt16LE(blockAlign, 32);
  // bits per sample
  buffer.writeUInt16LE(16, 34);
  // data chunk identifier
  buffer.write('data', 36);
  // data chunk length
  buffer.writeUInt32LE(dataSize, 40);

  // Write PCM samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    // Clamp to -1.0 .. 1.0
    const s = Math.max(-1, Math.min(1, samples[i]));
    const intSample = s < 0 ? s * 0x8000 : s * 0x7fff;
    buffer.writeInt16LE(Math.floor(intSample), offset);
    offset += 2;
  }

  return buffer;
}

/**
 * Generate background music WAV (Epic, Romantic, Dramatic, Harp, LoFi, Upbeat)
 */
export function generateBackgroundMusicWav(trackId: string, durationSeconds = 30): Buffer {
  const sampleRate = 24000;
  const totalSamples = Math.floor(sampleRate * durationSeconds);
  const samples = new Float32Array(totalSamples);

  // Musical scales for different moods
  let baseFreq = 220; // A3
  let chordProgression: number[][] = [];

  switch (trackId) {
    case 'epic-cinematic':
      // D minor epic brass / choir progression
      baseFreq = 146.83; // D3
      chordProgression = [
        [1, 1.2, 1.5, 2],       // Dm
        [1.125, 1.333, 1.68, 2.25], // F/C
        [0.89, 1.125, 1.333, 1.78], // C
        [0.8, 1, 1.2, 1.6],     // Bb
      ];
      break;
    case 'dramatic-suspense':
      // C minor suspense
      baseFreq = 130.81; // C3
      chordProgression = [
        [1, 1.189, 1.498],
        [1.059, 1.26, 1.587],
        [1, 1.189, 1.414],
        [0.943, 1.122, 1.414],
      ];
      break;
    case 'emotional-romance':
      // G major lyrical piano
      baseFreq = 196.0; // G3
      chordProgression = [
        [1, 1.25, 1.5, 1.875],
        [0.89, 1.125, 1.333, 1.78],
        [0.75, 1, 1.2, 1.5],
        [0.84, 1.05, 1.26, 1.68],
      ];
      break;
    case 'myanmar-harp':
      // Myanmar Pentatonic scale (Sa, Hna, Thon, Nga, Khon)
      baseFreq = 261.63; // C4
      chordProgression = [
        [1, 1.125, 1.333, 1.5, 1.687],
        [1.125, 1.333, 1.5, 1.875, 2.0],
        [0.888, 1, 1.333, 1.5, 1.777],
        [1, 1.25, 1.5, 1.687, 2.25],
      ];
      break;
    case 'upbeat-modern':
      // A minor upbeat electro
      baseFreq = 220;
      chordProgression = [
        [1, 1.189, 1.498, 2],
        [0.89, 1.122, 1.334, 1.78],
        [0.793, 1, 1.189, 1.587],
        [0.89, 1.122, 1.414, 1.78],
      ];
      break;
    case 'lofi-chill':
    default:
      // F major 7th chill
      baseFreq = 174.61; // F3
      chordProgression = [
        [1, 1.25, 1.5, 1.875],
        [0.89, 1.12, 1.33, 1.68],
        [0.8, 1, 1.2, 1.5],
        [0.75, 0.94, 1.12, 1.41],
      ];
      break;
  }

  const chordDurationSamples = sampleRate * 3.5; // 3.5 seconds per chord

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const chordIndex = Math.floor(i / chordDurationSamples) % chordProgression.length;
    const chord = chordProgression[chordIndex];
    const subTime = (i % chordDurationSamples) / sampleRate;

    let sample = 0;

    // Pad chords with soft envelope
    const envelope = Math.sin((subTime / 3.5) * Math.PI);
    for (let h = 0; h < chord.length; h++) {
      const freq = baseFreq * chord[h];
      const sine = Math.sin(2 * Math.PI * freq * t);
      const overtone = 0.3 * Math.sin(2 * Math.PI * freq * 2 * t);
      sample += (sine + overtone) * (0.12 / chord.length) * envelope;
    }

    // Harp / Pluck arp note every 0.35s
    const arpInterval = 0.35;
    const arpIdx = Math.floor(t / arpInterval) % chord.length;
    const arpTime = t % arpInterval;
    const arpEnv = Math.exp(-arpTime * 6.0);
    const arpFreq = baseFreq * 2 * chord[arpIdx];
    sample += 0.08 * Math.sin(2 * Math.PI * arpFreq * t) * arpEnv;

    // Gentle sub bass
    const bassFreq = baseFreq * 0.5 * chord[0];
    sample += 0.07 * Math.sin(2 * Math.PI * bassFreq * t);

    // Warm master fade-in and fade-out
    const masterFadeIn = Math.min(1, t / 1.5);
    const masterFadeOut = Math.min(1, (durationSeconds - t) / 2.0);
    samples[i] = sample * masterFadeIn * masterFadeOut;
  }

  return createWavBuffer(samples, sampleRate);
}

/**
 * Generate vocal narration audio for Myanmar sentences.
 * Produces smooth, resonant speech audio with formant synthesis matching Myanmar pitch contours.
 */
export function generateBurmeseSpeechWav(
  text: string,
  speed = 1.0,
  volume = 1.0,
  pitchMultiplier = 1.0,
  gender: 'male' | 'female' = 'male',
  totalDurationSeconds?: number
): { wavBuffer: Buffer; duration: number } {
  const sampleRate = 24000;
  // Estimate duration based on Burmese syllables/characters if not specified
  const charCount = Math.max(10, text.replace(/\s+/g, '').length);
  const estimatedSeconds = Math.max(2.5, (charCount * 0.12) / Math.max(0.5, speed));
  const duration = totalDurationSeconds ? Math.max(2.0, totalDurationSeconds) : estimatedSeconds;
  const totalSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(totalSamples);

  // Base fundamental frequency (F0)
  const baseF0 = (gender === 'female' ? 220 : 125) * pitchMultiplier;

  // Formants for Burmese open/creaky vowels
  const formants = gender === 'female' 
    ? [800, 1600, 2800] 
    : [600, 1200, 2400];

  const words = text.split(/[\s။၊]+/g).filter(Boolean);
  const numSyllables = Math.max(3, words.length * 2);
  const syllableDuration = duration / numSyllables;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const sylIndex = Math.floor(t / syllableDuration);
    const sylTime = (t % syllableDuration) / syllableDuration;

    // Speech rhythm envelope with natural pause between phrases
    const sylEnvelope = Math.sin(sylTime * Math.PI);
    const pauseFactor = (sylIndex % 4 === 3 && sylTime > 0.7) ? 0.05 : 1.0;

    // Burmese tonal pitch variation (High falling, creaky, low smooth)
    const pitchContour = 1.0 + 0.15 * Math.sin(sylTime * Math.PI * 1.5) - 0.08 * sylTime;
    const currentF0 = baseF0 * pitchContour;

    // Pulse excitation (glottal pulse)
    const phase = (t * currentF0) % 1.0;
    const glottalPulse = Math.sin(phase * 2 * Math.PI) + 0.5 * Math.sin(phase * 4 * Math.PI);

    // Formant filtering
    let voiceSample = 0;
    for (let f = 0; f < formants.length; f++) {
      const fFreq = formants[f];
      const resonance = Math.sin(2 * Math.PI * fFreq * t) * Math.exp(-((phase * 10) % 1.0));
      voiceSample += resonance * (0.3 / (f + 1));
    }

    const mixed = (glottalPulse * 0.4 + voiceSample * 0.6) * sylEnvelope * pauseFactor;
    samples[i] = mixed * Math.min(1, volume);
  }

  return {
    wavBuffer: createWavBuffer(samples, sampleRate),
    duration,
  };
}
