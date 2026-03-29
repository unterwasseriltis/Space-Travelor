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
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('starts a mission and shows navigation controls', async () => {
    const user = userEvent.setup();

    render(<MissionControl backgroundImage="/background.jpg" />);

    await user.click(screen.getByRole('button', { name: /neue mission/i }));

    expect(screen.getByText(/willkommen an bord/i)).toBeInTheDocument();
    expect(screen.getByText(/platzhalter fuer ein grosses willkommensbild/i)).toBeInTheDocument();

    await closeWelcomeDialog(user);
    expect(screen.getByRole('heading', { name: /^navigation$/i })).toBeInTheDocument();
    expect(screen.getByText(/aktuelle koordinaten/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /audio stummschalten/i })).toBeInTheDocument();
  });

  it('starts a trip and shows the transit countdown', async () => {
    const user = userEvent.setup();

    render(<MissionControl backgroundImage="/background.jpg" />);

    await user.click(screen.getByRole('button', { name: /neue mission/i }));
    await closeWelcomeDialog(user);
    await user.click(screen.getByRole('button', { name: /starten/i }));

    expect(screen.getByText(/ankunft in/i)).toBeInTheDocument();
    expect(screen.getByText('1:00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /abbrechen/i })).toBeInTheDocument();
  });

  it('keeps the ship centered while minimap zoom changes', async () => {
    const user = userEvent.setup();

    render(<MissionControl backgroundImage="/background.jpg" />);

    await user.click(screen.getByRole('button', { name: /neue mission/i }));
    await closeWelcomeDialog(user);

    const shipMarker = screen.getByTestId('minimap-ship');
    const marsMarker = screen.getByTestId('minimap-body-Mars');
    const zoomSlider = screen.getByRole('slider', { name: /zoom der minikarte/i });

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

    await user.click(screen.getByRole('button', { name: /mission laden/i }));

    expect(screen.getByRole('heading', { name: /^navigation$/i })).toBeInTheDocument();
    expect(screen.getByText('00:00:42')).toBeInTheDocument();
  });

  it('renders all element slots and activates the hydrogen refill slot', async () => {
    const user = userEvent.setup();
    const savedState = {
      ...createInitialGameState(),
      phase: 'mission' as const,
      resources: {
        ...createInitialGameState().resources,
        hydrogen: 100,
      },
      ship: {
        ...createInitialGameState().ship,
        fuel: 90,
      },
    };

    localStorage.setItem(GAME_STATE_STORAGE_KEY, serializeGameStateSnapshot(savedState));

    render(<MissionControl backgroundImage="/background.jpg" />);

    await user.click(screen.getByRole('button', { name: /mission laden/i }));
    await user.click(screen.getByRole('button', { name: /wasserstoff-slot aktivieren/i }));

    expect(screen.getAllByRole('button', { name: /-slot aktivieren/i })).toHaveLength(14);
    expect(screen.getByText('95 / 100')).toBeInTheDocument();
    expect(
      within(screen.getByTestId('equipment-slot-hydrogen')).getByText(/bestand: 0/i),
    ).toBeInTheDocument();
  });

  it('opens the crafting window and crafts the mining laser into inventory slot 1', async () => {
    const user = userEvent.setup();
    const initialState = createInitialGameState();
    const savedState = {
      ...initialState,
      phase: 'mission' as const,
      resources: {
        ...initialState.resources,
        carbon: 100,
        magnesium: 100,
        sodium: 100,
      },
    };

    localStorage.setItem(GAME_STATE_STORAGE_KEY, serializeGameStateSnapshot(savedState));

    render(<MissionControl backgroundImage="/background.jpg" />);

    await user.click(screen.getByRole('button', { name: /mission laden/i }));
    await user.click(screen.getByRole('button', { name: /fertigung oeffnen/i }));
    await user.click(screen.getByRole('button', { name: /mining-laser herstellen/i }));

    expect(
      screen.getByRole('button', { name: /mining-laser im inventar einsetzen/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/bestand in slot 1 liegt jetzt bei 1/i)).toBeInTheDocument();
  });

  it('uses a crafted shield booster from inventory', async () => {
    const user = userEvent.setup();
    const initialState = createInitialGameState();
    const savedState = {
      ...initialState,
      inventorySlots: [
        { count: 0, item: 'miningLaser' },
        { count: 1, item: 'shieldBooster' },
        { count: 0, item: 'scannerModule' },
      ],
      phase: 'mission' as const,
      ship: {
        ...initialState.ship,
        shields: 70,
      },
    };

    localStorage.setItem(GAME_STATE_STORAGE_KEY, serializeGameStateSnapshot(savedState));

    render(<MissionControl backgroundImage="/background.jpg" />);

    await user.click(screen.getByRole('button', { name: /mission laden/i }));
    await user.click(screen.getByRole('button', { name: /schild-booster im inventar einsetzen/i }));

    expect(screen.getByText('90%')).toBeInTheDocument();
    expect(screen.getByText(/schild-booster eingesetzt/i)).toBeInTheDocument();
  });

  it('switches the resource panel to special resources', async () => {
    const user = userEvent.setup();

    render(<MissionControl backgroundImage="/background.jpg" />);

    await user.click(screen.getByRole('button', { name: /neue mission/i }));
    await closeWelcomeDialog(user);
    await user.click(screen.getByRole('button', { name: /spezialressourcen anzeigen/i }));

    expect(screen.getByText(/roherze/i)).toBeInTheDocument();
    expect(screen.getByText(/diamanten/i)).toBeInTheDocument();
    expect(screen.getByText(/plasma/i)).toBeInTheDocument();
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

    await user.click(screen.getByRole('button', { name: /neue mission/i }));
    await closeWelcomeDialog(user);
    await user.click(screen.getByRole('button', { name: /einstellungen oeffnen/i }));
    await user.click(screen.getByRole('button', { name: /^exportieren$/i }));

    await waitFor(() => {
      expect(clipboardWriteText).toHaveBeenCalledWith(
        expect.stringContaining('"phase": "mission"'),
      );
    });

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(anchorClick).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText(/zwischenablage kopiert und als json heruntergeladen/i),
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

    await user.click(screen.getByRole('button', { name: /einstellungen oeffnen/i }));
    await user.upload(screen.getByLabelText(/speicherdatei importieren/i), saveFile);

    expect(screen.getByRole('heading', { name: /^navigation$/i })).toBeInTheDocument();
    expect(screen.getByText('00:00:07')).toBeInTheDocument();
    expect(
      screen.getByText(/"mission-save\.json" wurde erfolgreich importiert\./i),
    ).toBeInTheDocument();
  });

  it('autosaves the active mission every 5 seconds', async () => {
    render(<MissionControl backgroundImage="/background.jpg" />);

    fireEvent.click(screen.getByRole('button', { name: /neue mission/i }));
    fireEvent.click(screen.getByRole('button', { name: /los geht/i }));

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

  it('opens an arrival dialog when the ship reaches its destination', () => {
    vi.useFakeTimers();

    render(<MissionControl backgroundImage="/background.jpg" />);

    fireEvent.click(screen.getByRole('button', { name: /neue mission/i }));
    fireEvent.click(screen.getByRole('button', { name: /los geht/i }));
    fireEvent.click(screen.getByRole('button', { name: /starten/i }));

    act(() => {
      vi.advanceTimersByTime(60000);
    });

    expect(screen.getByText(/willkommen auf dem mond\./i)).toBeInTheDocument();
    expect(screen.getByText(/mond kolonie/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /die lokale flugkontrolle hat die ankunft der space travelor bereits bestaetigt/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByAltText(/kolonie-kontakt platzhalter fuer mond/i)).toBeInTheDocument();
    expect(screen.getByAltText(/ankunftsansicht platzhalter fuer mond/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /schliessen/i }));

    expect(screen.queryByText(/willkommen auf dem mond\./i)).not.toBeInTheDocument();
  });

  it('toggles the speaker button state', async () => {
    const user = userEvent.setup();

    render(<MissionControl backgroundImage="/background.jpg" />);

    const muteButton = screen.getByRole('button', { name: /audio stummschalten/i });

    await user.click(muteButton);
    expect(screen.getByRole('button', { name: /audio aktivieren/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /audio aktivieren/i }));
    expect(screen.getByRole('button', { name: /audio stummschalten/i })).toBeInTheDocument();
  });

  it('can abort a trip and keeps the ship at its current coordinates', () => {
    vi.useFakeTimers();

    render(<MissionControl backgroundImage="/background.jpg" />);

    fireEvent.click(screen.getByRole('button', { name: /neue mission/i }));
    fireEvent.click(screen.getByRole('button', { name: /los geht/i }));
    fireEvent.click(screen.getByRole('button', { name: /starten/i }));

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    const coordinatesBeforeAbort = screen.getByText(/x:/i).textContent;

    fireEvent.click(screen.getByRole('button', { name: /abbrechen/i }));

    expect(screen.getByText(/tiefer weltraum/i)).toBeInTheDocument();
    expect(screen.queryByText(/ankunft in/i)).not.toBeInTheDocument();
    expect(screen.getByText(/flug abgebrochen/i)).toBeInTheDocument();
    expect(screen.getByText(coordinatesBeforeAbort ?? '')).toBeInTheDocument();
  });
});

async function closeWelcomeDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /los geht/i }));
}
