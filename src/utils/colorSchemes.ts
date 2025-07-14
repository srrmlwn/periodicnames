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
  background: '#f9fafb', // gray-50
  categories: {
    alkali: '#ef4444', // red-500
    alkaline: '#f97316', // orange-500
    transition: '#3b82f6', // blue-500
    postTransition: '#10b981', // emerald-500
    metalloid: '#8b5cf6', // purple-500
    nonmetal: '#06b6d4', // cyan-500
    noble: '#ec4899', // pink-500
    lanthanide: '#6366f1', // indigo-500
    actinide: '#64748b', // slate-500
    fake: '#fbbf24', // amber-400
  },
  borders: {
    alkali: '#dc2626', // red-600
    alkaline: '#ea580c', // orange-600
    transition: '#2563eb', // blue-600
    postTransition: '#059669', // emerald-600
    metalloid: '#7c3aed', // purple-600
    nonmetal: '#0891b2', // cyan-600
    noble: '#db2777', // pink-600
    lanthanide: '#4f46e5', // indigo-600
    actinide: '#475569', // slate-600
    fake: '#f59e0b', // amber-500
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