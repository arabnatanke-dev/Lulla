export const lightPalette = {
  navy: '#152344',
  navyLight: '#22345D',
  purple: '#655895',
  lavender: '#C7BCE8',
  blue: '#9DC9E8',
  cream: '#F7F4EE',
  paper: '#EEEAE2',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  yellow: '#E9BC63',
  peach: '#E9AA90',
  coral: '#AD493F',
  green: '#719983',
  text: '#1C2333',
  muted: '#5F6675',
  white: '#FFFFFF',
  line: '#E2DED5',
  danger: '#B85252',
  iconBubble: '#EEEAF7',
  warningBubble: '#F9E9E4',
};

export const darkPalette: ThemeColors = {
  navy: '#293A66',
  navyLight: '#344977',
  purple: '#AB9DDF',
  lavender: '#C9BFF0',
  blue: '#8FC3E4',
  cream: '#0E1424',
  paper: '#151E32',
  surface: '#182238',
  surfaceElevated: '#202B43',
  yellow: '#F0C66E',
  peach: '#F1B49A',
  coral: '#EB8274',
  green: '#8AB59D',
  text: '#F5F1EA',
  muted: '#AAB1C2',
  white: '#FFFFFF',
  line: '#2D3953',
  danger: '#EA7777',
  iconBubble: '#292844',
  warningBubble: '#3A2529',
};

export type ThemeColors = typeof lightPalette;

export const shadows = {
  card: {
    shadowColor: '#07102D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
  },
};

export const radii = {
  sm: 12,
  md: 18,
  lg: 24,
  pill: 999,
};
