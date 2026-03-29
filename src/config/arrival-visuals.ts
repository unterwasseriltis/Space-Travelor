import moonArrivalVista from '../../assets/arrival-vista-mond.jpg';
import earthArrivalVista from '../../assets/arrival-vista-erde.jpg';
import venusArrivalVista from '../../assets/arrival-vista-venus.jpg';
import marsArrivalVista from '../../assets/arrival-vista-mars.jpg';
import phobosArrivalVista from '../../assets/arrival-vista-phobos.jpg';
import deimosArrivalVista from '../../assets/arrival-vista-deimos.jpg';
import merkurArrivalVista from '../../assets/arrival-vista-merkur.jpg';
import jupiterArrivalVista from '../../assets/arrival-vista-jupiter.jpg';
import amaltheaArrivalVista from '../../assets/arrival-vista-amalthea.jpg';
import ioArrivalVista from '../../assets/arrival-vista-io.jpg';
import europaArrivalVista from '../../assets/arrival-vista-europa.jpg';
import ganymedArrivalVista from '../../assets/arrival-vista-ganymed.jpg';
import kallistoArrivalVista from '../../assets/arrival-vista-kallisto.jpg';
import saturnArrivalVista from '../../assets/arrival-vista-saturn.jpg';
import tethysArrivalVista from '../../assets/arrival-vista-tethys.jpg';
import dioneArrivalVista from '../../assets/arrival-vista-dione.jpg';
import rheaArrivalVista from '../../assets/arrival-vista-rhea.jpg';
import titanArrivalVista from '../../assets/arrival-vista-titan.jpg';
import iapetusArrivalVista from '../../assets/arrival-vista-iapetus.jpg';
import uranusArrivalVista from '../../assets/arrival-vista-uranus.jpg';
import mirandaArrivalVista from '../../assets/arrival-vista-miranda.jpg';
import arielArrivalVista from '../../assets/arrival-vista-ariel.jpg';
import umbrielArrivalVista from '../../assets/arrival-vista-umbriel.jpg';
import titaniaArrivalVista from '../../assets/arrival-vista-titania.jpg';
import oberonArrivalVista from '../../assets/arrival-vista-oberon.jpg';

import moonArrivalPortrait from '../../assets/arrival-portrait-mond.jpg';
import earthArrivalPortrait from '../../assets/arrival-portrait-erde.jpg';
import venusArrivalPortrait from '../../assets/arrival-portrait-venus.jpg';
import marsArrivalPortrait from '../../assets/arrival-portrait-mars.jpg';
import phobosArrivalPortrait from '../../assets/arrival-portrait-phobos.jpg';
import deimosArrivalPortrait from '../../assets/arrival-portrait-deimos.jpg';
import merkurArrivalPortrait from '../../assets/arrival-portrait-merkur.jpg';
import jupiterArrivalPortrait from '../../assets/arrival-portrait-jupiter.jpg';
import amaltheaArrivalPortrait from '../../assets/arrival-portrait-amalthea.jpg';
import ioArrivalPortrait from '../../assets/arrival-portrait-io.jpg';
import europaArrivalPortrait from '../../assets/arrival-portrait-europa.jpg';
import ganymedArrivalPortrait from '../../assets/arrival-portrait-ganymed.jpg';
import kallistoArrivalPortrait from '../../assets/arrival-portrait-kallisto.jpg';
import saturnArrivalPortrait from '../../assets/arrival-portrait-saturn.jpg';
import tethysArrivalPortrait from '../../assets/arrival-portrait-tethys.jpg';
import dioneArrivalPortrait from '../../assets/arrival-portrait-dione.jpg';
import rheaArrivalPortrait from '../../assets/arrival-portrait-rhea.jpg';
import titanArrivalPortrait from '../../assets/arrival-portrait-titan.jpg';
import iapetusArrivalPortrait from '../../assets/arrival-portrait-iapetus.jpg';
import uranusArrivalPortrait from '../../assets/arrival-portrait-uranus.jpg';
import mirandaArrivalPortrait from '../../assets/arrival-portrait-miranda.jpg';
import arielArrivalPortrait from '../../assets/arrival-portrait-ariel.jpg';
import umbrielArrivalPortrait from '../../assets/arrival-portrait-umbriel.jpg';
import titaniaArrivalPortrait from '../../assets/arrival-portrait-titania.jpg';
import oberonArrivalPortrait from '../../assets/arrival-portrait-oberon.jpg';   

import { celestialBodies, type BodyName } from '@/features/solar-voyage/domain/solar-system';

export type ArrivalVisualConfig = {
  greeting: string;
  portraitLabel: string;
  portraitSrc: string;
  sceneLabel: string;
  sceneSrc: string;
  sceneSubtitle: string;
  statusCode: string;
  statusLabel: string;
  title: string;
};

