import { useEffect, useEffectEvent } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { celestialBodies } from '@/features/solar-voyage/domain/solar-system';
import { inventoryItemLabels, shipSlotLabels } from '@/features/solar-voyage/model/game-state';
import { useSolarVoyage } from '@/features/solar-voyage/hooks/use-solar-voyage';
import { cn } from '@/lib/utils';

type MissionControlProps = {
  backgroundImage: string;
};

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
      <main className="starfield relative min-h-screen overflow-hidden bg-[#030611]">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,6,17,0.92)_0%,rgba(3,6,17,0.72)_42%,rgba(3,6,17,0.2)_100%)]" />
        <div className="absolute inset-y-0 right-[-8%] hidden w-[56vw] min-w-[420px] xl:block">
          <div className="image-frame h-full w-full rounded-none border-0 bg-transparent p-0 shadow-none">
            <img
              alt="Solar Voyage cockpit"
              className="h-full w-full object-cover object-center"
              src={backgroundImage}
            />
          </div>
        </div>

        <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center px-6 py-10 md:px-10">
          <div className="grid w-full items-center gap-10 xl:grid-cols-[minmax(0,540px)_1fr]">
            <section className="animate-rise flex flex-col gap-8">
              <div className="flex flex-col gap-4">
                <Badge className="w-fit bg-primary/15 text-primary">Mission Control</Badge>
                <p className="text-sm uppercase tracking-[0.5em] text-primary/80">Launch Interface</p>
                <h1 className="font-[family-name:var(--font-display)] text-5xl leading-none tracking-[0.18em] text-white md:text-7xl">
                  Solar Voyage
                </h1>
                <p className="max-w-lg text-lg leading-8 text-slate-300">
                  Step into the original cockpit artwork and chart the next burn. The bridge is live again, with the
                  existing ship scene driving the whole first impression instead of hiding behind the UI.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:max-w-sm">
                <Button className="h-13 text-base font-semibold uppercase tracking-[0.2em]" onClick={startMission}>
                  New Mission
                </Button>
                <Button className="h-13 text-base uppercase tracking-[0.2em]" variant="secondary" disabled>
                  Load Mission
                </Button>
                <Button className="h-13 text-base uppercase tracking-[0.2em]" variant="outline" disabled>
                  Exit Sequence
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <LaunchMetric label="Bridge" value="Online" />
                <LaunchMetric label="Visual Feed" value="Restored" />
                <LaunchMetric label="Stack" value="React TS" />
              </div>
            </section>

            <section className="animate-rise xl:hidden">
              <div className="image-frame relative mx-auto aspect-[3/4] max-w-md overflow-hidden">
                <img
                  alt="Solar Voyage cockpit"
                  className="h-full w-full object-cover object-center"
                  src={backgroundImage}
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,6,17,0)_45%,rgba(3,6,17,0.78)_100%)]" />
              </div>
            </section>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 md:px-8">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-22 blur-[2px]"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      <div className="starfield absolute inset-0 bg-[linear-gradient(180deg,rgba(4,7,17,0.72),rgba(4,7,17,0.96))]" />

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-6">
        <header className="glass-panel hud-outline grid gap-4 rounded-[calc(var(--radius)+0.35rem)] p-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <div className="flex items-center gap-3">
            <Badge className="bg-primary/15 text-primary">Location</Badge>
            <span className="text-lg font-semibold text-white">{state.currentLocation}</span>
          </div>
          <div className="justify-self-center text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Mission Time</p>
            <p className="font-[family-name:var(--font-display)] text-2xl text-white">{missionTimerLabel}</p>
          </div>
          <div className="flex items-center justify-start gap-2 md:justify-end">
            <Badge className="bg-accent/20 text-accent">Status</Badge>
            <span className="text-sm text-slate-200">{state.travel ? 'In transit' : 'Docked'}</span>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
          <aside className="flex flex-col gap-6">
            <MapPanel currentLocation={state.currentLocation} currentPosition={currentPosition} />
            <ShipPanel hull={state.ship.hull} shields={state.ship.shields} />
          </aside>

          <section className="flex flex-col gap-6">
            <BridgePanel backgroundImage={backgroundImage} currentLocation={state.currentLocation} />
            <NavigationPanel
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

          <aside className="flex flex-col gap-6">
            <ResourcePanel
              hydrogen={state.resources.hydrogen}
              helium={state.resources.helium}
              lithium={state.resources.lithium}
            />
            <CargoPanel items={inventoryItemLabels} title="Inventory" />
          </aside>
        </section>

        <CargoPanel items={shipSlotLabels} title="Ship Loadout" />
      </div>
    </main>
  );
}

function LaunchMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l border-primary/25 pl-4">
      <p className="text-xs uppercase tracking-[0.26em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function BridgePanel({
  backgroundImage,
  currentLocation,
}: {
  backgroundImage: string;
  currentLocation: keyof typeof celestialBodies;
}) {
  return (
    <section className="image-frame animate-rise relative min-h-[360px] overflow-hidden">
      <img
        alt="Solar Voyage bridge view"
        className="h-full w-full object-cover object-center"
        src={backgroundImage}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,7,17,0.08)_0%,rgba(4,7,17,0.34)_45%,rgba(4,7,17,0.92)_100%)]" />
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 py-4">
        <Badge className="bg-primary/15 text-primary">Bridge Feed</Badge>
        <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-200">
          Sector {currentLocation}
        </span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
        <div className="max-w-md">
          <p className="text-xs uppercase tracking-[0.32em] text-primary/85">Visual Anchor</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl uppercase tracking-[0.18em] text-white">
            Existing Cockpit Restored
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-200">
            The original bridge art is back as the mission’s centerpiece, with overlays kept light so the cockpit and
            viewport remain readable.
          </p>
        </div>
      </div>
    </section>
  );
}

function MapPanel({
  currentLocation,
  currentPosition,
}: {
  currentLocation: keyof typeof celestialBodies;
  currentPosition: { x: number; y: number };
}) {
  return (
    <Card className="glass-panel hud-outline overflow-hidden">
      <CardHeader>
        <CardTitle className="font-[family-name:var(--font-display)] text-xl uppercase tracking-[0.18em]">
          Solar Map
        </CardTitle>
        <CardDescription>2D tactical overview of the system.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-square rounded-[1.4rem] border border-primary/15 bg-[radial-gradient(circle_at_center,#09213f_0%,#02050d_72%)] p-6">
          <div className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-300 shadow-[0_0_30px_rgba(255,209,102,0.75)]" />
          {Object.entries(celestialBodies).map(([name, body]) => (
            <div
              key={name}
              className="absolute"
              style={{
                left: `calc(50% + ${body.x * 10}px)`,
                top: `calc(50% + ${body.y * 10}px)`,
              }}
            >
              <div
                className={cn(
                  'size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20',
                  name === currentLocation && 'ring-4 ring-primary/30',
                )}
                style={{ backgroundColor: body.color }}
              />
              <span className="mt-2 block -translate-x-1/2 text-center text-[10px] uppercase tracking-[0.16em] text-slate-200">
                {name}
              </span>
            </div>
          ))}
          <div
            className="absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary bg-primary/20 shadow-[0_0_22px_rgba(107,243,255,0.65)]"
            style={{
              left: `calc(50% + ${currentPosition.x * 10}px)`,
              top: `calc(50% + ${currentPosition.y * 10}px)`,
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function ShipPanel({ hull, shields }: { hull: number; shields: number }) {
  return (
    <Card className="glass-panel hud-outline">
      <CardHeader>
        <CardTitle className="font-[family-name:var(--font-display)] text-xl uppercase tracking-[0.18em]">
          Ship Status
        </CardTitle>
        <CardDescription>Core integrity and shield charge.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <StatusBar label="Hull" value={hull} accentClassName="[&_[data-slot=progress-indicator]]:bg-red-400" />
        <StatusBar
          label="Shields"
          value={shields}
          accentClassName="[&_[data-slot=progress-indicator]]:bg-sky-400"
        />
      </CardContent>
    </Card>
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
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm uppercase tracking-[0.18em] text-slate-300">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <Progress className={cn('h-3 bg-white/8', accentClassName)} value={value} />
    </div>
  );
}

function NavigationPanel({
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
    <Card className="glass-panel hud-outline min-h-[360px]">
      <CardHeader>
        <CardTitle className="font-[family-name:var(--font-display)] text-xl uppercase tracking-[0.18em]">
          Navigation
        </CardTitle>
        <CardDescription>Plot a course and monitor the ship while it accelerates.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
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
      </CardContent>
    </Card>
  );
}

function ResourcePanel({
  hydrogen,
  helium,
  lithium,
}: {
  hydrogen: number;
  helium: number;
  lithium: number;
}) {
  const resources = [
    { label: 'Hydrogen', symbol: 'H', value: hydrogen },
    { label: 'Helium', symbol: 'He', value: helium },
    { label: 'Lithium', symbol: 'Li', value: lithium },
  ];

  return (
    <Card className="glass-panel hud-outline">
      <CardHeader>
        <CardTitle className="font-[family-name:var(--font-display)] text-xl uppercase tracking-[0.18em]">
          Resources
        </CardTitle>
        <CardDescription>Collected mission materials.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-3">
        {resources.map((resource) => (
          <div
            key={resource.label}
            className="rounded-2xl border border-border bg-muted/45 p-4 text-center"
          >
            <p className="text-lg font-semibold text-accent">{resource.symbol}</p>
            <p className="mt-2 text-xl font-bold text-white">{resource.value}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{resource.label}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function CargoPanel({ items, title }: { items: string[]; title: string }) {
  return (
    <Card className="glass-panel hud-outline">
      <CardHeader>
        <CardTitle className="font-[family-name:var(--font-display)] text-xl uppercase tracking-[0.18em]">
          {title}
        </CardTitle>
        <CardDescription>Placeholder slots prepared for future systems.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-3">
        {items.map((item) => (
          <div
            key={item}
            className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-primary/25 bg-white/5 px-3 text-center text-sm font-medium uppercase tracking-[0.12em] text-slate-200 transition-transform duration-200 hover:scale-[1.02] hover:border-accent/40 hover:bg-white/8"
          >
            {item}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
