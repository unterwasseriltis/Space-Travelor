import { useState, type ChangeEvent, type WheelEvent } from 'react';
import { MinusIcon, PlusIcon, RotateCcwIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { getInventoryItemLabel } from '@/features/solar-voyage/model/crafting';
import {
  ELEMENT_SLOT_CONFIG,
  formatEquipmentEffect,
} from '@/features/solar-voyage/model/equipment';
import type { LocationOption, MapLocation } from '@/features/solar-voyage/model/locations';
import { ELEMENTS } from '@/features/solar-voyage/model/types';
import type {
  ElementKey,
  EquipmentSlotState,
  InventoryItemKey,
  InventorySlotState,
  LocationId,
} from '@/features/solar-voyage/model/types';
import { cn } from '@/lib/utils';

import { CraftingButton } from '@/features/solar-voyage/ui/mission-control/dialogs';

const MINIMAP_BASE_PIXELS_PER_AU = 12;
const MINIMAP_DEFAULT_ZOOM = 1;
const MINIMAP_MAX_ZOOM = 250;
const MINIMAP_MIN_ZOOM = 0.1;
const MINIMAP_ZOOM_SLIDER_MAX = 100;
const MINIMAP_ZOOM_STEP_FACTOR = 1.25;

export function LaunchMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-primary/25 border-l pl-4">
      <p className="text-xs tracking-[0.26em] text-slate-500 uppercase">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

export function MapPanel({
  className,
  currentLocation,
  currentPosition,
  locations,
}: {
  className?: string;
  currentLocation: LocationId;
  currentPosition: { x: number; y: number };
  locations: MapLocation[];
}) {
  const [zoom, setZoom] = useState(MINIMAP_DEFAULT_ZOOM);
  const zoomLabel = `${Math.round(zoom * 100)}%`;
  const zoomSliderValue = getMinimapZoomSliderValue(zoom);

  const adjustZoom = (factor: number) => {
    setZoom((currentZoom) => clampMinimapZoom(currentZoom * factor));
  };

  const handleZoomChange = (event: ChangeEvent<HTMLInputElement>) => {
    setZoom(getMinimapZoomFromSliderValue(Number(event.target.value)));
  };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    adjustZoom(event.deltaY < 0 ? MINIMAP_ZOOM_STEP_FACTOR : 1 / MINIMAP_ZOOM_STEP_FACTOR);
  };

  return (
    <div
      className={cn(
        'glass-panel hud-outline flex flex-col items-center gap-3 overflow-hidden rounded-[2rem] p-4 text-center',
        className,
      )}
    >
      <div className="flex w-full items-center justify-between gap-3 text-[10px] font-bold tracking-[0.3em] uppercase">
        <span className="text-primary">Sonnensystem (2D)</span>
        <span className="text-slate-400">Ship lock</span>
      </div>
      <div
        className="border-primary/25 relative size-48 overflow-hidden rounded-full border bg-[radial-gradient(circle_at_center,#09213f_0%,#02050d_72%)]"
        onWheel={handleWheel}
      >
        <div
          aria-label="Sun position"
          className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-300 shadow-[0_0_20px_rgba(255,209,102,0.65)]"
          style={getMinimapMarkerStyle({ x: 0, y: 0 }, currentPosition, zoom)}
        />
        {locations.map((location) => (
          <div
            key={location.id}
            className="absolute"
            data-testid={`minimap-body-${location.label}`}
            style={getMinimapMarkerStyle(location, currentPosition, zoom)}
          >
            <div
              className={cn(
                'size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20',
                location.isScannerDiscovery && 'size-2.5 shadow-[0_0_18px_rgba(245,158,11,0.5)]',
                location.id === currentLocation && 'ring-primary/40 ring-2',
              )}
              style={{ backgroundColor: location.color }}
            />
            <span className="mt-1 block -translate-x-1/2 text-center text-[8px] tracking-[0.1em] text-slate-300 uppercase">
              {location.label}
            </span>
          </div>
        ))}
        <div
          aria-label="Ship position"
          className="border-primary bg-primary/20 absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border shadow-[0_0_15px_rgba(107,243,255,0.65)]"
          data-testid="minimap-ship"
          style={{ left: '50%', top: '50%' }}
        />
      </div>
      <div className="flex w-full items-center gap-2">
        <Button
          aria-label="Zoom out minimap"
          onClick={() => adjustZoom(1 / MINIMAP_ZOOM_STEP_FACTOR)}
          size="icon-xs"
          type="button"
          variant="outline"
        >
          <MinusIcon />
        </Button>
        <label className="flex min-w-0 flex-1 items-center gap-3 text-[10px] tracking-[0.18em] text-slate-300 uppercase">
          <span className="shrink-0">Zoom</span>
          <input
            aria-label="Minimap zoom"
            aria-valuetext={zoomLabel}
            className="accent-primary h-1 w-full cursor-pointer"
            max={MINIMAP_ZOOM_SLIDER_MAX}
            min={0}
            onChange={handleZoomChange}
            step={1}
            type="range"
            value={zoomSliderValue}
          />
        </label>
        <span
          className="w-16 text-right text-[10px] font-bold tracking-[0.18em] text-slate-300 uppercase"
          data-testid="minimap-zoom-value"
        >
          {zoomLabel}
        </span>
        <Button
          aria-label="Reset minimap zoom"
          onClick={() => setZoom(MINIMAP_DEFAULT_ZOOM)}
          size="icon-xs"
          type="button"
          variant="outline"
        >
          <RotateCcwIcon />
        </Button>
        <Button
          aria-label="Zoom in minimap"
          onClick={() => adjustZoom(MINIMAP_ZOOM_STEP_FACTOR)}
          size="icon-xs"
          type="button"
          variant="outline"
        >
          <PlusIcon />
        </Button>
      </div>
      <p className="text-[10px] tracking-[0.18em] text-slate-500 uppercase">
        Log zoom tuned for AU-scale distances.
      </p>
    </div>
  );
}