const DEFAULT_PORTRAIT_LABEL = 'Kolonie-Kontakt';
const DEFAULT_SCENE_LABEL = 'Ankunftsansicht';
const DEFAULT_STATUS_CODE = 'KOLONIE AKTIV';
const DEFAULT_STATUS_LABEL = 'Kolonisierter Zielort';
const DEFAULT_SCENE_SUBTITLE = 'KOLONISIERTE WELT';
const GENERIC_ACCENT = '#67e8f9';

type ArrivalOverride = Partial<
  Pick<
    ArrivalVisualConfig,
    | 'greeting'
    | 'portraitLabel'
    | 'portraitSrc'
    | 'sceneLabel'
    | 'sceneSrc'
    | 'sceneSubtitle'
    | 'statusCode'
    | 'statusLabel'
    | 'title'
  >
>;

type BodyArrivalVisualOverrides = Partial<Record<BodyName, ArrivalOverride>>;

const bodyArrivalVisualOverrides: BodyArrivalVisualOverrides = {
  Erde: {
    greeting:
      'Hafenkontrolle geoeffnet. Willkommen auf der Erde; bitte registriere deine Crew umgehend und halte deine Reisedaten bereit.',
    portraitSrc: earthArrivalPortrait,
    sceneSrc: earthArrivalVista,
  },
  Mond: {
    greeting:
      'Hafenkontrolle geoeffnet. Willkommen auf dem Mond; bitte halte dich fuer die Einreisepruefung und das Andockprotokoll bereit.',
    portraitSrc: moonArrivalPortrait,
    sceneSrc: moonArrivalVista,
  },
  Venus: {
    greeting:
      'Hafenkontrolle geoeffnet. Willkommen auf der Venusstation; fuehre bitte alle Hitzeschutzprotokolle vor dem Ausstieg aus.',
    portraitSrc: venusArrivalPortrait,
    sceneSrc: venusArrivalVista,
  },
  Mars: {
    greeting:
      'Hafenkontrolle geoeffnet. Willkommen auf dem Mars; beziehe dein Quartier und melde dich anschliessend beim Hauptkommando.',
    portraitSrc: marsArrivalPortrait,
    sceneSrc: marsArrivalVista,
  },
  Phobos: {
    greeting:
      'Hafenkontrolle aktiv. Willkommen auf Phobos; die Kolonie hat ihre Docks, Habitate und Bergbauzonen fuer deine Crew geoeffnet.',
    portraitSrc: phobosArrivalPortrait,
    sceneSrc: phobosArrivalVista,
  },
  Deimos: {
    portraitSrc: deimosArrivalPortrait,
    sceneSrc: deimosArrivalVista,
  },
  Merkur: {
    portraitSrc: merkurArrivalPortrait,
    sceneSrc: merkurArrivalVista,
  },
  Jupiter: {
    portraitSrc: jupiterArrivalPortrait,
    sceneSrc: jupiterArrivalVista,
  },
  Amalthea: {
    portraitSrc: amaltheaArrivalPortrait,
    sceneSrc: amaltheaArrivalVista,
  },
  Io: {
    portraitSrc: ioArrivalPortrait,
    sceneSrc: ioArrivalVista,
  },
  Europa: {
    // portraitSrc: europaArrivalPortrait,
    sceneSrc: europaArrivalVista,
  },
  Ganymed: {
    sceneSrc: ganymedArrivalVista,
  },
  Kallisto: {
    sceneSrc: kallistoArrivalVista,
  },
  Saturn: {
    sceneSrc: saturnArrivalVista,
  },
  Tethys: {
    sceneSrc: tethysArrivalVista,
  },
  Dione: {
    sceneSrc: dioneArrivalVista,
  },
  Rhea: {
    sceneSrc: rheaArrivalVista,
  },
  Titan: {
    sceneSrc: titanArrivalVista,
  },
  Iapetus: {
    sceneSrc: iapetusArrivalVista,
  },
  Uranus: {
    sceneSrc: uranusArrivalVista,
  },
  Miranda: {
    sceneSrc: mirandaArrivalVista,
  },
  Ariel: {
    sceneSrc: arielArrivalVista,
  },
  Umbriel: {
    sceneSrc: umbrielArrivalVista,
  },
  Titania: {
    sceneSrc: titaniaArrivalVista,
  },
  Oberon: {
    sceneSrc: oberonArrivalVista,
  },
};

