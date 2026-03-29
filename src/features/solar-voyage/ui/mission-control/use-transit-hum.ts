import { useEffect, useRef } from 'react';

type TransitHumOptions = {
  isMuted: boolean;
  isPlaying: boolean;
};

type TransitHumEngine = {
  context: AudioContext;
  output: GainNode;
};

const ENGINE_HUM_GAIN = 0.035;
const FADE_IN_SECONDS = 0.35;
const FADE_OUT_SECONDS = 0.2;

export function useTransitHum({ isMuted, isPlaying }: TransitHumOptions) {
  const engineRef = useRef<TransitHumEngine | null>(null);

  useEffect(() => {
    if (!isPlaying || isMuted) {
      fadeOutHum(engineRef.current);
      return;
    }

    const engine = engineRef.current ?? createTransitHumEngine();

    if (!engine) {
      return;
    }

    engineRef.current = engine;

    const now = engine.context.currentTime;
    engine.output.gain.cancelScheduledValues(now);
    engine.output.gain.setValueAtTime(engine.output.gain.value, now);
    engine.output.gain.linearRampToValueAtTime(ENGINE_HUM_GAIN, now + FADE_IN_SECONDS);

    void engine.context.resume().catch(() => undefined);
  }, [isMuted, isPlaying]);

  useEffect(() => {
    return () => {
      const engine = engineRef.current;

      if (!engine) {
        return;
      }

      fadeOutHum(engine);
      void engine.context.close().catch(() => undefined);
      engineRef.current = null;
    };
  }, []);
}

function createTransitHumEngine(): TransitHumEngine | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const AudioContextConstructor =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextConstructor) {
    return null;
  }

  const context = new AudioContextConstructor();
  const output = context.createGain();
  output.gain.value = 0;

  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 260;
  filter.Q.value = 0.5;

  const coreOscillator = context.createOscillator();
  coreOscillator.type = 'sawtooth';
  coreOscillator.frequency.value = 58;

  const coreGain = context.createGain();
  coreGain.gain.value = 0.55;

  const overtoneOscillator = context.createOscillator();
  overtoneOscillator.type = 'triangle';
  overtoneOscillator.frequency.value = 116;

  const overtoneGain = context.createGain();
  overtoneGain.gain.value = 0.14;

  const flutterOscillator = context.createOscillator();
  flutterOscillator.type = 'sine';
  flutterOscillator.frequency.value = 0.24;

  const flutterGain = context.createGain();
  flutterGain.gain.value = 0.08;

  coreOscillator.connect(coreGain).connect(filter);
  overtoneOscillator.connect(overtoneGain).connect(filter);
  flutterOscillator.connect(flutterGain).connect(output.gain);
  filter.connect(output).connect(context.destination);

  coreOscillator.start();
  overtoneOscillator.start();
  flutterOscillator.start();

  return { context, output };
}

function fadeOutHum(engine: TransitHumEngine | null) {
  if (!engine) {
    return;
  }

  const now = engine.context.currentTime;
  engine.output.gain.cancelScheduledValues(now);
  engine.output.gain.setValueAtTime(engine.output.gain.value, now);
  engine.output.gain.linearRampToValueAtTime(0, now + FADE_OUT_SECONDS);
}
