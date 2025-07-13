export interface FakeElement {
  symbol: string;
  name: string;
  color: string;
}

export const fakeElements: FakeElement[] = [
  { symbol: 'A', name: 'Arium', color: '#E5E7EB' },
  { symbol: 'D', name: 'Dium', color: '#E5E7EB' },
  { symbol: 'E', name: 'Elium', color: '#E5E7EB' },
  { symbol: 'G', name: 'Gium', color: '#E5E7EB' },
  { symbol: 'I', name: 'Ium', color: '#E5E7EB' },
  { symbol: 'J', name: 'Jium', color: '#E5E7EB' },
  { symbol: 'K', name: 'Kium', color: '#E5E7EB' },
  { symbol: 'L', name: 'Lium', color: '#E5E7EB' },
  { symbol: 'M', name: 'Mium', color: '#E5E7EB' },
  { symbol: 'N', name: 'Nium', color: '#E5E7EB' },
  { symbol: 'O', name: 'Oium', color: '#E5E7EB' },
  { symbol: 'P', name: 'Pium', color: '#E5E7EB' },
  { symbol: 'Q', name: 'Qium', color: '#E5E7EB' },
  { symbol: 'R', name: 'Rium', color: '#E5E7EB' },
  { symbol: 'S', name: 'Sium', color: '#E5E7EB' },
  { symbol: 'T', name: 'Tium', color: '#E5E7EB' },
  { symbol: 'U', name: 'Uium', color: '#E5E7EB' },
  { symbol: 'V', name: 'Vium', color: '#E5E7EB' },
  { symbol: 'W', name: 'Wium', color: '#E5E7EB' },
  { symbol: 'X', name: 'Xium', color: '#E5E7EB' },
  { symbol: 'Y', name: 'Yium', color: '#E5E7EB' },
  { symbol: 'Z', name: 'Zium', color: '#E5E7EB' },
];

export const getFakeElementBySymbol = (symbol: string): FakeElement | undefined => {
  return fakeElements.find(element => element.symbol.toLowerCase() === symbol.toLowerCase());
};

export const getAllFakeElements = (): FakeElement[] => {
  return fakeElements;
}; 