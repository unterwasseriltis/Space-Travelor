import type {
  ElementKey,
  EquipmentSlotState,
  EquipmentSlotType,
  ResourceState,
  ShipBonuses,
} from '@/features/solar-voyage/model/types';
import { ELEMENTS } from '@/features/solar-voyage/model/types';

export const BASE_INVENTORY_SLOTS = 9;
export const MAX_TRAVEL_DURATION_BONUS_PCT = 35;
export const MAX_UNLOCK_DISCOUNT_PCT = 35;
export const RARE_ELEMENT_MAX_RARITY = 0.17;

const EMPTY_BONUSES: ShipBonuses = {
  travelDurationPct: 0,
  hydrogenPerTick: 0,
  heliumPerTick: 0,
  oxygenPerTick: 0,
  totalRewardPct: 0,
  hydrogenRewardPct: 0,
  rareRewardPct: 0,
  unlockDiscountPct: 0,
  inventoryBonusSlots: 0,
  launchHydrogenBonus: 0,
  arrivalHydrogenBonus: 0,
};

export const slotTypeLabels: Record<EquipmentSlotType, string> = {
  universal: 'Universal Bay',
  propulsion: 'Propulsion Bay',
  systems: 'Systems Bay',
  reactor: 'Reactor Bay',
  structure: 'Structure Bay',
};

export const slotIdLabels: Record<string, string> = {
  'universal-alpha': 'Universal Alpha',
  'propulsion-alpha': 'Propulsion Alpha',
  'systems-alpha': 'Systems Alpha',
  'reactor-alpha': 'Reactor Alpha',
  'structure-alpha': 'Structure Alpha',
  'universal-beta': 'Universal Beta',
  'propulsion-beta': 'Propulsion Beta',
  'systems-beta': 'Systems Beta',
  'reactor-beta': 'Reactor Beta',
  'structure-beta': 'Structure Beta',
};

export const slotCompatibleElements: Record<EquipmentSlotType, ElementKey[]> = {
  universal: Object.keys(ELEMENTS) as ElementKey[],
  propulsion: ['hydrogen', 'oxygen', 'fluorine', 'magnesium'],
  systems: ['silicon', 'neon', 'beryllium', 'boron'],
  reactor: ['helium', 'lithium', 'sodium', 'nitrogen'],
  structure: ['carbon', 'aluminium'],
};

export const elementModuleBonuses: Record<ElementKey, Partial<ShipBonuses>> = {
  hydrogen: { travelDurationPct: 8 },
  helium: { hydrogenPerTick: 1 / 15 },
  lithium: { heliumPerTick: 1 / 30 },
  beryllium: { rareRewardPct: 8 },
  boron: { unlockDiscountPct: 10 },
  carbon: { inventoryBonusSlots: 2 },
  nitrogen: { oxygenPerTick: 1 / 30 },
  oxygen: { hydrogenRewardPct: 15 },
  fluorine: { totalRewardPct: 10 },
  neon: { rareRewardPct: 12 },
  sodium: { launchHydrogenBonus: 1, arrivalHydrogenBonus: 1 },
  magnesium: { travelDurationPct: 5 },
  aluminium: { unlockDiscountPct: 15 },
  silicon: { rareRewardPct: 10, travelDurationPct: 5 },
};

export const elementModuleDescriptions: Record<ElementKey, string> = {
  hydrogen: '-8% travel duration',
  helium: '+1 hydrogen / 15s travel',
  lithium: '+1 helium / 30s travel',
  beryllium: '+8% rare-element rewards',
  boron: '+10% unlock discount',
  carbon: '+2 inventory slots',
  nitrogen: '+1 oxygen / 30s travel',
  oxygen: '+15% hydrogen rewards',
  fluorine: '+10% rewards except hydrogen',
  neon: '+12% rare-element rewards',
  sodium: '+1 hydrogen on departure and arrival',
  magnesium: '-5% travel duration',
  aluminium: '+15% unlock discount',
  silicon: '+10% rare rewards, -5% travel duration',
};

