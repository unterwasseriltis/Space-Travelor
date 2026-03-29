import { getArrivalVisualConfig } from '@/config/arrival-visuals';
import { celestialBodies } from '@/features/solar-voyage/domain/solar-system';
import { isBodyName } from '@/features/solar-voyage/model/locations';
import type { ArrivalDialogState } from '@/features/solar-voyage/model/types';

type ArrivalVisuals = {
  greeting: string;
  portraitAlt: string;
  portraitLabel: string;
  portraitSrc: string;
  sceneAlt: string;
  sceneLabel: string;
  sceneSrc: string;
  statusLabel: string;
  title: string;
};

const GENERIC_ACCENT = '#67e8f9';

export function getArrivalVisuals(arrivalDialog: NonNullable<ArrivalDialogState>): ArrivalVisuals {
  const bodyLocationId =
    arrivalDialog.locationId !== null && isBodyName(arrivalDialog.locationId)
      ? arrivalDialog.locationId
      : null;
  const accent = bodyLocationId ? celestialBodies[bodyLocationId].color : GENERIC_ACCENT;
  const config = getArrivalVisualConfig(bodyLocationId, arrivalDialog.label);

  return {
    greeting: config.greeting,
    portraitAlt: `${config.portraitLabel} placeholder for ${arrivalDialog.label}`,
    portraitLabel: config.portraitLabel,
    portraitSrc: createPortraitPlaceholder({
      accent,
      label: arrivalDialog.label,
      role: config.portraitLabel,
      statusLabel: config.statusCode,
    }),
    sceneAlt: `${config.sceneLabel} placeholder for ${arrivalDialog.label}`,
    sceneLabel: config.sceneLabel,
    sceneSrc: createScenePlaceholder({
      accent,
      label: arrivalDialog.label,
      subtitle: config.sceneSubtitle,
    }),
    statusLabel: config.statusLabel,
    title: config.title,
  };
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
      <text x="82" y="640" fill="#9ab1cf" font-family="Arial, sans-serif" font-size="28">placeholder arrival vista</text>
    </svg>
  `);
}

function createSvgDataUri(svgMarkup: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgMarkup)}`;
}
