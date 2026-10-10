export interface ColorScheme {
  name: string;
  background: string;
  categories: {
    alkali: string;
    alkaline: string;
    transition: string;
    postTransition: string;
    metalloid: string;
    nonmetal: string;
    noble: string;
    lanthanide: string;
    actinide: string;
    fake: string;
  };
  borders: {
    alkali: string;
    alkaline: string;
    transition: string;
    postTransition: string;
    metalloid: string;
    nonmetal: string;
    noble: string;
    lanthanide: string;
    actinide: string;
    fake: string;
  };
}

export const BRAND = {
  ink: '#111111',
  cream: '#FFF4E0',
  paper: '#FFFFFF',
  yellow: '#FFD23F',
  pink: '#FF8FAB',
  mint: '#7BD389',
  muted: '#5B5346',
} as const;

export const LOGO_PALETTE = [BRAND.yellow, BRAND.pink, '#74B9FF', BRAND.mint, '#FF9F43', '#B197FC', '#4ECDC4'];

export const FONT_FAMILY = '"Space Grotesk", "Arial Black", Arial, sans-serif';

export const defaultColorScheme: ColorScheme = {
  name: 'neubrutalism',
  background: BRAND.cream,
  categories: {
    alkali: '#FF6B6B',
    alkaline: '#FF9F43',
    transition: '#74B9FF',
    postTransition: '#7BD389',
    metalloid: '#B197FC',
    nonmetal: '#4ECDC4',
    noble: '#FF8FAB',
    lanthanide: '#FFD23F',
    actinide: '#C4E86B',
    fake: BRAND.ink,
  },
  borders: {
    alkali: BRAND.ink,
    alkaline: BRAND.ink,
    transition: BRAND.ink,
    postTransition: BRAND.ink,
    metalloid: BRAND.ink,
    nonmetal: BRAND.ink,
    noble: BRAND.ink,
    lanthanide: BRAND.ink,
    actinide: BRAND.ink,
    fake: BRAND.yellow,
  },
};

export function getCategoryColor(category: string, colorScheme: ColorScheme = defaultColorScheme): string {
  return colorScheme.categories[category as keyof typeof colorScheme.categories] || colorScheme.categories.actinide;
}

export function getCategoryBorderColor(category: string, colorScheme: ColorScheme = defaultColorScheme): string {
  return colorScheme.borders[category as keyof typeof colorScheme.borders] || colorScheme.borders.actinide;
}

export function getFakeElementColor(colorScheme: ColorScheme = defaultColorScheme): string {
  return colorScheme.categories.fake;
}

export function getFakeElementBorderColor(colorScheme: ColorScheme = defaultColorScheme): string {
  return colorScheme.borders.fake;
}
