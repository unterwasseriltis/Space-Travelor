import { ELEMENTS } from '@/features/solar-voyage/model/types';
import type {
  ElementKey,
  EquipmentEffectKind,
  EquipmentSlotState,
  ResourceState,
  ShipState,
} from '@/features/solar-voyage/model/types';

export const INITIAL_FUEL = 100;
export const MAX_FUEL = 100;
export const ELEMENT_SLOT_UNLOCK_THRESHOLD = 100;
export const ELEMENT_SLOT_ACTIVATION_COST = 100;
export const HYDROGEN_FUEL_GAIN = 5;
export const FUEL_DRAIN_PER_TRAVEL_TICK = 0.005;

const FUEL_PRECISION = 3;

export type EquipmentSlotConfig = {
  element: ElementKey;
  unlockThreshold: number;
  activationCost: number;
  effectKind: EquipmentEffectKind;
  effectValue: number;
  placeholderLabel: string;
  placeholderValue: number;
};

const EQUIPMENT_SLOT_CONFIG_BY_ELEMENT = {
  hydrogen: {
    activationCost: ELEMENT_SLOT_ACTIVATION_COST,
    effectKind: 'fuel',
    effectValue: HYDROGEN_FUEL_GAIN,
    placeholderLabel: 'Fuel refill',
    placeholderValue: HYDROGEN_FUEL_GAIN,
    unlockThreshold: ELEMENT_SLOT_UNLOCK_THRESHOLD,
  },
  helium: {
    activationCost: ELEMENT_SLOT_ACTIVATION_COST,
    effectKind: 'placeholder',
    effectValue: 2,
    placeholderLabel: 'Reactor stability',
    placeholderValue: 2,
    unlockThreshold: ELEMENT_SLOT_UNLOCK_THRESHOLD,
  },
  lithium: {
    activationCost: ELEMENT_SLOT_ACTIVATION_COST,
    effectKind: 'placeholder',
    effectValue: 3,
    placeholderLabel: 'Battery throughput',
    placeholderValue: 3,
    unlockThreshold: ELEMENT_SLOT_UNLOCK_THRESHOLD,
  },
  beryllium: {
    activationCost: ELEMENT_SLOT_ACTIVATION_COST,
    effectKind: 'placeholder',
    effectValue: 4,
    placeholderLabel: 'Sensor range',
    placeholderValue: 4,
    unlockThreshold: ELEMENT_SLOT_UNLOCK_THRESHOLD,
  },
  boron: {
    activationCost: ELEMENT_SLOT_ACTIVATION_COST,
    effectKind: 'placeholder',
    effectValue: 5,
    placeholderLabel: 'Shield tuning',
    placeholderValue: 5,
    unlockThreshold: ELEMENT_SLOT_UNLOCK_THRESHOLD,
  },
  carbon: {
    activationCost: ELEMENT_SLOT_ACTIVATION_COST,
    effectKind: 'placeholder',
    effectValue: 6,
    placeholderLabel: 'Hull weave',
    placeholderValue: 6,
    unlockThreshold: ELEMENT_SLOT_UNLOCK_THRESHOLD,
  },
  nitrogen: {
    activationCost: ELEMENT_SLOT_ACTIVATION_COST,
    effectKind: 'placeholder',
    effectValue: 7,
    placeholderLabel: 'Life support',
    placeholderValue: 7,
    unlockThreshold: ELEMENT_SLOT_UNLOCK_THRESHOLD,
  },
  oxygen: {
    activationCost: ELEMENT_SLOT_ACTIVATION_COST,
    effectKind: 'placeholder',
    effectValue: 8,
    placeholderLabel: 'Combustion mix',
    placeholderValue: 8,
    unlockThreshold: ELEMENT_SLOT_UNLOCK_THRESHOLD,
  },
  fluorine: {
    activationCost: ELEMENT_SLOT_ACTIVATION_COST,
    effectKind: 'placeholder',
    effectValue: 9,
    placeholderLabel: 'Propellant catalyst',
    placeholderValue: 9,
    unlockThreshold: ELEMENT_SLOT_UNLOCK_THRESHOLD,
  },
  neon: {
    activationCost: ELEMENT_SLOT_ACTIVATION_COST,
    effectKind: 'placeholder',
    effectValue: 10,
    placeholderLabel: 'Nav beacon',
    placeholderValue: 10,
    unlockThreshold: ELEMENT_SLOT_UNLOCK_THRESHOLD,
  },
  sodium: {
    activationCost: ELEMENT_SLOT_ACTIVATION_COST,
    effectKind: 'placeholder',
    effectValue: 11,
    placeholderLabel: 'Coolant pulse',
    placeholderValue: 11,
    unlockThreshold: ELEMENT_SLOT_UNLOCK_THRESHOLD,
  },
  magnesium: {
    activationCost: ELEMENT_SLOT_ACTIVATION_COST,
    effectKind: 'placeholder',
    effectValue: 12,
    placeholderLabel: 'Frame reinforcement',
    placeholderValue: 12,
    unlockThreshold: ELEMENT_SLOT_UNLOCK_THRESHOLD,
  },
  aluminium: {
    activationCost: ELEMENT_SLOT_ACTIVATION_COST,
    effectKind: 'placeholder',
    effectValue: 13,
    placeholderLabel: 'Bulkhead polish',
    placeholderValue: 13,
    unlockThreshold: ELEMENT_SLOT_UNLOCK_THRESHOLD,
  },
  silicon: {
    activationCost: ELEMENT_SLOT_ACTIVATION_COST,
    effectKind: 'placeholder',
    effectValue: 14,
    placeholderLabel: 'Circuit overclock',
    placeholderValue: 14,
    unlockThreshold: ELEMENT_SLOT_UNLOCK_THRESHOLD,
  },
} satisfies Record<ElementKey, Omit<EquipmentSlotConfig, 'element'>>;

