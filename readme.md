# No Shorts - YouTube Shorts Blocker

A browser extension that removes YouTube Shorts content from your YouTube browsing experience with a modern, accessible interface.

![YouTube Shorts Blocker Screenshot](/icons/icon128.png)

## Features

- **Simple Toggle**: Enable or disable the blocker with a single click
- **Clean & Modern UI**: Dark glassmorphism design that fits YouTube's aesthetic
- **Mobile Responsive**: Works on both desktop and mobile YouTube interfaces
- **Multiple Blocking Methods**:
  - Hides Shorts sections completely
  - Removes individual Shorts videos
  - Hides Shorts filter chips in search
  - Redirects Shorts URLs to regular video player
- **Keyboard Shortcuts**: Quick toggle with keyboard shortcuts
- **Configuration Options**: Customize blocking behavior
- **Statistics**: Track blocking statistics (optional)
- **Cross-Browser Support**: Works on Chrome, Firefox, and Edge

## Installation

### Chrome/Edge

1. Download the extension from the [Chrome Web Store](https://chrome.google.com/webstore/detail/no-shorts-youtube-shorts-b/your-extension-id)
2. Click "Add to Chrome"
3. Confirm the installation

### Firefox

1. Visit the [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/) page for this extension
2. Click "Add to Firefox"
3. Confirm the installation

### Manual Installation (Development)

1. Clone this repository:
   ```bash
   git clone https://github.com/r3dhulk/youtube-shorts-blocker.git
   cd youtube-shorts-blocker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load the unpacked extension in your browser:
   - **Chrome**: Open `chrome://extensions/`, enable Developer mode, and click "Load unpacked"
   - **Firefox**: Open `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on", and select the manifest file

## Usage

### Basic Usage

1. Click on the No Shorts icon in your browser's toolbar
2. Toggle the switch to enable or disable the Shorts blocker
3. The status indicator will show green when enabled
4. Refresh any open YouTube tabs for the changes to take effect immediately

### Keyboard Shortcuts

- `Ctrl+Shift+S` (Windows/Linux) or `Cmd+Shift+S` (Mac): Toggle Shorts blocking
- `Ctrl+Shift+O` (Windows/Linux) or `Cmd+Shift+O` (Mac): Open extension popup

### Configuration Options

The extension supports various configuration options:

- **Block Shorts**: Main toggle for enabling/disabling
- **Redirect URLs**: Automatically redirect Shorts URLs to regular video player
- **Hide Navigation**: Remove Shorts from navigation menus
- **Hide Filter Chips**: Remove Shorts filter options in search
- **Hide Sections**: Remove entire Shorts sections
- **Hide Individual**: Remove individual Shorts videos
- **Keyboard Shortcuts**: Enable/disable keyboard shortcuts
- **Show Statistics**: Display blocking statistics
- **Auto Refresh**: Automatically refresh page on toggle
- **Mobile Optimized**: Optimize for mobile devices
- **Debug Mode**: Enable debug logging

## Development

### Project Structure

```
no-more-youtube-shorts/
├── services/           # Core services
│   ├── shorts-blocker.js
│   └── config-service.js
├── utils/             # Utility modules
│   ├── environment.js
│   └── storage.js
├── tests/             # Test files
│   ├── shorts-blocker.test.js
│   └── setup.js
├── icons/             # Extension icons
├── content.js         # Content script
├── background.js      # Background script
├── popup.js           # Popup script
├── manifest.json      # Extension manifest
└── package.json       # Dependencies and scripts
```

### Available Scripts

- `npm test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier
- `npm run build` - Build extension for production
- `npm run dev` - Build extension in development mode with watch
- `npm run validate` - Run linting and tests

### Testing

The project includes comprehensive unit tests:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Code Quality

The project uses ESLint and Prettier for code quality:

```bash
# Check code quality
npm run lint

# Fix code quality issues
npm run lint:fix

# Format code
npm run format
```

## Configuration

### Environment Variables

- `DEBUG_MODE`: Enable debug logging (default: false)
- `MOBILE_OPTIMIZED`: Optimize for mobile devices (default: true)

### Browser-Specific Settings

The extension automatically detects the browser environment and adjusts behavior accordingly:

- **Chrome**: Full feature support
- **Firefox**: Optimized for Firefox-specific APIs
- **Edge**: Compatible with Chromium-based Edge
- **Mobile**: Touch-optimized interface and performance optimizations

## Performance

The extension is optimized for performance:

- **Throttled Processing**: Prevents excessive DOM manipulation
- **Efficient Selectors**: Uses optimized CSS selectors
- **Memory Management**: Proper cleanup of observers and listeners
- **Mobile Optimization**: Reduced processing frequency on mobile devices

## Privacy & Security

This extension requires minimal permissions:

- **activeTab**: To detect and block Shorts content
- **storage**: To save your preferences

### Data Collection

- **No data is collected, transmitted, or shared** with third parties
- All settings are stored locally in your browser
- No analytics or tracking is implemented

### Security Features

- Content Security Policy (CSP) implementation
- Input validation and sanitization
- Secure storage handling
- Minimal permission requirements

## Contributing

We welcome contributions! Please follow these guidelines:

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Install dependencies: `npm install`
4. Make your changes
5. Run tests: `npm test`
6. Check code quality: `npm run lint`
7. Commit your changes: `git commit -m 'Add amazing feature'`
8. Push to the branch: `git push origin feature/amazing-feature`
9. Open a Pull Request

### Code Style

- Follow the existing code style
- Use ESLint and Prettier configurations
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

### Pull Request Guidelines

- Provide a clear description of changes
- Include tests for new functionality
- Ensure all tests pass
- Update documentation if needed
- Follow the existing code style

## Changelog

### Version 3.2.0
- Added modular architecture with services and utilities
- Improved configuration management
- Added comprehensive testing suite
- Enhanced documentation
- Improved security with CSP
- Performance optimizations
- Better code organization

### Version 3.1.0
- Fixed mobile detection issues
- Improved Firefox compatibility
- Performance improvements
- UI enhancements

### Version 3.0.0
- Complete rewrite with modern architecture
- New glassmorphism UI design
- Improved mobile support
- Better configuration options

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

### Getting Help

- **Issues**: Open an issue on GitHub for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions and ideas
- **Documentation**: Check this README and inline code documentation

### Common Issues

1. **Extension not working**: Ensure you're on a YouTube page and refresh the page
2. **Shorts still visible**: Try refreshing the page or toggling the extension off and on
3. **Mobile issues**: The extension works best on desktop; mobile support is limited

### Reporting Bugs

When reporting bugs, please include:

- Browser and version
- Extension version
- Steps to reproduce
- Expected vs actual behavior
- Console errors (if any)

## Acknowledgments

- YouTube for providing the platform
- Browser extension APIs
- Open source community
- Contributors and users