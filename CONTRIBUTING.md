# Contributing to Periodic Names

Thank you for your interest in contributing to Periodic Names! This document provides guidelines for contributing to the project.

## Project Overview

Periodic Names is a web application that finds names in the periodic table of elements. The project follows a simple, minimal approach focused on user experience and viral sharing.

## Development Philosophy

- **Keep it Simple**: Focus on core functionality
- **Mobile First**: Ensure great experience on mobile devices
- **No Accounts**: No user registration required
- **Instant Results**: Fast, responsive user experience
- **Easy Sharing**: One-click social media integration

## Current Development Phase

We're currently in **Phase 1: Modernize Code & UX**. See `task-list.md` for detailed tasks and priorities.

## Getting Started

### Prerequisites

- Web server with PHP support
- Modern web browser
- Basic knowledge of HTML, CSS, JavaScript, and PHP

### Local Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/periodicnames.git
   cd periodicnames
   ```

2. Set up a local web server (e.g., using PHP's built-in server):
   ```bash
   php -S localhost:8000
   ```

3. Open your browser and navigate to `http://localhost:8000`

## Project Structure

```
periodicnames/
├── index.php          # Main application file
├── css/
│   └── styles.css     # Main stylesheet
├── js/
│   ├── periodicnames.js    # Core algorithm
│   └── solveAndAnimate.js  # Animation system
├── README.md          # Project documentation
├── idea.md           # Project vision and brainstorming
├── task-list.md      # Development tasks and roadmap
├── CONTRIBUTING.md   # This file
├── LICENSE           # MIT License
└── .gitignore        # Git ignore rules
```

## Development Guidelines

### Code Style

- **HTML**: Use semantic HTML5 elements
- **CSS**: Follow BEM methodology for class naming
- **JavaScript**: Use ES6+ features, prefer const/let over var
- **PHP**: Follow PSR-12 coding standards

### Commit Messages

Use conventional commit format:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for adding tests
- `chore:` for maintenance tasks

Example:
```
feat: add mobile responsive design for periodic table
fix: resolve element highlighting issue on iOS
docs: update README with new roadmap
```

### Testing

Before submitting changes:
1. Test on multiple browsers (Chrome, Firefox, Safari, Edge)
2. Test on mobile devices
3. Test with various name inputs (short, long, special characters)
4. Verify animations work smoothly
5. Check that social sharing functions properly

## Feature Development

### Before Starting

1. Check the current phase in `task-list.md`
2. Ensure your feature aligns with the project's simple philosophy
3. Discuss major changes in an issue first

### During Development

1. Create a feature branch from `main`
2. Follow the coding guidelines
3. Test thoroughly
4. Update documentation if needed

### Submitting Changes

1. Push your branch to GitHub
2. Create a pull request
3. Provide a clear description of changes
4. Include screenshots for UI changes
5. Reference any related issues

## Current Priorities

### Phase 1 Tasks (In Progress)
- [ ] Mobile responsiveness
- [ ] Code cleanup and optimization
- [ ] Error handling improvements
- [ ] Interface polish

### Upcoming Phases
- Phase 2: Launch (domain, analytics)
- Phase 3: Social media sharing (images)
- Phase 4: Print on demand integration
- Phase 5: UX enhancements (themes)
- Phase 6: Video content generation

## Questions and Support

- Create an issue for bugs or feature requests
- Use discussions for general questions
- Check existing issues before creating new ones

## License

By contributing to Periodic Names, you agree that your contributions will be licensed under the MIT License. 