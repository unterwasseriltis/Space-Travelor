import { useEffect, useEffectEvent, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { celestialBodies } from '@/features/solar-voyage/domain/solar-system';
import { useSolarVoyage } from '@/features/solar-voyage/hooks/use-solar-voyage';
import { inventoryItemLabels, shipSlotLabels } from '@/features/solar-voyage/model/game-state';
import { ElementKey, ELEMENTS } from '@/features/solar-voyage/model/types';
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
  }, [clearNotificationEvent, state.notification]);

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
                <Badge className="w-fit bg-primary/15 text-primary">Mission Control</Badge>
                <p className="text-sm uppercase tracking-[0.5em] text-primary/80">Launch Interface</p>
                <h1 className="font-[family-name:var(--font-display)] text-5xl leading-none tracking-[0.18em] text-white md:text-8xl">
                  Solar Voyage
                </h1>
                <p className="max-w-2xl text-xl leading-9 text-slate-300">
                  Step into the restored cockpit and chart the next burn. The bridge is live again, with the
                  original artwork driving the whole experience. Navigation, telemetry, and resource management
                  are online and ready for the next system jump.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:max-w-sm">
                <Button className="h-14 text-lg font-bold uppercase tracking-[0.2em]" onClick={startMission}>
                  New Mission
                </Button>
                <Button className="h-14 text-lg uppercase tracking-[0.2em]" variant="secondary" disabled>
                  Load Mission
                </Button>
                <Button className="h-14 text-lg uppercase tracking-[0.2em]" variant="outline" disabled>
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
        className="absolute left-1/2 top-1/2 z-10"
        style={{
          height: `${missionViewportLayout.height}px`,
          transform: `translate(-50%, -50%) scale(${missionViewportLayout.scale})`,
          transformOrigin: 'center center',
          width: `${missionViewportLayout.width}px`,
        }}
      >
        <div className="flex h-full w-full flex-col gap-5 p-6">
          <header className="grid shrink-0 grid-cols-[260px_minmax(0,1fr)] gap-5">
            <MapPanel className="h-full" currentLocation={state.currentLocation} currentPosition={currentPosition} />

            <div className="flex min-h-[210px] flex-col gap-5">
              <div className="glass-panel hud-outline grid flex-1 grid-cols-[1fr_auto_1fr] items-center rounded-[2rem] px-8 py-5">
                <div className="flex items-center gap-3">
                  <Badge className="bg-primary/15 text-primary">Standort</Badge>
                  <span className="text-2xl font-semibold text-white">{state.currentLocation}</span>
                </div>

                <div className="text-center">
                  <p className="text-xs font-bold uppercase tracking-[0.32em] text-primary">Missionszeit</p>
                  <p className="mt-2 font-[family-name:var(--font-display)] text-4xl tracking-[0.16em] text-white">
                    {missionTimerLabel}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Badge className="bg-accent/20 text-accent">Status</Badge>
                  <span className="text-lg font-medium text-slate-200">{state.travel ? 'In transit' : 'Docked'}</span>
                </div>
              </div>

              <div className="glass-panel hud-outline rounded-[2rem] px-6 py-5">
                <div className="grid grid-cols-2 gap-5">
                  <StatusBar label="Rumpf" value={state.ship.hull} accentClassName="[&_[data-slot=progress-indicator]]:bg-red-400" />
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
    <div className="border-l border-primary/25 pl-4">
      <p className="text-xs uppercase tracking-[0.26em] text-slate-500">{label}</p>
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
  return (
    <div className={cn('glass-panel hud-outline flex flex-col items-center gap-3 overflow-hidden rounded-[2rem] p-4 text-center', className)}>
      <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Sonnensystem (2D)</span>
      <div className="relative size-48 rounded-full border border-primary/25 bg-[radial-gradient(circle_at_center,#09213f_0%,#02050d_72%)]">
        <div className="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-300 shadow-[0_0_20px_rgba(255,209,102,0.65)]" />
        {Object.entries(celestialBodies).map(([name, body]) => (
          <div
            key={name}
            className="absolute"
            style={{
              left: `calc(50% + ${body.x * 6}px)`,
              top: `calc(50% + ${body.y * 6}px)`,
            }}
          >
            <div
              className={cn(
                'size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20',
                name === currentLocation && 'ring-2 ring-primary/40',
              )}
              style={{ backgroundColor: body.color }}
            />
            <span className="mt-1 block -translate-x-1/2 text-center text-[8px] uppercase tracking-[0.1em] text-slate-300">
              {name}
            </span>
          </div>
        ))}
        <div
          className="absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary bg-primary/20 shadow-[0_0_15px_rgba(107,243,255,0.65)]"
          style={{
            left: `calc(50% + ${currentPosition.x * 6}px)`,
            top: `calc(50% + ${currentPosition.y * 6}px)`,
          }}
        />
      </div>
    </div>
  );
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
      <span className="w-20 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{label}</span>
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
    <div className={cn('glass-panel hud-outline flex h-full min-h-0 flex-col gap-5 rounded-[2rem] p-5', className)}>
      <div className="flex flex-col gap-1">
        <h3 className="font-[family-name:var(--font-display)] text-xl uppercase tracking-[0.2em] text-white">
          Navigation
        </h3>
        <p className="text-xs text-slate-400">Plot a course and monitor the ship while it accelerates.</p>
      </div>
      <div className="flex flex-1 flex-col gap-5">
        <div className="rounded-2xl border border-border bg-muted/45 p-4">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Current Coordinates</p>
          <p className="mt-2 font-mono text-lg text-white">{coordinatesLabel}</p>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Destination</p>
          <Select
            disabled={isTraveling}
            onValueChange={(value) => onDestinationChange(value as keyof typeof celestialBodies)}
            value={selectedDestination}
          >
            <SelectTrigger className="h-12 w-full bg-secondary/65">
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

        <Button className="h-12 uppercase tracking-[0.18em]" disabled={isTraveling} onClick={onStartTravel}>
          {isTraveling ? 'Travel in Progress' : 'Accelerate'}
        </Button>

        {isTraveling ? (
          <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
            <div className="mb-3 flex items-center justify-between text-sm uppercase tracking-[0.18em] text-primary">
              <span>Transit Countdown</span>
              <span>{travelCountdownLabel}</span>
            </div>
            <Progress className="h-3 bg-white/8 [&_[data-slot=progress-indicator]]:bg-primary" value={travelProgress * 100} />
          </div>
        ) : null}

        {notification ? (
          <>
            <Separator />
            <p className="rounded-2xl border border-accent/25 bg-accent/10 px-4 py-3 text-sm text-amber-100">
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
        <CardTitle className="font-[family-name:var(--font-display)] text-xl uppercase tracking-[0.18em]">
          Resources
        </CardTitle>
        <CardDescription>Collected mission materials. 14 elements tracked.</CardDescription>
      </CardHeader>
      <CardContent className="grid min-h-0 grow auto-rows-fr grid-cols-3 gap-2 overflow-y-auto pr-1">
        {Object.entries(ELEMENTS).map(([key, element]) => (
          <div
            key={key}
            className="flex min-h-[74px] flex-col items-center justify-center rounded-xl border border-border bg-muted/30 px-2 py-1 text-center transition-colors hover:bg-muted/50"
          >
            <p className="text-xs font-bold text-accent">{element.symbol}</p>
            <p className="text-2xl font-black text-white">{resources[key as ElementKey]}</p>
            <p className="mt-1 truncate text-[8px] uppercase tracking-[0.1em] text-slate-400">
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
    <div className={cn('glass-panel hud-outline rounded-[2rem] p-5', compact && 'flex h-full flex-col overflow-hidden', className)}>
      <div className={cn('flex flex-col gap-1', compact ? 'mb-3 shrink-0' : 'mb-5')}>
        <h3 className="font-[family-name:var(--font-display)] text-xl uppercase tracking-[0.2em] text-white">
          {title}
        </h3>
        <p className="text-xs text-slate-400">Placeholder slots prepared for future systems.</p>
      </div>
      <div className={cn('grid grid-cols-3 gap-3', compact && 'min-h-0 flex-1 auto-rows-fr gap-2')}>
        {items.map((item) => (
          <div
            key={item}
            className={cn(
              'flex items-center justify-center rounded-2xl border border-dashed border-primary/25 bg-white/5 px-3 text-center font-medium uppercase tracking-[0.12em] text-slate-200 transition-transform duration-200 hover:scale-[1.02] hover:border-accent/40 hover:bg-white/8',
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
