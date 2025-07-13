# Technical Architecture - Periodic Names

## Tech Stack

### Frontend
- **React 18** - Core framework for the single-page application
- **TypeScript** - Type safety for element matching algorithm and component props
- **Tailwind CSS** - Utility-first CSS for responsive design and element styling
- **Framer Motion** - Smooth animations for name transformations and element highlighting
- **Vite** - Fast development and build tooling

### Development Tools
- **ESLint + Prettier** - Code quality and formatting
- **React Testing Library** - Component testing
- **Vitest** - Unit testing framework

### Deployment
- **Vercel** - Zero-config deployment with automatic previews
- **Custom Domain** - periodicnames.com

## Project Structure

```
periodicnames/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── NameInput.tsx
│   │   ├── PeriodicTable.tsx
│   │   ├── ElementTile.tsx
│   │   ├── ResultDisplay.tsx
│   │   └── ShareButton.tsx
│   ├── hooks/
│   │   ├── useElementMatcher.ts
│   │   └── useAnimation.ts
│   ├── data/
│   │   ├── elements.ts
│   │   ├── fakeElements.ts
│   │   └── elementCategories.ts
│   ├── utils/
│   │   ├── elementMatcher.ts
│   │   ├── elementStyler.ts
│   │   └── animations.ts
│   ├── types/
│   │   └── index.ts
│   ├── styles/
│   │   └── globals.css
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.json
```

## Component Architecture

### Core Components

#### 1. Header.tsx
**Purpose**: Site branding and navigation
**Props**: None
**Features**: 
- Site title "Periodic Names"
- Subtitle "Find your name in the Periodic Table of Elements"
- Responsive design

#### 2. NameInput.tsx
**Purpose**: User input and form handling
**Props**: 
- `onSubmit: (name: string) => void`
- `isLoading: boolean`
**Features**:
- Text input with placeholder
- Inline up arrow submit button
- Form validation
- Loading state

#### 3. PeriodicTable.tsx
**Purpose**: Display interactive periodic table
**Props**:
- `highlightedElements: string[]`
- `onElementClick?: (symbol: string) => void`
**Features**:
- Grid layout of all elements
- Highlighting for used elements
- Click interactions
- Responsive grid

#### 4. ElementTile.tsx
**Purpose**: Individual element display
**Props**:
- `element: Element`
- `isHighlighted: boolean`
- `isFake: boolean`
- `onClick?: () => void`
**Features**:
- Square tile design per specifications
- Atomic number, symbol, name, mass
- Color coding for categories
- Fake element styling
- Hover effects

#### 5. ResultDisplay.tsx
**Purpose**: Show name transformation result
**Props**:
- `result: NameResult`
- `isVisible: boolean`
**Features**:
- Animated element breakdown
- Element names and atomic numbers
- Copy-to-clipboard functionality
- Share buttons

#### 6. ShareButton.tsx
**Purpose**: Social media sharing
**Props**:
- `result: NameResult`
**Features**:
- Twitter, Facebook, LinkedIn sharing
- Custom share text generation

### Custom Hooks

#### useElementMatcher.ts
**Purpose**: Core algorithm logic
**Returns**:
- `matchName: (name: string) => NameResult`
- `isLoading: boolean`
- `error: string | null`

#### useAnimation.ts
**Purpose**: Animation state management
**Returns**:
- `triggerAnimation: () => void`
- `animationState: AnimationState`

## Data Models

### Element Type
```typescript
interface Element {
  symbol: string;
  name: string;
  atomicNumber: number;
  atomicMass: number;
  category: ElementCategory;
  isReal: boolean;
}
```

### NameResult Type
```typescript
interface NameResult {
  originalName: string;
  elements: Element[];
  fakeElements: FakeElement[];
  totalElements: number;
  realElementsCount: number;
}
```

### FakeElement Type
```typescript
interface FakeElement {
  symbol: string;
  name: string;
  color: string;
}
```

## Algorithm Strategy

### Element Matching Algorithm
1. **Preprocessing**: Convert input to uppercase, remove spaces
2. **Greedy Matching**: Try longest possible real element symbols first
3. **Fallback Strategy**: Use shorter real elements when needed
4. **Fake Elements**: Only as last resort, minimize count
5. **Optimization**: Return combination with fewest total elements

### Implementation Approach
```typescript
function matchName(name: string): NameResult {
  const normalizedName = name.toUpperCase().replace(/\s/g, '');
  const realElements = getAllRealElements();
  const fakeElements = getFakeElements();
  
  // Try to match with real elements first
  let result = tryMatchWithRealElements(normalizedName, realElements);
  
  // Fill gaps with fake elements
  result = fillGapsWithFakeElements(result, fakeElements);
  
  return result;
}
```

## State Management

### Local State (useState)
- Current input value
- Loading states
- Animation states
- Error states

### No Global State Needed
- Simple prop drilling sufficient for this app
- No complex state management required

## Styling Strategy

### Tailwind Configuration
- Custom color palette for element categories
- Responsive breakpoints
- Animation utilities
- Custom element tile styling

### Element Categories Colors
```typescript
const categoryColors = {
  alkali: 'bg-red-100',
  alkaline: 'bg-orange-100',
  transition: 'bg-yellow-100',
  postTransition: 'bg-green-100',
  metalloid: 'bg-blue-100',
  nonmetal: 'bg-purple-100',
  noble: 'bg-pink-100',
  lanthanide: 'bg-indigo-100',
  actinide: 'bg-gray-100',
  fake: 'bg-gray-200 border-dashed'
};
```

## Performance Considerations

### Optimization Strategies
- **Memoization**: Cache element matching results
- **Lazy Loading**: Load fake elements on demand
- **Virtual Scrolling**: For large periodic table (if needed)
- **Image Optimization**: Use SVGs for element symbols

### Bundle Size
- Tree-shaking for unused elements
- Code splitting for animations
- Optimized element data structure

## Testing Strategy

### Unit Tests
- Element matching algorithm
- Utility functions
- Component rendering

### Integration Tests
- End-to-end name transformation
- Animation flows
- Responsive behavior

### Manual Testing
- Cross-browser compatibility
- Mobile responsiveness
- Animation performance

## Deployment Pipeline

### Development
- `npm run dev` - Vite dev server
- `npm run test` - Unit tests
- `npm run build` - Production build

### Production
- Vercel automatic deployment
- Custom domain configuration
- Analytics integration (optional)

## Future Considerations

### Print-on-Demand Integration
- API endpoints for result sharing
- Image generation for products
- Payment processing integration

### Analytics
- User interaction tracking
- Popular names analysis
- Performance monitoring

### SEO
- Meta tags for social sharing
- Structured data for search engines
- Sitemap generation 