import { useEffect, useEffectEvent, useState, type ChangeEvent, type WheelEvent } from 'react';
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
import { celestialBodies } from '@/features/solar-voyage/domain/solar-system';
import { useSolarVoyage } from '@/features/solar-voyage/hooks/use-solar-voyage';
import { inventoryItemLabels, shipSlotLabels } from '@/features/solar-voyage/model/game-state';
import { ELEMENTS } from '@/features/solar-voyage/model/types';
import type { ElementKey } from '@/features/solar-voyage/model/types';
import { cn } from '@/lib/utils';

type MissionControlProps = {
  backgroundImage: string;
};

type MissionViewportLayout = {
  height: number;
  scale: number;
  width: number;
};

const MISSION_VIEWPORT = {
  chromePadding: 32,
  height: 920,
  width: 1500,
} as const;

const MINIMAP_BASE_PIXELS_PER_AU = 12;
const MINIMAP_DEFAULT_ZOOM = 1;
const MINIMAP_MAX_ZOOM = 250;
const MINIMAP_MIN_ZOOM = 0.1;
const MINIMAP_ZOOM_SLIDER_MAX = 100;
const MINIMAP_ZOOM_STEP_FACTOR = 1.25;

export function MissionControl({ backgroundImage }: MissionControlProps) {
  const {
    state,
    availableDestinations,
    coordinatesLabel,
    missionTimerLabel,
    travelCountdownLabel,
    travelProgress,
    currentPosition,
    startMission,
    selectDestination,
    startTravel,
    clearNotification,
  } = useSolarVoyage();
  const clearNotificationEvent = useEffectEvent(clearNotification);
  const missionViewportLayout = useMissionViewportLayout();

  useEffect(() => {
    if (!state.notification) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      clearNotificationEvent();
    }, 3000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [state.notification]);

  if (state.phase === 'menu') {
    return (
      <main className="relative min-h-screen w-full overflow-hidden bg-[#030611]">
        <div
          className="fixed inset-0 bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: '100% 100%' }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,6,17,0.92)_0%,rgba(3,6,17,0.6)_42%,rgba(3,6,17,0.1)_100%)]" />

        <div className="starfield fixed inset-0 opacity-40" />

        <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center px-6 py-10 md:px-10">
          <div className="grid w-full items-center gap-10 xl:grid-cols-[minmax(0,740px)_1fr]">
            <section className="animate-rise flex flex-col gap-8">
              <div className="flex flex-col gap-4">
                <Badge className="bg-primary/15 text-primary w-fit">Mission Control</Badge>
                <p className="text-primary/80 text-sm tracking-[0.5em] uppercase">
                  Launch Interface
                </p>
                <h1 className="font-[family-name:var(--font-display)] text-5xl leading-none tracking-[0.18em] text-white md:text-8xl">
                  Solar Voyage
                </h1>
                <p className="max-w-2xl text-xl leading-9 text-slate-300">
                  Step into the restored cockpit and chart the next burn. The bridge is live again,
                  with the original artwork driving the whole experience. Navigation, telemetry, and
                  resource management are online and ready for the next system jump.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:max-w-sm">
                <Button
                  className="h-14 text-lg font-bold tracking-[0.2em] uppercase"
                  onClick={startMission}
                >
                  New Mission
                </Button>
                <Button
                  className="h-14 text-lg tracking-[0.2em] uppercase"
                  variant="secondary"
                  disabled
                >
                  Load Mission
                </Button>
                <Button
                  className="h-14 text-lg tracking-[0.2em] uppercase"
                  variant="outline"
                  disabled
                >
                  Exit Sequence
                </Button>
              </div>

              <div className="grid gap-6 sm:grid-cols-3">
                <LaunchMetric label="Bridge" value="Online" />
                <LaunchMetric label="Visual Feed" value="Restored" />
                <LaunchMetric label="Stack" value="React TS" />
              </div>
            </section>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#030611]">
      <div
        className="fixed inset-0 bg-center bg-no-repeat transition-opacity duration-1000"
        style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: '100% 100%' }}
      />
      <div className="fixed inset-0 bg-[linear-gradient(180deg,rgba(3,6,17,0.3)_0%,rgba(3,6,17,0.7)_100%)]" />
      <div className="starfield fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(4,7,17,0.08),rgba(4,7,17,0.35))]" />

      <div
        className="absolute top-1/2 left-1/2 z-10"
        style={{
          height: `${missionViewportLayout.height}px`,
          transform: `translate(-50%, -50%) scale(${missionViewportLayout.scale})`,
          transformOrigin: 'center center',
          width: `${missionViewportLayout.width}px`,
        }}
      >
        <div className="flex h-full w-full flex-col gap-5 p-6">
          <header className="grid shrink-0 grid-cols-[260px_minmax(0,1fr)] gap-5">
            <MapPanel
              className="h-full"
              currentLocation={state.currentLocation}
              currentPosition={currentPosition}
            />

            <div className="flex min-h-[210px] flex-col gap-5">
              <div className="glass-panel hud-outline grid flex-1 grid-cols-[1fr_auto_1fr] items-center rounded-[2rem] px-8 py-5">
                <div className="flex items-center gap-3">
                  <Badge className="bg-primary/15 text-primary">Standort</Badge>
                  <span className="text-2xl font-semibold text-white">{state.currentLocation}</span>
                </div>

                <div className="text-center">
                  <p className="text-primary text-xs font-bold tracking-[0.32em] uppercase">
                    Missionszeit
                  </p>
                  <p className="mt-2 font-[family-name:var(--font-display)] text-4xl tracking-[0.16em] text-white">
                    {missionTimerLabel}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Badge className="bg-accent/20 text-accent">Status</Badge>
                  <span className="text-lg font-medium text-slate-200">
                    {state.travel ? 'In transit' : 'Docked'}
                  </span>
                </div>
              </div>

              <div className="glass-panel hud-outline rounded-[2rem] px-6 py-5">
                <div className="grid grid-cols-2 gap-5">
                  <StatusBar
                    label="Rumpf"
                    value={state.ship.hull}
                    accentClassName="[&_[data-slot=progress-indicator]]:bg-red-400"
                  />
                  <StatusBar
                    label="Schilde"
                    value={state.ship.shields}
                    accentClassName="[&_[data-slot=progress-indicator]]:bg-sky-400"
                  />
                </div>
              </div>
            </div>
          </header>

          <section className="grid min-h-0 flex-1 grid-cols-[260px_430px_minmax(0,1fr)] gap-5">
            <aside className="min-h-0">
              <CargoPanel className="h-full" items={shipSlotLabels} title="Raumschiff-Ausrustung" />
            </aside>

            <section className="min-h-0">
              <NavigationPanel
                className="h-full"
                coordinatesLabel={coordinatesLabel}
                destinations={availableDestinations}
                isTraveling={Boolean(state.travel)}
                notification={state.notification}
                onDestinationChange={selectDestination}
                onStartTravel={startTravel}
                selectedDestination={state.selectedDestination}
                travelCountdownLabel={travelCountdownLabel}
                travelProgress={travelProgress}
              />
            </section>

            <aside className="grid min-h-0 grid-rows-[minmax(0,1fr)_220px] gap-5">
              <ResourcePanel className="min-h-0" resources={state.resources} />
              <CargoPanel compact items={inventoryItemLabels} title="Inventory" />
            </aside>
          </section>
        </div>
      </div>
    </main>
  );
}