function createColonyArrivalVisualConfig(locationId: BodyName): ArrivalVisualConfig {
  const body = celestialBodies[locationId];
  const overrides = bodyArrivalVisualOverrides[locationId];
  const portraitLabel = overrides?.portraitLabel ?? DEFAULT_PORTRAIT_LABEL;
  const sceneLabel = overrides?.sceneLabel ?? DEFAULT_SCENE_LABEL;
  const statusCode = overrides?.statusCode ?? DEFAULT_STATUS_CODE;
  const sceneSubtitle = overrides?.sceneSubtitle ?? DEFAULT_SCENE_SUBTITLE;

  return {
    greeting:
      overrides?.greeting ??
      `Hafenkontrolle aktiv. Willkommen auf ${body.label}; die Kolonie hat ihre Docks, Habitate und Handelsbereiche fuer deine Crew geoeffnet.`,
    portraitLabel,
    portraitSrc:
      overrides?.portraitSrc ??
      createPortraitPlaceholder({
        accent: body.color,
        label: body.label,
        role: portraitLabel,
        statusLabel: statusCode,
      }),
    sceneLabel,
    sceneSrc:
      overrides?.sceneSrc ??
      createScenePlaceholder({
        accent: body.color,
        label: body.label,
        subtitle: sceneSubtitle,
      }),
    sceneSubtitle,
    statusCode,
    statusLabel: overrides?.statusLabel ?? DEFAULT_STATUS_LABEL,
    title: overrides?.title ?? `${body.label} Kolonie`,
  };
}

export const ERDE_ARRIVAL_VISUAL_CONFIG: ArrivalVisualConfig =
  createColonyArrivalVisualConfig('Erde');

export const MOON_ARRIVAL_VISUAL_CONFIG: ArrivalVisualConfig =
  createColonyArrivalVisualConfig('Mond');

export const PHOBOS_ARRIVAL_VISUAL_CONFIG: ArrivalVisualConfig =
  createColonyArrivalVisualConfig('Phobos');

export const bodyArrivalVisualConfig = {
  Erde: ERDE_ARRIVAL_VISUAL_CONFIG,
  Mond: MOON_ARRIVAL_VISUAL_CONFIG,
  Venus: createColonyArrivalVisualConfig('Venus'),
  Mars: createColonyArrivalVisualConfig('Mars'),
  Phobos: PHOBOS_ARRIVAL_VISUAL_CONFIG,
  Deimos: createColonyArrivalVisualConfig('Deimos'),
  Merkur: createColonyArrivalVisualConfig('Merkur'),
  Jupiter: createColonyArrivalVisualConfig('Jupiter'),
  Amalthea: createColonyArrivalVisualConfig('Amalthea'),
  Io: createColonyArrivalVisualConfig('Io'),
  Europa: createColonyArrivalVisualConfig('Europa'),
  Ganymed: createColonyArrivalVisualConfig('Ganymed'),
  Kallisto: createColonyArrivalVisualConfig('Kallisto'),
  Saturn: createColonyArrivalVisualConfig('Saturn'),
  Tethys: createColonyArrivalVisualConfig('Tethys'),
  Dione: createColonyArrivalVisualConfig('Dione'),
  Rhea: createColonyArrivalVisualConfig('Rhea'),
  Titan: createColonyArrivalVisualConfig('Titan'),
  Iapetus: createColonyArrivalVisualConfig('Iapetus'),
  Uranus: createColonyArrivalVisualConfig('Uranus'),
  Miranda: createColonyArrivalVisualConfig('Miranda'),
  Ariel: createColonyArrivalVisualConfig('Ariel'),
  Umbriel: createColonyArrivalVisualConfig('Umbriel'),
  Titania: createColonyArrivalVisualConfig('Titania'),
  Oberon: createColonyArrivalVisualConfig('Oberon'),
} satisfies Record<BodyName, ArrivalVisualConfig>;

export const scannerDiscoveryArrivalVisualConfig: ArrivalVisualConfig = {
  greeting:
    'Automatische Baken sind rund um diesen Wegpunkt aktiv. Voruebergehende Andockerlaubnis wurde erteilt, waehrend sich die Scansysteme synchronisieren.',
  portraitLabel: 'Sektor-Kontrolle',
  portraitSrc: createPortraitPlaceholder({
    accent: GENERIC_ACCENT,
    label: 'Prospektions-Relais',
    role: 'Sektor-Kontrolle',
    statusLabel: 'SCAN AKTIV',
  }),
  sceneLabel: 'Anflugbild',
  sceneSrc: createScenePlaceholder({
    accent: GENERIC_ACCENT,
    label: 'Prospektions-Relais',
    subtitle: 'SCANNER-ORT',
  }),
  sceneSubtitle: 'SCANNER-ORT',
  statusCode: 'SCAN AKTIV',
  statusLabel: 'Unbemannter Wegpunkt',
  title: 'Prospektions-Relais',
};

