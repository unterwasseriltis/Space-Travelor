import type { BodyName, Coordinates } from '@/features/solar-voyage/domain/solar-system';

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

export function createEmptyResourceState(): ResourceState {
  const resources = {} as ResourceState;

  Object.keys(ELEMENTS).forEach((key) => {
    resources[key as ElementKey] = 0;
  });

  return resources;
}

export const SPECIAL_RESOURCES = {
  rawOre: { label: 'Roherze', symbol: 'Ore' },
  diamonds: { label: 'Diamanten', symbol: 'Dia' },
  plasma: { label: 'Plasma', symbol: 'Pls' },
} as const;

export type SpecialResourceKey = keyof typeof SPECIAL_RESOURCES;
export type SpecialResourceState = Record<SpecialResourceKey, number>;

export function createEmptySpecialResourceState(): SpecialResourceState {
  return {
    diamonds: 0,
    plasma: 0,
    rawOre: 0,
  };
}

export type EquipmentSlotState = {
  element: ElementKey;
  unlocked: boolean;
  activationCount: number;
};

export type EquipmentEffectKind = 'fuel' | 'placeholder';
export type InventoryItemKey = 'miningLaser' | 'shieldBooster' | 'scannerModule';
export type InventorySlotState = {
  count: number;
  item: InventoryItemKey;
};

export type ScannerDiscoveryId = `scanner-site-${number}`;
export type LocationId = BodyName | ScannerDiscoveryId;

export type ScannerDiscoveryKind = 'asteroidCluster' | 'debrisField' | 'oreDeposit';

export type ScannerDiscoveryState = Coordinates & {
  anchor: BodyName;
  color: string;
  id: ScannerDiscoveryId;
  kind: ScannerDiscoveryKind;
  name: string;
  resourceYield: ResourceState;
};

export type ArrivalDialogState = {
  label: string;
  locationId: LocationId | null;
  message: string;
} | null;

export type ShipState = {
  hull: number;
  shields: number;
  fuel: number;
  maxFuel: number;
};

export type TravelStatus = 'active' | 'paused';

export type TravelState = {
  origin: LocationId;
  originCoordinates: Coordinates;
  target: LocationId;
  targetCoordinates: Coordinates;
  totalSeconds: number;
  remainingSeconds: number;
  distanceKm: number;
  earnedResources: ResourceState;
  status: TravelStatus;
};

export type GameState = {
  phase: GamePhase;
  arrivalDialog: ArrivalDialogState;
  currentLocation: LocationId;
  currentCoordinatesOverride: Coordinates | null;
  currentLocationLabelOverride: string | null;
  discoveredLocations: ScannerDiscoveryState[];
  missionElapsedSeconds: number;
  nextScannerDiscoveryId: number;
  selectedDestination: LocationId | '';
  ship: ShipState;
  resources: ResourceState;
  specialResources: SpecialResourceState;
  equipmentSlots: EquipmentSlotState[];
  inventorySlots: InventorySlotState[];
  travel: TravelState | null;
  notification: string | null;
};

export type GameAction =
  | { type: 'mission/started' }
  | { type: 'mission/ticked' }
  | { type: 'destination/selected'; destination: LocationId | '' }
  | { type: 'travel/started' }
  | { type: 'travel/ticked' }
  | { type: 'travel/paused' }
  | { type: 'travel/resumed' }
  | { type: 'travel/aborted' }
  | { type: 'equipment/slotUnlocked'; element: ElementKey }
  | { type: 'equipment/slotActivated'; element: ElementKey }
  | { type: 'crafting/itemCrafted'; item: InventoryItemKey }
  | { type: 'inventory/itemPressed'; item: InventoryItemKey }
  | { type: 'arrivalDialog/cleared' }
  | { type: 'notification/cleared' }
  | { type: 'state/restored'; source: 'autosave' | 'import'; state: GameState };
