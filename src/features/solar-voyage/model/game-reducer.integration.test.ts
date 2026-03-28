import { gameReducer } from '@/features/solar-voyage/model/game-reducer';
import { createInitialGameState } from '@/features/solar-voyage/model/game-state';

describe('gameReducer integration', () => {
  it('ignores mission and travel ticks when those systems are inactive', () => {
    const initialState = createInitialGameState();

    expect(gameReducer(initialState, { type: 'mission/ticked' })).toEqual(initialState);
    expect(gameReducer(initialState, { type: 'travel/ticked' })).toEqual(initialState);
  });

  it('refuses to start travel to the current location', () => {
    let state = createInitialGameState();

    state = gameReducer(state, { type: 'mission/started' });
    state = gameReducer(state, { type: 'destination/selected', destination: 'Erde' });
    state = gameReducer(state, { type: 'travel/started' });

    expect(state.travel).toBeNull();
    expect(state.notification).toBe('Choose a new destination before accelerating.');
  });

  it('starts a mission and completes travel to the moon', () => {
    let state = createInitialGameState();

    state = gameReducer(state, { type: 'mission/started' });
    expect(state.phase).toBe('mission');

    state = gameReducer(state, { type: 'destination/selected', destination: 'Mond' });
    state = gameReducer(state, { type: 'travel/started' });
    expect(state.travel).not.toBeNull();

    while (state.travel) {
      state = gameReducer(state, { type: 'travel/ticked' });
    }

    expect(state.currentLocation).toBe('Mond');
    expect(state.resources.hydrogen).toBeGreaterThanOrEqual(0);
    expect(state.notification).toContain('Arrival confirmed');
    expect(state.selectedDestination).toBe('Erde');
  });

  it('clears notifications without mutating the rest of the state', () => {
    const initialState = createInitialGameState();
    const stateWithNotification = {
      ...initialState,
      notification: 'Test notification',
    };

    expect(gameReducer(stateWithNotification, { type: 'notification/cleared' })).toEqual({
      ...initialState,
      notification: null,
    });
  });
});
