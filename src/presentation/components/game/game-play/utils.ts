export interface ContainerSize {
  width: number;
  height: number;
}

export interface CircularPosition {
  left: number;
  top: number;
  angle: number;
}

const PRESET_POSITIONS: Record<number, CircularPosition[]> = {
  1: [{ left: 50, top: 15, angle: -90 }],
  2: [
    { left: 20, top: 25, angle: -135 },
    { left: 80, top: 25, angle: -45 },
  ],
  3: [
    { left: 50, top: 15, angle: -90 },
    { left: 18, top: 55, angle: 180 },
    { left: 82, top: 55, angle: 0 },
  ],
  4: [
    { left: 50, top: 12, angle: -90 },
    { left: 15, top: 45, angle: -160 },
    { left: 50, top: 78, angle: 90 },
    { left: 85, top: 45, angle: 20 },
  ],
};

export const computeCircularPositions = (
  count: number,
  container: ContainerSize,
  radiusFactor = 0.35,
  offsetRadians = -Math.PI / 2
): CircularPosition[] => {
  if (!count) return [];
  const { width, height } = container;

  if (width <= 0 || height <= 0) {
    return (PRESET_POSITIONS[count] ?? PRESET_POSITIONS[Math.min(count, 4)] ?? []).map(
      (preset) => ({ ...preset, angle: (preset.angle * Math.PI) / 180 })
    );
  }

  const radius = Math.min(width, height) * radiusFactor;
  const centerX = width / 2;
  const centerY = height / 2;

  return Array.from({ length: count }).map((_, index) => {
    const angle = offsetRadians + (index / count) * Math.PI * 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    return {
      left: (x / width) * 100,
      top: (y / height) * 100,
      angle,
    };
  });
};
