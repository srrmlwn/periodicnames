# Periodic Names

A fun web application that finds your name in the Periodic Table of Elements! Enter any name and watch as the app discovers how many letters can be constructed using chemical element symbols.

## What it does

This application takes a name as input and uses a recursive algorithm to find the optimal way to construct that name using chemical element symbols from the periodic table. For example:

- **"John"** becomes **J-O-H-N** (using elements: J, O, H, N)
- **"Sarah"** becomes **S-Ar-A-H** (using elements: S, Ar, A, H)
- **"Michael"** becomes **Mi-C-H-A-E-L** (using elements: Mi, C, H, A, E, L)

## Vision & Roadmap

### Phase 1: Modernize Code & UX (2-3 weeks)
- Mobile responsiveness and modern design
- Code cleanup and optimization
- Enhanced error handling and user experience

### Phase 2: Launch (1 week)
- Domain setup (periodicnames.com)
- Analytics and performance monitoring
- Production deployment

### Phase 3: Social Media Sharing (2-3 weeks)
- Image generation for social sharing
- Integration with Twitter, Facebook, Instagram
- Optimized share cards for viral growth

### Phase 4: Print on Demand (3-4 weeks)
- T-shirt design and production
- Integration with print-on-demand services
- Payment processing and order fulfillment

### Phase 5: UX Enhancements (2-3 weeks)
- Theme system and customization options
- Advanced features and element information
- User preferences and settings

### Phase 6: Video Content (4-6 weeks)
- TikTok/Instagram Reels generation
- Animated videos showing element selection
- Platform-optimized content creation

## Features

- **Interactive Periodic Table**: A visual representation of the periodic table that highlights elements as they're used
- **Smart Algorithm**: Uses recursion to find the best possible combination of elements to spell your name
- **Fake Elements**: When letters can't be found in real elements, the app creates "fake elements" to complete the name
- **Animated Results**: Elements are highlighted one by one with smooth animations
- **Social Sharing**: Share your results on social media with custom images
- **Responsive Design**: Works on both desktop and mobile devices

## How it works

### The Algorithm (`periodicnames.js`)
The core algorithm uses recursion to try different combinations of element symbols:

1. **Element Matching**: For each position in the name, it tries:
   - Single letter elements (H, O, N, etc.)
   - Two-letter elements (He, Li, Be, etc.)
   - Skipping vowels when they can't be matched
   - Skipping any character that can't be matched

2. **Optimization**: The algorithm finds the combination that:
   - Covers the most letters possible
   - Uses the fewest elements when covering the same number of letters

### Animation System (`solveAndAnimate.js`)
- Elements are highlighted sequentially with configurable timing
- Results are displayed with smooth fade-in animations
- Fake elements are styled differently (red background)
- Social sharing is enabled after the animation completes

### Visual Design (`styles.css`)
- Clean, modern interface with a blue color scheme
- Hover effects that scale elements for better visibility
- Responsive design that adapts to different screen sizes
- Custom styling for fake elements and selected states

## Technical Details

- **Frontend**: HTML5, CSS3, JavaScript (jQuery)
- **Backend**: PHP (for URL parameter handling)
- **Dependencies**: 
  - jQuery 1.11.1
  - Bootstrap 3.2.0
  - Google Fonts (Titillium Web)
  - Twitter Widgets API
  - Google Analytics

## Usage

1. Open `index.php` in a web browser
2. Enter any name in the input field
3. Click "Go!" or press Enter
4. Watch as the periodic table highlights elements that spell your name
5. Share your results on social media

## Example Results

- **"Alice"** → A-Li-C-E (Aluminum, Lithium, Carbon, Einsteinium)
- **"Bob"** → B-O-B (Boron, Oxygen, Boron)
- **"Charlie"** → C-H-Ar-Li-E (Carbon, Hydrogen, Argon, Lithium, Einsteinium)

## Development Status

### ✅ Completed
- Core algorithm and functionality
- Basic UI and animations
- Social sharing (basic implementation)
- Element highlighting system

### 🚧 In Progress
- Phase 1: Code modernization and mobile responsiveness

### 📋 Planned
- See roadmap above for detailed phases

## Business Model

The application will generate revenue through:
- **Print-on-Demand Products**: T-shirts, mugs, posters featuring personalized element combinations
- **Digital Products**: High-resolution images and wallpapers
- **Premium Features**: Advanced customization options and themes

## Author

Created by [@srrm_lwn](https://twitter.com/srrm_lwn) as a fun hack project.

## License

This project is open source and available under the MIT License.
