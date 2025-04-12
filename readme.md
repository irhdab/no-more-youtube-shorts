# No Shorts - YouTube Shorts Blocker

A browser extension that removes YouTube Shorts content from your YouTube browsing experience.

![YouTube Shorts Blocker Screenshot](/icons/icon128.png)

## Description

No Shorts is a lightweight browser extension that allows you to block YouTube Shorts content across the entire YouTube platform. With a simple toggle in the extension popup, you can remove Shorts from:

- Homepage feed
- Search results
- Channel pages
- Sidebar recommendations
- Navigation menu

The extension also automatically redirects any Shorts URLs to their standard video player equivalent, giving you a consistent viewing experience.

## Features

- **Simple Toggle**: Enable or disable the blocker with a single click
- **Clean & Modern UI**: Dark glassmorphism design that fits YouTube's aesthetic
- **Mobile Responsive**: Works on both desktop and mobile YouTube interfaces
- **Multiple Blocking Methods**:
  - Hides Shorts sections completely
  - Removes individual Shorts videos
  - Hides Shorts filter chips in search
  - Redirects Shorts URLs to regular video player

### Firefox

1. Visit the [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/) page for this extension
2. Click "Add to Firefox"
3. Confirm the installation

## Usage

1. Click on the No Shorts icon in your browser's toolbar
2. Toggle the switch to enable or disable the Shorts blocker
3. The status indicator will show green when enabled
4. Refresh any open YouTube tabs for the changes to take effect immediately

## Privacy & Permissions

This extension requires minimal permissions:

- **activeTab**: To detect and block Shorts content
- **storage**: To save your preference (enabled/disabled)

No data is collected, transmitted, or shared with third parties.

## Development

### Building from source

1. Clone this repository:
   ```
   git clone https://github.com/r3dhulk/youtube-shorts-blocker.git
   ```
2. Make any desired modifications
3. Load the unpacked extension in your browser:
   - Chrome: Open `chrome://extensions/`, enable Developer mode, and click "Load unpacked"
   - Firefox: Open `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on", and select the manifest file

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have suggestions for improvements, please open an issue on the GitHub repository.

---

Made with ❤️ by R3DHULK