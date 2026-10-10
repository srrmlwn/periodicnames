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

import type { NameResult } from '../types';

export const BRAND = {
  ink: '#111111',
  mist: '#EEF3FA',
  paper: '#FFFFFF',
  yellow: '#FFD23F',
  pink: '#FF8FAB',
  mint: '#7BD389',
  muted: '#4A5468',
} as const;

export const LOGO_PALETTE = [BRAND.yellow, BRAND.pink, '#74B9FF', BRAND.mint, '#FF9F43', '#B197FC', '#4ECDC4'];

export const NAME_PALETTE = ['#FFD23F', '#74B9FF', '#FF6B6B', '#7BD389', '#FF8FAB', '#B197FC', '#FF9F43'];

export const FONT_FAMILY = '"Space Grotesk", "Arial Black", Arial, sans-serif';

export const defaultColorScheme: ColorScheme = {
  name: 'neubrutalism',
  background: BRAND.mist,
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
    fake: BRAND.ink,
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

function paletteOffset(name: string): number {
  return [...name.toLowerCase()].reduce((sum, c) => sum + c.charCodeAt(0), 0) % NAME_PALETTE.length;
}

export const NEW_RIBBON_LABEL = 'NEW';

export function getTileColors(result: NameResult): string[] {
  const offset = paletteOffset(result.originalName.replace(/\s+/g, ''));
  let tileIndex = 0;
  return result.orderedElements.map(el =>
    el.symbol === ' ' ? 'transparent' : NAME_PALETTE[(offset + tileIndex++) % NAME_PALETTE.length]
  );
}