export function getArrivalVisualConfig(
  locationId: BodyName | null,
  fallbackLabel: string,
): ArrivalVisualConfig {
  if (!locationId) {
    return {
      ...scannerDiscoveryArrivalVisualConfig,
      greeting: `Automatische Baken sind rund um ${fallbackLabel} aktiv. Voruebergehende Andockerlaubnis wurde erteilt, waehrend sich die Scansysteme synchronisieren.`,
      portraitSrc: createPortraitPlaceholder({
        accent: GENERIC_ACCENT,
        label: fallbackLabel,
        role: scannerDiscoveryArrivalVisualConfig.portraitLabel,
        statusLabel: scannerDiscoveryArrivalVisualConfig.statusCode,
      }),
      sceneSrc: createScenePlaceholder({
        accent: GENERIC_ACCENT,
        label: fallbackLabel,
        subtitle: scannerDiscoveryArrivalVisualConfig.sceneSubtitle,
      }),
      title: `${fallbackLabel} Prospektions-Relais`,
    };
  }

  return bodyArrivalVisualConfig[locationId];
}

function createPortraitPlaceholder({
  accent,
  label,
  role,
  statusLabel,
}: {
  accent: string;
  label: string;
  role: string;
  statusLabel: string;
}) {
  return createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 900">
      <defs>
        <linearGradient id="bg" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="#08111f" />
          <stop offset="100%" stop-color="#152e4d" />
        </linearGradient>
        <linearGradient id="glow" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="${accent}" stop-opacity="0.85" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0.2" />
        </linearGradient>
      </defs>
      <rect width="720" height="900" fill="url(#bg)" rx="48" />
      <circle cx="540" cy="160" r="132" fill="url(#glow)" opacity="0.55" />
      <circle cx="360" cy="320" r="118" fill="#d7e8ff" opacity="0.9" />
      <path d="M210 756c32-126 108-188 150-188s118 62 150 188" fill="#d7e8ff" opacity="0.84" />
      <path d="M206 760h308v56H206z" fill="${accent}" opacity="0.18" />
      <rect x="58" y="58" width="604" height="784" rx="34" fill="none" stroke="${accent}" stroke-opacity="0.4" stroke-width="3" />
      <text x="76" y="96" fill="#8cb7e8" font-family="Arial, sans-serif" font-size="24" letter-spacing="6">${statusLabel}</text>
      <text x="76" y="822" fill="#ffffff" font-family="Arial, sans-serif" font-size="44" font-weight="700">${role}</text>
      <text x="76" y="860" fill="#9ab1cf" font-family="Arial, sans-serif" font-size="28">${label}</text>
    </svg>
  `);
}

function createScenePlaceholder({
  accent,
  label,
  subtitle,
}: {
  accent: string;
  label: string;
  subtitle: string;
}) {
  return createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720">
      <defs>
        <linearGradient id="sky" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="#020612" />
          <stop offset="100%" stop-color="#173456" />
        </linearGradient>
        <linearGradient id="ground" x1="0%" x2="0%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="${accent}" stop-opacity="0.3" />
          <stop offset="100%" stop-color="#020612" stop-opacity="0.08" />
        </linearGradient>
      </defs>
      <rect width="1280" height="720" fill="url(#sky)" />
      <circle cx="986" cy="176" r="128" fill="${accent}" opacity="0.85" />
      <circle cx="186" cy="122" r="3" fill="#ffffff" />
      <circle cx="278" cy="212" r="2" fill="#ffffff" />
      <circle cx="392" cy="104" r="2" fill="#ffffff" />
      <circle cx="468" cy="182" r="3" fill="#ffffff" />
      <circle cx="632" cy="92" r="2" fill="#ffffff" />
      <circle cx="744" cy="226" r="3" fill="#ffffff" />
      <circle cx="1102" cy="84" r="2" fill="#ffffff" />
      <path d="M0 560c180-86 386-94 590-22 104 36 210 56 364 48 126-8 228-32 326-66v200H0z" fill="url(#ground)" />
      <path d="M0 612c170-24 344-20 522 14 170 34 296 44 462 24 120-14 220-40 296-72v142H0z" fill="#05101d" opacity="0.85" />
      <rect x="54" y="54" width="1172" height="612" rx="30" fill="none" stroke="${accent}" stroke-opacity="0.38" stroke-width="3" />
      <text x="82" y="102" fill="#8cb7e8" font-family="Arial, sans-serif" font-size="24" letter-spacing="7">${subtitle}</text>
      <text x="82" y="596" fill="#ffffff" font-family="Arial, sans-serif" font-size="58" font-weight="700">${label}</text>
      <text x="82" y="640" fill="#9ab1cf" font-family="Arial, sans-serif" font-size="28">Platzhalter fuer Ankunftsansicht</text>
    </svg>
  `);
}

function createSvgDataUri(svgMarkup: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgMarkup)}`;
}