export const ELEMENT_SLOT_CONFIG = (Object.keys(ELEMENTS) as ElementKey[]).map((element) => ({
  element,
  ...EQUIPMENT_SLOT_CONFIG_BY_ELEMENT[element],
})) satisfies EquipmentSlotConfig[];

export function createInitialEquipmentSlots(): EquipmentSlotState[] {
  return ELEMENT_SLOT_CONFIG.map(({ element }) => ({
    activationCount: 0,
    element,
    unlocked: false,
  }));
}

export function syncEquipmentSlotsWithResources(
  equipmentSlots: EquipmentSlotState[],
  resources: ResourceState,
) {
  const slotStateByElement = new Map(equipmentSlots.map((slot) => [slot.element, slot]));

  return ELEMENT_SLOT_CONFIG.map((config) => {
    const existingSlot = slotStateByElement.get(config.element);

    return {
      activationCount: existingSlot?.activationCount ?? 0,
      element: config.element,
      unlocked:
        (existingSlot?.unlocked ?? false) || resources[config.element] >= config.unlockThreshold,
    };
  });
}

export function getEquipmentSlotConfig(element: ElementKey) {
  return ELEMENT_SLOT_CONFIG.find((config) => config.element === element)!;
}

export function formatEquipmentEffect(config: EquipmentSlotConfig) {
  if (config.effectKind === 'fuel') {
    return `+${formatFuelValue(config.effectValue)} fuel`;
  }

  return `${config.placeholderLabel} ${config.placeholderValue} (placeholder)`;
}

export function calculateRequiredFuel(totalSeconds: number) {
  return roundFuel(totalSeconds * FUEL_DRAIN_PER_TRAVEL_TICK);
}

export function drainFuel(currentFuel: number) {
  return roundFuel(Math.max(0, currentFuel - FUEL_DRAIN_PER_TRAVEL_TICK));
}

export function refillFuel(currentFuel: number, maxFuel: number, fuelAmount: number) {
  return roundFuel(Math.min(maxFuel, currentFuel + fuelAmount));
}

export function formatFuelValue(value: number) {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(1);
}

export function isFuelDepleted(fuel: number) {
  return fuel <= 0;
}

export function applyEquipmentEffect(ship: ShipState, config: EquipmentSlotConfig): ShipState {
  if (config.effectKind === 'fuel') {
    return {
      ...ship,
      fuel: refillFuel(ship.fuel, ship.maxFuel, config.effectValue),
    };
  }

  return ship;
}

function roundFuel(value: number) {
  return Number(value.toFixed(FUEL_PRECISION));
}
