import { useEffect, useState } from 'react';

export type MissionViewportLayout = {
  height: number;
  scale: number;
  width: number;
};

const MISSION_VIEWPORT = {
  chromePadding: 32,
  height: 920,
  width: 1500,
} as const;

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

export function useMissionViewportLayout() {
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
