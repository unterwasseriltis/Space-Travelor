import { render } from '@testing-library/react';

import { useTransitHum } from '@/features/solar-voyage/ui/mission-control/use-transit-hum';

class MockAudioParam {
  value = 0;
  cancelScheduledValues = vi.fn();
  setValueAtTime = vi.fn((value: number) => {
    this.value = value;
  });
  linearRampToValueAtTime = vi.fn((value: number) => {
    this.value = value;
  });
}

class MockAudioNode {
  connections: unknown[] = [];

  connect(target: unknown) {
    this.connections.push(target);
    return target;
  }
}

class MockGainNode extends MockAudioNode {
  gain = new MockAudioParam();
}

class MockBiquadFilterNode extends MockAudioNode {
  frequency = { value: 0 };
  Q = { value: 0 };
  type = 'lowpass';
}

class MockOscillatorNode extends MockAudioNode {
  frequency = { value: 0 };
  start = vi.fn();
  type = 'sine';
}

const createdContexts: MockAudioContext[] = [];

class MockAudioContext {
  currentTime = 0;
  destination = new MockAudioNode();
  gains: MockGainNode[] = [];
  filters: MockBiquadFilterNode[] = [];
  oscillators: MockOscillatorNode[] = [];
  resume = vi.fn().mockResolvedValue(undefined);
  close = vi.fn().mockResolvedValue(undefined);

  constructor() {
    createdContexts.push(this);
  }

  createBiquadFilter() {
    const filter = new MockBiquadFilterNode();

    this.filters.push(filter);
    return filter as unknown as BiquadFilterNode;
  }

  createGain() {
    const gain = new MockGainNode();

    this.gains.push(gain);
    return gain as unknown as GainNode;
  }

  createOscillator() {
    const oscillator = new MockOscillatorNode();

    this.oscillators.push(oscillator);
    return oscillator as unknown as OscillatorNode;
  }
}

function TransitHumHarness({ isMuted, isPlaying }: { isMuted: boolean; isPlaying: boolean }) {
  useTransitHum({ isMuted, isPlaying });
  return null;
}

describe('useTransitHum', () => {
  beforeEach(() => {
    createdContexts.length = 0;
    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: MockAudioContext,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (window as Window & { AudioContext?: typeof AudioContext }).AudioContext;
  });

  it('routes flutter modulation through the hum gain and keeps mute on a separate output gain', () => {
    render(<TransitHumHarness isMuted={false} isPlaying />);

    const context = createdContexts[0];
    const [hum, output, , , flutter] = context.gains;
    const [filter] = context.filters;

    expect(flutter.connections).toContain(hum.gain);
    expect(flutter.connections).not.toContain(output.gain);
    expect(filter.connections).toContain(hum);
    expect(hum.connections).toContain(output);
    expect(output.connections).toContain(context.destination);
  });

  it('ramps the output gain down to zero when muted during travel', () => {
    const { rerender } = render(<TransitHumHarness isMuted={false} isPlaying />);

    const context = createdContexts[0];
    const [, output] = context.gains;

    rerender(<TransitHumHarness isMuted isPlaying />);

    expect(output.gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(0, 0.2);
  });
});
