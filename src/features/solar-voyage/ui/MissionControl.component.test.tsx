import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  deserializeGameStateSnapshot,
  serializeGameStateSnapshot,
  GAME_STATE_STORAGE_KEY,
} from '@/features/solar-voyage/model/game-persistence';
import { createInitialGameState } from '@/features/solar-voyage/model/game-state';
import { MissionControl } from '@/features/solar-voyage/ui/MissionControl';

describe('MissionControl component', () => {
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', {
      configurable: true,
      value: () => false,
    });
    Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('starts a mission and shows navigation controls', async () => {
    const user = userEvent.setup();

    render(<MissionControl backgroundImage="/background.jpg" />);

    await user.click(screen.getByRole('button', { name: /new mission/i }));

    expect(screen.getByText(/navigation/i)).toBeInTheDocument();
    expect(screen.getByText(/current coordinates/i)).toBeInTheDocument();
  });

  it('starts a trip and shows the transit countdown', async () => {
    const user = userEvent.setup();

    render(<MissionControl backgroundImage="/background.jpg" />);

    await user.click(screen.getByRole('button', { name: /new mission/i }));
    await user.click(screen.getByRole('button', { name: /accelerate/i }));

    expect(screen.getByText(/transit countdown/i)).toBeInTheDocument();
    expect(screen.getByText('1:00')).toBeInTheDocument();
  });

  it('keeps the ship centered while minimap zoom changes', async () => {
    const user = userEvent.setup();

    render(<MissionControl backgroundImage="/background.jpg" />);

    await user.click(screen.getByRole('button', { name: /new mission/i }));

    const shipMarker = screen.getByTestId('minimap-ship');
    const marsMarker = screen.getByTestId('minimap-body-Mars');
    const zoomSlider = screen.getByRole('slider', { name: /minimap zoom/i });

    expect(shipMarker).toHaveStyle({ left: '50%', top: '50%' });

    const initialMarsLeft = marsMarker.style.left;
    fireEvent.change(zoomSlider, { target: { value: '100' } });

    expect(shipMarker).toHaveStyle({ left: '50%', top: '50%' });
    expect(screen.getByTestId('minimap-zoom-value')).toHaveTextContent('25000%');
    expect(marsMarker.style.left).not.toBe(initialMarsLeft);
  });

  it('loads an autosaved mission from local storage', async () => {
    const user = userEvent.setup();
    const savedState = {
      ...createInitialGameState(),
      missionElapsedSeconds: 42,
      phase: 'mission' as const,
    };

    localStorage.setItem(GAME_STATE_STORAGE_KEY, serializeGameStateSnapshot(savedState));

    render(<MissionControl backgroundImage="/background.jpg" />);

    await user.click(screen.getByRole('button', { name: /load mission/i }));

    expect(screen.getByText(/navigation/i)).toBeInTheDocument();
    expect(screen.getByText('00:00:42')).toBeInTheDocument();
  });

  it('exports the current mission snapshot from the settings dialog', async () => {
    const user = userEvent.setup();
    const clipboardWriteText = vi.fn().mockResolvedValue(undefined);
    const createObjectURL = vi.fn(() => 'blob:save-file');
    const revokeObjectURL = vi.fn();
    const anchorClick = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: clipboardWriteText },
    });
    vi.spyOn(window.URL, 'createObjectURL').mockImplementation(createObjectURL);
    vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(revokeObjectURL);

    render(<MissionControl backgroundImage="/background.jpg" />);

    await user.click(screen.getByRole('button', { name: /new mission/i }));
    await user.click(screen.getByRole('button', { name: /open settings/i }));
    await user.click(screen.getByRole('button', { name: /^export$/i }));

    await waitFor(() => {
      expect(clipboardWriteText).toHaveBeenCalledWith(
        expect.stringContaining('"phase": "mission"'),
      );
    });

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(anchorClick).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText(/current snapshot copied to the clipboard and downloaded as json/i),
    ).toBeInTheDocument();
  });

  it('imports a save file from the settings dialog', async () => {
    const user = userEvent.setup();
    const importedState = {
      ...createInitialGameState(),
      missionElapsedSeconds: 7,
      phase: 'mission' as const,
    };
    const saveFile = new File([serializeGameStateSnapshot(importedState)], 'mission-save.json', {
      type: 'application/json',
    });

    render(<MissionControl backgroundImage="/background.jpg" />);

    await user.click(screen.getByRole('button', { name: /open settings/i }));
    await user.upload(screen.getByLabelText(/import save file/i), saveFile);

    expect(screen.getByText(/navigation/i)).toBeInTheDocument();
    expect(screen.getByText('00:00:07')).toBeInTheDocument();
    expect(screen.getByText(/imported "mission-save\.json" successfully\./i)).toBeInTheDocument();
  });

  it('autosaves the active mission every 5 seconds', async () => {
    render(<MissionControl backgroundImage="/background.jpg" />);

    fireEvent.click(screen.getByRole('button', { name: /new mission/i }));

    expect(screen.getByText('00:00:00')).toBeInTheDocument();

    await waitFor(
      () => {
        expect(screen.getByText('00:00:06')).toBeInTheDocument();
      },
      { timeout: 7000 },
    );

    await act(async () => {
      await Promise.resolve();
    });

    const savedSnapshot = localStorage.getItem(GAME_STATE_STORAGE_KEY);
    const restoredSnapshot = deserializeGameStateSnapshot(savedSnapshot ?? '');

    expect(savedSnapshot).toBeTruthy();
    expect(restoredSnapshot.missionElapsedSeconds).toBeGreaterThanOrEqual(5);
  }, 10000);

  it('renders equipment bays and allows unlocking and installing modules through the UI', async () => {
    const user = userEvent.setup();
    const savedState = {
      ...createInitialGameState(),
      phase: 'mission' as const,
      resources: {
        ...createInitialGameState().resources,
        aluminium: 4,
        carbon: 8,
        hydrogen: 1,
      },
    };

    localStorage.setItem(GAME_STATE_STORAGE_KEY, serializeGameStateSnapshot(savedState));

    render(<MissionControl backgroundImage="/background.jpg" />);

    await user.click(screen.getByRole('button', { name: /load mission/i }));

    expect(screen.getByTestId('equipment-panel')).toBeInTheDocument();
    expect(screen.getAllByTestId(/equipment-slot-/i)).toHaveLength(10);

    const propulsionSlot = screen.getByTestId('equipment-slot-propulsion-alpha');
    await user.click(within(propulsionSlot).getByRole('button', { name: /install wasserstoff/i }));
    expect(within(propulsionSlot).getByText(/wasserstoff/i)).toBeInTheDocument();

    const lockedSlot = screen.getByTestId('equipment-slot-universal-beta');
    await user.click(within(lockedSlot).getByRole('button', { name: /unlock/i }));
    expect(within(lockedSlot).getByText(/empty bay/i)).toBeInTheDocument();
  });
});