const EQUIPMENT_SLOT_BLUEPRINTS: Omit<EquipmentSlotState, 'installedElement'>[] = [
  { id: 'universal-alpha', type: 'universal', unlocked: true, unlockCost: null },
  { id: 'propulsion-alpha', type: 'propulsion', unlocked: true, unlockCost: null },
  { id: 'systems-alpha', type: 'systems', unlocked: true, unlockCost: null },
  { id: 'reactor-alpha', type: 'reactor', unlocked: true, unlockCost: null },
  { id: 'structure-alpha', type: 'structure', unlocked: true, unlockCost: null },
  {
    id: 'universal-beta',
    type: 'universal',
    unlocked: false,
    unlockCost: { carbon: 8, aluminium: 4 },
  },
  {
    id: 'propulsion-beta',
    type: 'propulsion',
    unlocked: false,
    unlockCost: { hydrogen: 24, oxygen: 8 },
  },
  {
    id: 'systems-beta',
    type: 'systems',
    unlocked: false,
    unlockCost: { silicon: 6, neon: 4 },
  },
  {
    id: 'reactor-beta',
    type: 'reactor',
    unlocked: false,
    unlockCost: { helium: 10, lithium: 6 },
  },
  {
    id: 'structure-beta',
    type: 'structure',
    unlocked: false,
    unlockCost: { carbon: 12, magnesium: 6 },
  },
];

export function createInitialEquipmentSlots(): EquipmentSlotState[] {
  return EQUIPMENT_SLOT_BLUEPRINTS.map((slot) => ({
    ...slot,
    installedElement: null,
  }));
}

export function createEmptyBonuses(): ShipBonuses {
  return { ...EMPTY_BONUSES };
}

export function getShipBonusesFromSlots(equipmentSlots: EquipmentSlotState[]): ShipBonuses {
  const bonuses = createEmptyBonuses();

  equipmentSlots.forEach((slot) => {
    if (!slot.unlocked || !slot.installedElement) {
      return;
    }

    const moduleBonuses = elementModuleBonuses[slot.installedElement];

    Object.entries(moduleBonuses).forEach(([key, value]) => {
      const bonusKey = key as keyof ShipBonuses;
      bonuses[bonusKey] += value ?? 0;
    });
  });

  bonuses.travelDurationPct = Math.min(bonuses.travelDurationPct, MAX_TRAVEL_DURATION_BONUS_PCT);
  bonuses.unlockDiscountPct = Math.min(bonuses.unlockDiscountPct, MAX_UNLOCK_DISCOUNT_PCT);

  return bonuses;
}

export function getInventoryItemLabels(totalSlots: number) {
  return Array.from({ length: totalSlots }, (_, index) => `Item ${index + 1}`);
}

export function isRareElement(elementKey: ElementKey) {
  return ELEMENTS[elementKey].rarity <= RARE_ELEMENT_MAX_RARITY;
}

export function isElementCompatibleWithSlot(slotType: EquipmentSlotType, element: ElementKey) {
  return slotCompatibleElements[slotType].includes(element);
}

export function getAllowedElementsForSlot(slotType: EquipmentSlotType) {
  return slotCompatibleElements[slotType];
}

export function getDiscountedUnlockCost(
  unlockCost: Partial<ResourceState> | null,
  unlockDiscountPct: number,
) {
  if (!unlockCost) {
    return null;
  }

  const discountedCost = {} as Partial<ResourceState>;

  Object.entries(unlockCost).forEach(([key, value]) => {
    if (typeof value !== 'number') {
      return;
    }

    discountedCost[key as ElementKey] = Math.max(
      1,
      Math.ceil(value * (1 - Math.min(unlockDiscountPct, MAX_UNLOCK_DISCOUNT_PCT) / 100)),
    );
  });

  return discountedCost;
}
