export const glass = {
  gradientBorder: {
    subtle: ['rgba(240, 91, 226, 0.34)', 'rgba(168, 85, 247, 0.24)', 'rgba(59, 111, 216, 0.18)', 'rgba(255, 255, 255, 0.10)'],
    emphasized: ['rgba(244, 67, 220, 0.68)', 'rgba(185, 76, 255, 0.50)', 'rgba(93, 111, 255, 0.36)', 'rgba(74, 196, 255, 0.22)', 'rgba(255, 255, 255, 0.10)'],
    light: ['rgba(255, 255, 255, 0.94)', 'rgba(235, 65, 200, 0.40)', 'rgba(255, 255, 255, 0.58)', 'rgba(185, 120, 255, 0.32)', 'rgba(105, 180, 255, 0.30)', 'rgba(255, 185, 130, 0.28)', 'rgba(255, 255, 255, 0.82)'],
    lightEmphasized: ['rgba(255, 255, 255, 0.96)', 'rgba(235, 65, 200, 0.50)', 'rgba(185, 120, 255, 0.38)', 'rgba(105, 180, 255, 0.34)', 'rgba(90, 215, 210, 0.28)', 'rgba(255, 185, 130, 0.32)', 'rgba(255, 215, 120, 0.24)', 'rgba(255, 255, 255, 0.86)'],
  },
  buttonsEnabled: true,
  button: {
    light: {
      primary: 'rgba(230, 60, 216, 0.84)',
      secondary: 'rgba(139, 92, 246, 0.78)',
      border: 'rgba(255, 255, 255, 0.58)',
      shadow: 'rgba(120, 74, 145, 0.18)',
    },
    dark: {
      primary: 'rgba(230, 60, 216, 0.84)',
      secondary: 'rgba(168, 85, 247, 0.76)',
      border: 'rgba(255, 255, 255, 0.14)',
      shadow: 'rgba(0, 0, 0, 0.3)',
    },
  },
  light: {
    subtle: { background: 'rgba(255, 255, 255, 0.34)', border: 'rgba(255, 255, 255, 0.66)', blurIntensity: 18 },
    standard: { background: 'rgba(255, 255, 255, 0.48)', border: 'rgba(255, 255, 255, 0.78)', blurIntensity: 24 },
    hero: { background: 'rgba(255, 255, 255, 0.60)', border: 'rgba(255, 255, 255, 0.88)', blurIntensity: 30 },
    shadow: 'rgba(70, 53, 78, 0.16)',
  },
  dark: {
    subtle: { background: 'rgba(15, 15, 25, 0.46)', border: 'rgba(255, 255, 255, 0.08)', blurIntensity: 16 },
    standard: { background: 'rgba(20, 19, 31, 0.60)', border: 'rgba(255, 255, 255, 0.10)', blurIntensity: 24 },
    hero: { background: 'rgba(24, 22, 36, 0.72)', border: 'rgba(255, 255, 255, 0.14)', blurIntensity: 30 },
    shadow: 'rgba(0, 0, 0, 0.34)',
  },
  radius: 24,
} as const;