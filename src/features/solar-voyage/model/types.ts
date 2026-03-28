import type { BodyName } from '@/features/solar-voyage/domain/solar-system';

export type GamePhase = 'menu' | 'mission';

export const ELEMENTS = {
  hydrogen: { symbol: 'H', name: 'Wasserstoff', rarity: 1.0 },
  helium: { symbol: 'He', name: 'Helium', rarity: 0.85 },
  lithium: { symbol: 'Li', name: 'Lithium', rarity: 0.7 },
  beryllium: { symbol: 'Be', name: 'Beryllium', rarity: 0.6 },
  boron: { symbol: 'B', name: 'Bor', rarity: 0.5 },
  carbon: { symbol: 'C', name: 'Kohlenstoff', rarity: 0.42 },
  nitrogen: { symbol: 'N', name: 'Stickstoff', rarity: 0.35 },
  oxygen: { symbol: 'O', name: 'Sauerstoff', rarity: 0.28 },
  fluorine: { symbol: 'F', name: 'Fluor', rarity: 0.22 },
  neon: { symbol: 'Ne', name: 'Neon', rarity: 0.17 },
  sodium: { symbol: 'Na', name: 'Natrium', rarity: 0.13 },
  magnesium: { symbol: 'Mg', name: 'Magnesium', rarity: 0.1 },
  aluminium: { symbol: 'Al', name: 'Aluminium', rarity: 0.07 },
  silicon: { symbol: 'Si', name: 'Silizium', rarity: 0.05 },
} as const;

export type ElementKey = keyof typeof ELEMENTS;

export type ResourceState = Record<ElementKey, number>;

export type EquipmentSlotState = {
  element: ElementKey;
  unlocked: boolean;
  activationCount: number;
};

export type EquipmentEffectKind = 'fuel' | 'placeholder';

export type ShipState = {
  hull: number;
  shields: number;
  fuel: number;
  maxFuel: number;
};

export type TravelState = {
  origin: BodyName;
  target: BodyName;
  totalSeconds: number;
  remainingSeconds: number;
  distanceKm: number;
  earnedResources: ResourceState;
};

export type GameState = {
  phase: GamePhase;
  currentLocation: BodyName;
  missionElapsedSeconds: number;
  selectedDestination: BodyName | '';
  ship: ShipState;
  resources: ResourceState;
  equipmentSlots: EquipmentSlotState[];
  travel: TravelState | null;
  notification: string | null;
};

export type GameAction =
  | { type: 'mission/started' }
  | { type: 'mission/ticked' }
  | { type: 'destination/selected'; destination: BodyName | '' }
  | { type: 'travel/started' }
  | { type: 'travel/ticked' }
  | { type: 'equipment/slotUnlocked'; element: ElementKey }
  | { type: 'equipment/slotActivated'; element: ElementKey }
  | { type: 'notification/cleared' }
  | { type: 'state/restored'; source: 'autosave' | 'import'; state: GameState };