function getMissionViewportLayout(): MissionViewportLayout {
  if (typeof window === 'undefined') {
    return {
      height: MISSION_VIEWPORT.height,
      scale: 1,
      width: MISSION_VIEWPORT.width,
    };
  }

  const availableWidth = Math.max(window.innerWidth - MISSION_VIEWPORT.chromePadding, 320);
  const availableHeight = Math.max(window.innerHeight - MISSION_VIEWPORT.chromePadding, 320);
  const scale = Math.min(
    availableWidth / MISSION_VIEWPORT.width,
    availableHeight / MISSION_VIEWPORT.height,
    1,
  );

  return {
    height: MISSION_VIEWPORT.height,
    scale,
    width: MISSION_VIEWPORT.width,
  };
}

function useMissionViewportLayout() {
  const [layout, setLayout] = useState<MissionViewportLayout>(() => getMissionViewportLayout());

  useEffect(() => {
    const updateLayout = () => {
      setLayout(getMissionViewportLayout());
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);

    return () => {
      window.removeEventListener('resize', updateLayout);
    };
  }, []);

  return layout;
}

function LaunchMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-primary/25 border-l pl-4">
      <p className="text-xs tracking-[0.26em] text-slate-500 uppercase">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function MapPanel({
  className,
  currentLocation,
  currentPosition,
}: {
  className?: string;
  currentLocation: keyof typeof celestialBodies;
  currentPosition: { x: number; y: number };
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
        {Object.entries(celestialBodies).map(([name, body]) => (
          <div
            key={name}
            className="absolute"
            data-testid={`minimap-body-${name}`}
            style={getMinimapMarkerStyle(body, currentPosition, zoom)}
          >
            <div
              className={cn(
                'size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20',
                name === currentLocation && 'ring-primary/40 ring-2',
              )}
              style={{ backgroundColor: body.color }}
            />
            <span className="mt-1 block -translate-x-1/2 text-center text-[8px] tracking-[0.1em] text-slate-300 uppercase">
              {name}
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

function StatusBar({
  label,
  value,
  accentClassName,
}: {
  label: string;
  value: number;
  accentClassName?: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-primary w-20 text-[10px] font-bold tracking-[0.2em] uppercase">
        {label}
      </span>
      <Progress className={cn('h-3 flex-1 bg-white/10', accentClassName)} value={value} />
      <span className="w-12 text-center text-xs font-bold text-white/90">{value}%</span>
    </div>
  );
}

function NavigationPanel({
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
  destinations: Array<keyof typeof celestialBodies>;
  isTraveling: boolean;
  notification: string | null;
  onDestinationChange: (destination: keyof typeof celestialBodies | '') => void;
  onStartTravel: () => void;
  selectedDestination: keyof typeof celestialBodies | '';
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
            onValueChange={(value) => onDestinationChange(value as keyof typeof celestialBodies)}
            value={selectedDestination}
          >
            <SelectTrigger className="bg-secondary/65 h-12 w-full">
              <SelectValue placeholder="Choose a destination" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {destinations.map((destination) => (
                  <SelectItem key={destination} value={destination}>
                    {destination}
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

function ResourcePanel({
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
      <CardContent className="grid min-h-0 grow auto-rows-fr grid-cols-3 gap-2 overflow-y-auto pr-1">
        {Object.entries(ELEMENTS).map(([key, element]) => (
          <div
            key={key}
            className="border-border bg-muted/30 hover:bg-muted/50 flex min-h-[74px] flex-col items-center justify-center rounded-xl border px-2 py-1 text-center transition-colors"
          >
            <p className="text-accent text-xs font-bold">{element.symbol}</p>
            <p className="text-2xl font-black text-white">{resources[key as ElementKey]}</p>
            <p className="mt-1 truncate text-[8px] tracking-[0.1em] text-slate-400 uppercase">
              {element.name}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function CargoPanel({
  className,
  compact = false,
  items,
  title,
}: {
  className?: string;
  compact?: boolean;
  items: string[];
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
      <div className={cn('flex flex-col gap-1', compact ? 'mb-3 shrink-0' : 'mb-5')}>
        <h3 className="font-[family-name:var(--font-display)] text-xl tracking-[0.2em] text-white uppercase">
          {title}
        </h3>
        <p className="text-xs text-slate-400">Placeholder slots prepared for future systems.</p>
      </div>
      <div className={cn('grid grid-cols-3 gap-3', compact && 'min-h-0 flex-1 auto-rows-fr gap-2')}>
        {items.map((item) => (
          <div
            key={item}
            className={cn(
              'border-primary/25 hover:border-accent/40 flex items-center justify-center rounded-2xl border border-dashed bg-white/5 px-3 text-center font-medium tracking-[0.12em] text-slate-200 uppercase transition-transform duration-200 hover:scale-[1.02] hover:bg-white/8',
              compact ? 'min-h-0 text-[9px]' : 'aspect-square text-[10px]',
            )}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
