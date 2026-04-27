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

export const defaultColorScheme: ColorScheme = {
  name: 'default',
  background: '#f1f5f9', // slate-100
  categories: {
    alkali: '#e03030',
    alkaline: '#f97316',
    transition: '#2563eb',
    postTransition: '#059669',
    metalloid: '#7c3aed',
    nonmetal: '#0284c7',
    noble: '#db2777',
    lanthanide: '#4338ca',
    actinide: '#475569',
    fake: '#1C1917', // stone-900
  },
  borders: {
    alkali: '#b91c1c',
    alkaline: '#c2410c',
    transition: '#1d4ed8',
    postTransition: '#047857',
    metalloid: '#6d28d9',
    nonmetal: '#0369a1',
    noble: '#be185d',
    lanthanide: '#3730a3',
    actinide: '#334155',
    fake: '#F59E0B', // amber-400
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
