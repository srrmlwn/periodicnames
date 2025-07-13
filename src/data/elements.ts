export interface Element {
  symbol: string;
  name: string;
  atomicNumber: number;
  atomicMass: number;
  category: ElementCategory;
  isReal: boolean;
}

export type ElementCategory = 
  | 'alkali' 
  | 'alkaline' 
  | 'transition' 
  | 'postTransition' 
  | 'metalloid' 
  | 'nonmetal' 
  | 'noble' 
  | 'lanthanide' 
  | 'actinide';

export const elements: Element[] = [
  // Period 1
  { symbol: 'H', name: 'Hydrogen', atomicNumber: 1, atomicMass: 1.008, category: 'nonmetal', isReal: true },
  { symbol: 'He', name: 'Helium', atomicNumber: 2, atomicMass: 4.003, category: 'noble', isReal: true },
  
  // Period 2
  { symbol: 'Li', name: 'Lithium', atomicNumber: 3, atomicMass: 6.941, category: 'alkali', isReal: true },
  { symbol: 'Be', name: 'Beryllium', atomicNumber: 4, atomicMass: 9.012, category: 'alkaline', isReal: true },
  { symbol: 'B', name: 'Boron', atomicNumber: 5, atomicMass: 10.811, category: 'metalloid', isReal: true },
  { symbol: 'C', name: 'Carbon', atomicNumber: 6, atomicMass: 12.011, category: 'nonmetal', isReal: true },
  { symbol: 'N', name: 'Nitrogen', atomicNumber: 7, atomicMass: 14.007, category: 'nonmetal', isReal: true },
  { symbol: 'O', name: 'Oxygen', atomicNumber: 8, atomicMass: 15.999, category: 'nonmetal', isReal: true },
  { symbol: 'F', name: 'Fluorine', atomicNumber: 9, atomicMass: 18.998, category: 'nonmetal', isReal: true },
  { symbol: 'Ne', name: 'Neon', atomicNumber: 10, atomicMass: 20.180, category: 'noble', isReal: true },
  
  // Period 3
  { symbol: 'Na', name: 'Sodium', atomicNumber: 11, atomicMass: 22.990, category: 'alkali', isReal: true },
  { symbol: 'Mg', name: 'Magnesium', atomicNumber: 12, atomicMass: 24.305, category: 'alkaline', isReal: true },
  { symbol: 'Al', name: 'Aluminum', atomicNumber: 13, atomicMass: 26.982, category: 'postTransition', isReal: true },
  { symbol: 'Si', name: 'Silicon', atomicNumber: 14, atomicMass: 28.086, category: 'metalloid', isReal: true },
  { symbol: 'P', name: 'Phosphorus', atomicNumber: 15, atomicMass: 30.974, category: 'nonmetal', isReal: true },
  { symbol: 'S', name: 'Sulfur', atomicNumber: 16, atomicMass: 32.065, category: 'nonmetal', isReal: true },
  { symbol: 'Cl', name: 'Chlorine', atomicNumber: 17, atomicMass: 35.453, category: 'nonmetal', isReal: true },
  { symbol: 'Ar', name: 'Argon', atomicNumber: 18, atomicMass: 39.948, category: 'noble', isReal: true },
  
  // Period 4
  { symbol: 'K', name: 'Potassium', atomicNumber: 19, atomicMass: 39.098, category: 'alkali', isReal: true },
  { symbol: 'Ca', name: 'Calcium', atomicNumber: 20, atomicMass: 40.078, category: 'alkaline', isReal: true },
  { symbol: 'Sc', name: 'Scandium', atomicNumber: 21, atomicMass: 44.956, category: 'transition', isReal: true },
  { symbol: 'Ti', name: 'Titanium', atomicNumber: 22, atomicMass: 47.867, category: 'transition', isReal: true },
  { symbol: 'V', name: 'Vanadium', atomicNumber: 23, atomicMass: 50.942, category: 'transition', isReal: true },
  { symbol: 'Cr', name: 'Chromium', atomicNumber: 24, atomicMass: 51.996, category: 'transition', isReal: true },
  { symbol: 'Mn', name: 'Manganese', atomicNumber: 25, atomicMass: 54.938, category: 'transition', isReal: true },
  { symbol: 'Fe', name: 'Iron', atomicNumber: 26, atomicMass: 55.845, category: 'transition', isReal: true },
  { symbol: 'Co', name: 'Cobalt', atomicNumber: 27, atomicMass: 58.933, category: 'transition', isReal: true },
  { symbol: 'Ni', name: 'Nickel', atomicNumber: 28, atomicMass: 58.693, category: 'transition', isReal: true },
  { symbol: 'Cu', name: 'Copper', atomicNumber: 29, atomicMass: 63.546, category: 'transition', isReal: true },
  { symbol: 'Zn', name: 'Zinc', atomicNumber: 30, atomicMass: 65.38, category: 'transition', isReal: true },
  { symbol: 'Ga', name: 'Gallium', atomicNumber: 31, atomicMass: 69.723, category: 'postTransition', isReal: true },
  { symbol: 'Ge', name: 'Germanium', atomicNumber: 32, atomicMass: 72.64, category: 'metalloid', isReal: true },
  { symbol: 'As', name: 'Arsenic', atomicNumber: 33, atomicMass: 74.922, category: 'metalloid', isReal: true },
  { symbol: 'Se', name: 'Selenium', atomicNumber: 34, atomicMass: 78.96, category: 'nonmetal', isReal: true },
  { symbol: 'Br', name: 'Bromine', atomicNumber: 35, atomicMass: 79.904, category: 'nonmetal', isReal: true },
  { symbol: 'Kr', name: 'Krypton', atomicNumber: 36, atomicMass: 83.798, category: 'noble', isReal: true },
  
  // Period 5
  { symbol: 'Rb', name: 'Rubidium', atomicNumber: 37, atomicMass: 85.468, category: 'alkali', isReal: true },
  { symbol: 'Sr', name: 'Strontium', atomicNumber: 38, atomicMass: 87.62, category: 'alkaline', isReal: true },
  { symbol: 'Y', name: 'Yttrium', atomicNumber: 39, atomicMass: 88.906, category: 'transition', isReal: true },
  { symbol: 'Zr', name: 'Zirconium', atomicNumber: 40, atomicMass: 91.224, category: 'transition', isReal: true },
  { symbol: 'Nb', name: 'Niobium', atomicNumber: 41, atomicMass: 92.906, category: 'transition', isReal: true },
  { symbol: 'Mo', name: 'Molybdenum', atomicNumber: 42, atomicMass: 95.96, category: 'transition', isReal: true },
  { symbol: 'Tc', name: 'Technetium', atomicNumber: 43, atomicMass: 98, category: 'transition', isReal: true },
  { symbol: 'Ru', name: 'Ruthenium', atomicNumber: 44, atomicMass: 101.07, category: 'transition', isReal: true },
  { symbol: 'Rh', name: 'Rhodium', atomicNumber: 45, atomicMass: 102.906, category: 'transition', isReal: true },
  { symbol: 'Pd', name: 'Palladium', atomicNumber: 46, atomicMass: 106.42, category: 'transition', isReal: true },
  { symbol: 'Ag', name: 'Silver', atomicNumber: 47, atomicMass: 107.868, category: 'transition', isReal: true },
  { symbol: 'Cd', name: 'Cadmium', atomicNumber: 48, atomicMass: 112.411, category: 'transition', isReal: true },
  { symbol: 'In', name: 'Indium', atomicNumber: 49, atomicMass: 114.818, category: 'postTransition', isReal: true },
  { symbol: 'Sn', name: 'Tin', atomicNumber: 50, atomicMass: 118.71, category: 'postTransition', isReal: true },
  { symbol: 'Sb', name: 'Antimony', atomicNumber: 51, atomicMass: 121.76, category: 'metalloid', isReal: true },
  { symbol: 'Te', name: 'Tellurium', atomicNumber: 52, atomicMass: 127.6, category: 'metalloid', isReal: true },
  { symbol: 'I', name: 'Iodine', atomicNumber: 53, atomicMass: 126.904, category: 'nonmetal', isReal: true },
  { symbol: 'Xe', name: 'Xenon', atomicNumber: 54, atomicMass: 131.293, category: 'noble', isReal: true },
  
  // Period 6
  { symbol: 'Cs', name: 'Cesium', atomicNumber: 55, atomicMass: 132.905, category: 'alkali', isReal: true },
  { symbol: 'Ba', name: 'Barium', atomicNumber: 56, atomicMass: 137.327, category: 'alkaline', isReal: true },
  { symbol: 'La', name: 'Lanthanum', atomicNumber: 57, atomicMass: 138.905, category: 'lanthanide', isReal: true },
  { symbol: 'Ce', name: 'Cerium', atomicNumber: 58, atomicMass: 140.116, category: 'lanthanide', isReal: true },
  { symbol: 'Pr', name: 'Praseodymium', atomicNumber: 59, atomicMass: 140.908, category: 'lanthanide', isReal: true },
  { symbol: 'Nd', name: 'Neodymium', atomicNumber: 60, atomicMass: 144.242, category: 'lanthanide', isReal: true },
  { symbol: 'Pm', name: 'Promethium', atomicNumber: 61, atomicMass: 145, category: 'lanthanide', isReal: true },
  { symbol: 'Sm', name: 'Samarium', atomicNumber: 62, atomicMass: 150.36, category: 'lanthanide', isReal: true },
  { symbol: 'Eu', name: 'Europium', atomicNumber: 63, atomicMass: 151.964, category: 'lanthanide', isReal: true },
  { symbol: 'Gd', name: 'Gadolinium', atomicNumber: 64, atomicMass: 157.25, category: 'lanthanide', isReal: true },
  { symbol: 'Tb', name: 'Terbium', atomicNumber: 65, atomicMass: 158.925, category: 'lanthanide', isReal: true },
  { symbol: 'Dy', name: 'Dysprosium', atomicNumber: 66, atomicMass: 162.5, category: 'lanthanide', isReal: true },
  { symbol: 'Ho', name: 'Holmium', atomicNumber: 67, atomicMass: 164.93, category: 'lanthanide', isReal: true },
  { symbol: 'Er', name: 'Erbium', atomicNumber: 68, atomicMass: 167.259, category: 'lanthanide', isReal: true },
  { symbol: 'Tm', name: 'Thulium', atomicNumber: 69, atomicMass: 168.934, category: 'lanthanide', isReal: true },
  { symbol: 'Yb', name: 'Ytterbium', atomicNumber: 70, atomicMass: 173.054, category: 'lanthanide', isReal: true },
  { symbol: 'Lu', name: 'Lutetium', atomicNumber: 71, atomicMass: 174.967, category: 'lanthanide', isReal: true },
  { symbol: 'Hf', name: 'Hafnium', atomicNumber: 72, atomicMass: 178.49, category: 'transition', isReal: true },
  { symbol: 'Ta', name: 'Tantalum', atomicNumber: 73, atomicMass: 180.948, category: 'transition', isReal: true },
  { symbol: 'W', name: 'Tungsten', atomicNumber: 74, atomicMass: 183.84, category: 'transition', isReal: true },
  { symbol: 'Re', name: 'Rhenium', atomicNumber: 75, atomicMass: 186.207, category: 'transition', isReal: true },
  { symbol: 'Os', name: 'Osmium', atomicNumber: 76, atomicMass: 190.23, category: 'transition', isReal: true },
  { symbol: 'Ir', name: 'Iridium', atomicNumber: 77, atomicMass: 192.217, category: 'transition', isReal: true },
  { symbol: 'Pt', name: 'Platinum', atomicNumber: 78, atomicMass: 195.084, category: 'transition', isReal: true },
  { symbol: 'Au', name: 'Gold', atomicNumber: 79, atomicMass: 196.967, category: 'transition', isReal: true },
  { symbol: 'Hg', name: 'Mercury', atomicNumber: 80, atomicMass: 200.59, category: 'transition', isReal: true },
  { symbol: 'Tl', name: 'Thallium', atomicNumber: 81, atomicMass: 204.383, category: 'postTransition', isReal: true },
  { symbol: 'Pb', name: 'Lead', atomicNumber: 82, atomicMass: 207.2, category: 'postTransition', isReal: true },
  { symbol: 'Bi', name: 'Bismuth', atomicNumber: 83, atomicMass: 208.98, category: 'postTransition', isReal: true },
  { symbol: 'Po', name: 'Polonium', atomicNumber: 84, atomicMass: 209, category: 'postTransition', isReal: true },
  { symbol: 'At', name: 'Astatine', atomicNumber: 85, atomicMass: 210, category: 'metalloid', isReal: true },
  { symbol: 'Rn', name: 'Radon', atomicNumber: 86, atomicMass: 222, category: 'noble', isReal: true },
  
  // Period 7
  { symbol: 'Fr', name: 'Francium', atomicNumber: 87, atomicMass: 223, category: 'alkali', isReal: true },
  { symbol: 'Ra', name: 'Radium', atomicNumber: 88, atomicMass: 226, category: 'alkaline', isReal: true },
  { symbol: 'Ac', name: 'Actinium', atomicNumber: 89, atomicMass: 227, category: 'actinide', isReal: true },
  { symbol: 'Th', name: 'Thorium', atomicNumber: 90, atomicMass: 232.038, category: 'actinide', isReal: true },
  { symbol: 'Pa', name: 'Protactinium', atomicNumber: 91, atomicMass: 231.036, category: 'actinide', isReal: true },
  { symbol: 'U', name: 'Uranium', atomicNumber: 92, atomicMass: 238.029, category: 'actinide', isReal: true },
  { symbol: 'Np', name: 'Neptunium', atomicNumber: 93, atomicMass: 237, category: 'actinide', isReal: true },
  { symbol: 'Pu', name: 'Plutonium', atomicNumber: 94, atomicMass: 244, category: 'actinide', isReal: true },
  { symbol: 'Am', name: 'Americium', atomicNumber: 95, atomicMass: 243, category: 'actinide', isReal: true },
  { symbol: 'Cm', name: 'Curium', atomicNumber: 96, atomicMass: 247, category: 'actinide', isReal: true },
  { symbol: 'Bk', name: 'Berkelium', atomicNumber: 97, atomicMass: 247, category: 'actinide', isReal: true },
  { symbol: 'Cf', name: 'Californium', atomicNumber: 98, atomicMass: 251, category: 'actinide', isReal: true },
  { symbol: 'Es', name: 'Einsteinium', atomicNumber: 99, atomicMass: 252, category: 'actinide', isReal: true },
  { symbol: 'Fm', name: 'Fermium', atomicNumber: 100, atomicMass: 257, category: 'actinide', isReal: true },
  { symbol: 'Md', name: 'Mendelevium', atomicNumber: 101, atomicMass: 258, category: 'actinide', isReal: true },
  { symbol: 'No', name: 'Nobelium', atomicNumber: 102, atomicMass: 259, category: 'actinide', isReal: true },
  { symbol: 'Lr', name: 'Lawrencium', atomicNumber: 103, atomicMass: 262, category: 'actinide', isReal: true },
  { symbol: 'Rf', name: 'Rutherfordium', atomicNumber: 104, atomicMass: 261, category: 'transition', isReal: true },
  { symbol: 'Db', name: 'Dubnium', atomicNumber: 105, atomicMass: 262, category: 'transition', isReal: true },
  { symbol: 'Sg', name: 'Seaborgium', atomicNumber: 106, atomicMass: 266, category: 'transition', isReal: true },
  { symbol: 'Bh', name: 'Bohrium', atomicNumber: 107, atomicMass: 264, category: 'transition', isReal: true },
  { symbol: 'Hs', name: 'Hassium', atomicNumber: 108, atomicMass: 277, category: 'transition', isReal: true },
  { symbol: 'Mt', name: 'Meitnerium', atomicNumber: 109, atomicMass: 268, category: 'transition', isReal: true },
  { symbol: 'Ds', name: 'Darmstadtium', atomicNumber: 110, atomicMass: 281, category: 'transition', isReal: true },
  { symbol: 'Rg', name: 'Roentgenium', atomicNumber: 111, atomicMass: 272, category: 'transition', isReal: true },
  { symbol: 'Cn', name: 'Copernicium', atomicNumber: 112, atomicMass: 285, category: 'transition', isReal: true },
  { symbol: 'Nh', name: 'Nihonium', atomicNumber: 113, atomicMass: 286, category: 'postTransition', isReal: true },
  { symbol: 'Fl', name: 'Flerovium', atomicNumber: 114, atomicMass: 289, category: 'postTransition', isReal: true },
  { symbol: 'Mc', name: 'Moscovium', atomicNumber: 115, atomicMass: 290, category: 'postTransition', isReal: true },
  { symbol: 'Lv', name: 'Livermorium', atomicNumber: 116, atomicMass: 293, category: 'postTransition', isReal: true },
  { symbol: 'Ts', name: 'Tennessine', atomicNumber: 117, atomicMass: 294, category: 'metalloid', isReal: true },
  { symbol: 'Og', name: 'Oganesson', atomicNumber: 118, atomicMass: 294, category: 'noble', isReal: true },
];

export const getElementBySymbol = (symbol: string): Element | undefined => {
  return elements.find(element => element.symbol.toLowerCase() === symbol.toLowerCase());
};

export const getAllElements = (): Element[] => {
  return elements;
}; 