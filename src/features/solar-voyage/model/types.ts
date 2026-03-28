import { BodyName } from '@/features/solar-voyage/domain/solar-system';

export type GamePhase = 'menu' | 'mission';

export type ResourceState = {
  hydrogen: number;
  helium: number;
  lithium: number;
};

export type ShipState = {
  hull: number;
  shields: number;
};

export type TravelState = {
  origin: BodyName;
  target: BodyName;
  totalSeconds: number;
  remainingSeconds: number;
  distanceKm: number;
  earnedHydrogen: number;
};

export type GameState = {
  phase: GamePhase;
  currentLocation: BodyName;
  missionElapsedSeconds: number;
  selectedDestination: BodyName | '';
  ship: ShipState;
  resources: ResourceState;
  travel: TravelState | null;
  notification: string | null;
};

export type GameAction =
  | { type: 'mission/started' }
  | { type: 'mission/ticked' }
  | { type: 'destination/selected'; destination: BodyName | '' }
  | { type: 'travel/started' }
  | { type: 'travel/ticked' }
  | { type: 'notification/cleared' };