export function StatusBar({
  label,
  value,
  maxValue = 100,
  accentClassName,
  valueClassName,
  valueLabel,
}: {
  label: string;
  value: number;
  maxValue?: number;
  accentClassName?: string;
  valueClassName?: string;
  valueLabel?: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-primary w-20 text-[10px] font-bold tracking-[0.2em] uppercase">
        {label}
      </span>
      <Progress
        className={cn('h-3 flex-1 bg-white/10', accentClassName)}
        value={maxValue > 0 ? (value / maxValue) * 100 : 0}
      />
      <span className={cn('w-12 text-center text-xs font-bold text-white/90', valueClassName)}>
        {valueLabel ?? `${Math.round(value)}%`}
      </span>
    </div>
  );
}

export function NavigationPanel({
  className,
  coordinatesLabel,
  destinations,
  isTraveling,
  notification,
  onDestinationChange,
  onStartTravel,
  selectedDestination,
  travelCountdownLabel,
  travelProgress,
}: {
  className?: string;
  coordinatesLabel: string;
  destinations: LocationOption[];
  isTraveling: boolean;
  notification: string | null;
  onDestinationChange: (destination: LocationId | '') => void;
  onStartTravel: () => void;
  selectedDestination: LocationId | '';
  travelCountdownLabel: string | null;
  travelProgress: number;
}) {
  return (
    <div
      className={cn(
        'glass-panel hud-outline flex h-full min-h-0 flex-col gap-5 rounded-[2rem] p-5',
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <h3 className="font-[family-name:var(--font-display)] text-xl tracking-[0.2em] text-white uppercase">
          Navigation
        </h3>
        <p className="text-xs text-slate-400">
          Plot a course and monitor the ship while it accelerates.
        </p>
      </div>
      <div className="flex flex-1 flex-col gap-5">
        <div className="border-border bg-muted/45 rounded-2xl border p-4">
          <p className="text-xs tracking-[0.28em] text-slate-400 uppercase">Current Coordinates</p>
          <p className="mt-2 font-mono text-lg text-white">{coordinatesLabel}</p>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs tracking-[0.28em] text-slate-400 uppercase">Destination</p>
          <Select
            disabled={isTraveling}
            onValueChange={(value) => onDestinationChange(value as LocationId)}
            value={selectedDestination}
          >
            <SelectTrigger className="bg-secondary/65 h-12 w-full">
              <SelectValue placeholder="Choose a destination" />
            </SelectTrigger>
            <SelectContent className="max-h-72" position="popper">
              <SelectGroup>
                {destinations.map((destination) => (
                  <SelectItem key={destination.id} value={destination.id}>
                    {destination.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <Button
          className="h-12 tracking-[0.18em] uppercase"
          disabled={isTraveling}
          onClick={onStartTravel}
        >
          {isTraveling ? 'Travel in Progress' : 'Accelerate'}
        </Button>

        {isTraveling ? (
          <div className="border-primary/20 bg-primary/10 rounded-2xl border p-4">
            <div className="text-primary mb-3 flex items-center justify-between text-sm tracking-[0.18em] uppercase">
              <span>Transit Countdown</span>
              <span>{travelCountdownLabel}</span>
            </div>
            <Progress
              className="[&_[data-slot=progress-indicator]]:bg-primary h-3 bg-white/8"
              value={travelProgress * 100}
            />
          </div>
        ) : null}

        {notification ? (
          <>
            <Separator />
            <p className="border-accent/25 bg-accent/10 rounded-2xl border px-4 py-3 text-sm text-amber-100">
              {notification}
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}

export function ResourcePanel({
  className,
  resources,
}: {
  className?: string;
  resources: Record<ElementKey, number>;
}) {
  return (
    <Card size="sm" className={cn('glass-panel hud-outline h-full min-h-0', className)}>
      <CardHeader>
        <CardTitle className="font-[family-name:var(--font-display)] text-xl tracking-[0.18em] uppercase">
          Resources
        </CardTitle>
        <CardDescription>Collected mission materials. 14 elements tracked.</CardDescription>
      </CardHeader>
      <CardContent className="grid min-h-0 grow auto-rows-[80px] grid-cols-3 content-start gap-2 overflow-y-auto pr-1">
        {Object.entries(ELEMENTS).map(([key, element]) => (
          <div
            key={key}
            className="border-border bg-muted/30 hover:bg-muted/50 flex h-full min-h-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border px-2 py-2 text-center transition-colors"
          >
            <p className="text-accent text-[11px] leading-none font-bold">{element.symbol}</p>
            <p className="text-xl leading-none font-black text-white tabular-nums">
              {resources[key as ElementKey]}
            </p>
            <p className="w-full truncate text-[8px] leading-none tracking-[0.1em] text-slate-400 uppercase">
              {element.name}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function EquipmentPanel({
  className,
  equipmentSlots,
  onActivate,
  resources,
}: {
  className?: string;
  equipmentSlots: EquipmentSlotState[];
  onActivate: (element: ElementKey) => void;
  resources: Record<ElementKey, number>;
}) {
  const slotStateByElement = new Map(equipmentSlots.map((slot) => [slot.element, slot]));

  return (
    <Card size="sm" className={cn('glass-panel hud-outline h-full min-h-0', className)}>
      <CardHeader>
        <CardTitle className="font-[family-name:var(--font-display)] text-xl tracking-[0.18em] uppercase">
          Equipment
        </CardTitle>
        <CardDescription>One slot per element. Unlock at 100 units collected.</CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 grow flex-col gap-3 overflow-y-auto pr-1">
        {ELEMENT_SLOT_CONFIG.map((config) => {
          const slot = slotStateByElement.get(config.element);
          const resourceAmount = resources[config.element];
          const isUnlocked = slot?.unlocked ?? false;
          const canActivate = isUnlocked && resourceAmount >= config.activationCost;

          return (
            <div
              key={config.element}
              className="border-border bg-muted/35 flex flex-col gap-3 rounded-2xl border p-4"
              data-testid={`equipment-slot-${config.element}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-accent text-xs font-bold tracking-[0.24em] uppercase">
                    {ELEMENTS[config.element].symbol}
                  </p>
                  <h4 className="mt-1 text-sm font-semibold text-white">
                    {ELEMENTS[config.element].name}
                  </h4>
                </div>
                <Badge className={isUnlocked ? 'bg-emerald-500/15 text-emerald-300' : ''}>
                  {isUnlocked ? 'Freigeschaltet' : 'Gesperrt'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                <p>Bestand: {resourceAmount}</p>
                <p>Kosten: {config.activationCost}</p>
                <p>Effekt: {formatEquipmentEffect(config)}</p>
                <p>Ausloesungen: {slot?.activationCount ?? 0}</p>
              </div>

              <p className="text-[11px] text-slate-400">
                {isUnlocked
                  ? canActivate
                    ? 'Slot bereit. Aktivierung verbraucht 100 Einheiten.'
                    : 'Freigeschaltet, aber aktuell nicht genug Bestand.'
                  : `Freischaltung bei ${config.unlockThreshold} Einheiten.`}
              </p>

              <Button
                aria-label={`${ELEMENTS[config.element].name} slot aktivieren`}
                className="h-10 tracking-[0.14em] uppercase"
                disabled={!canActivate}
                onClick={() => onActivate(config.element)}
                type="button"
                variant={config.effectKind === 'fuel' ? 'default' : 'secondary'}
              >
                {config.effectKind === 'fuel' ? 'Refill' : 'Activate'}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function CargoPanel({
  className,
  compact = false,
  inventorySlots,
  onInventoryItemClick,
  onOpenCrafting,
  title,
}: {
  className?: string;
  compact?: boolean;
  inventorySlots: InventorySlotState[];
  onInventoryItemClick: (item: InventoryItemKey) => void;
  onOpenCrafting: () => void;
  title: string;
}) {
  return (
    <div
      className={cn(
        'glass-panel hud-outline rounded-[2rem] p-5',
        compact && 'flex h-full flex-col overflow-hidden',
        className,
      )}
    >
      <div
        className={cn('flex items-start justify-between gap-3', compact ? 'mb-3 shrink-0' : 'mb-5')}
      >
        <div className="flex flex-col gap-1">
          <h3 className="font-[family-name:var(--font-display)] text-xl tracking-[0.2em] text-white uppercase">
            {title}
          </h3>
          <p className="text-xs text-slate-400">
            Drei feste Slots. Crafting erhoeht den Bestand, Einsatz verbraucht je 1 Ladung.
          </p>
        </div>
        <CraftingButton onClick={onOpenCrafting} />
      </div>
      <div className={cn('grid grid-cols-3 gap-3', compact && 'min-h-0 flex-1 auto-rows-fr gap-2')}>
        {inventorySlots.map((slot, index) => {
          const itemLabel = getInventoryItemLabel(slot.item);
          const canUse = slot.count > 0;

          return (
            <div
              key={`inventory-slot-${index + 1}`}
              className={cn(
                'border-primary/25 flex items-center justify-center rounded-2xl border border-dashed bg-white/5 px-3 text-center font-medium tracking-[0.12em] text-slate-200 uppercase',
                compact ? 'min-h-0 text-[9px]' : 'aspect-square text-[10px]',
              )}
            >
              <Button
                aria-label={`${itemLabel} inventory item`}
                className={cn(
                  'h-full w-full rounded-[0.9rem] px-2 text-[9px] tracking-[0.12em] uppercase',
                  !canUse && 'cursor-default opacity-70',
                )}
                disabled={!canUse}
                onClick={() => onInventoryItemClick(slot.item)}
                type="button"
                variant={canUse ? 'secondary' : 'outline'}
              >
                <div className="flex flex-col items-center gap-1 text-center">
                  <span className="text-primary/70 text-[8px] tracking-[0.18em]">
                    Slot {index + 1}
                  </span>
                  <span>{itemLabel}</span>
                  <span className="text-[8px] text-slate-300">x{slot.count}</span>
                </div>
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function clampMinimapZoom(zoom: number) {
  return Math.min(Math.max(zoom, MINIMAP_MIN_ZOOM), MINIMAP_MAX_ZOOM);
}

function getMinimapZoomFromSliderValue(sliderValue: number) {
  const progress = Math.min(Math.max(sliderValue / MINIMAP_ZOOM_SLIDER_MAX, 0), 1);
  return clampMinimapZoom(
    MINIMAP_MIN_ZOOM * Math.pow(MINIMAP_MAX_ZOOM / MINIMAP_MIN_ZOOM, progress),
  );
}

function getMinimapZoomSliderValue(zoom: number) {
  return (
    (Math.log(clampMinimapZoom(zoom) / MINIMAP_MIN_ZOOM) /
      Math.log(MINIMAP_MAX_ZOOM / MINIMAP_MIN_ZOOM)) *
    MINIMAP_ZOOM_SLIDER_MAX
  );
}

function getMinimapMarkerStyle(
  target: { x: number; y: number },
  currentPosition: { x: number; y: number },
  zoom: number,
) {
  const offsetX = (target.x - currentPosition.x) * MINIMAP_BASE_PIXELS_PER_AU * zoom;
  const offsetY = (target.y - currentPosition.y) * MINIMAP_BASE_PIXELS_PER_AU * zoom;

  return {
    left: `calc(50% + ${offsetX}px)`,
    top: `calc(50% + ${offsetY}px)`,
  };
}
