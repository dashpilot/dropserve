# DropServe

A lightweight browser-based tool for instantly previewing static websites with just a drag and drop.

![DropServe Screenshot](https://placehold.co/600x400?text=DropServe)

## What is DropServe?

DropServe is a zero-setup local development server for static websites. It eliminates the tedious workflow of opening a code editor and running a server command just to preview your static site. Simply drag your project folder onto the DropServe interface, and it instantly serves and displays your site.

## Features

- 🖱️ **Drag & Drop Interface** - Just drag your folder onto the browser window
- 👁️ **Instant Preview** - See your site rendered immediately with all assets
- 📱 **Works with Modern Frameworks** - Compatible with Vite, Webpack, and other bundlers
- 🔄 **Asset Path Resolution** - Properly handles absolute paths (e.g., `/assets/main.js`)
- 🏃‍♂️ **Zero Setup** - No installation, no command line, no dependencies
- 🔒 **Fully Local** - Everything runs in your browser, files never leave your computer

## How to Use

1. Download the `index.html` and `dropserve.js` files to the same folder
2. Open `index.html` in a modern browser (Chrome, Edge, or other Chromium-based browsers)
3. Drag your static site folder onto the drop area (or click to select a folder)
4. View your site instantly in the preview

## How It Works

DropServe uses a combination of modern browser APIs to create a virtual server right in your browser:

1. **File System Access API** - To read files from your local folder
2. **Message Passing** - To communicate between the parent window and iframe
3. **Network Interception** - To serve local files in response to requests from your site
4. **Blob URLs** - To represent your files in a way the browser can access

This approach means your site runs just like it would on a real server, maintaining all the behaviors and interactions that make your site work.

## Browser Compatibility

DropServe requires the File System Access API, which is currently supported in:

- Google Chrome (version 86+)
- Microsoft Edge (version 86+)
- Other Chromium-based browsers (Opera, Brave, etc.)

## Use Cases

- Quick previews during development
- Teaching web development without complicated tooling
- Checking outputs from static site generators
- Previewing sites built with modern frameworks (React, Vue, etc.)
- Testing downloaded templates or themes

## Limitations

- Works only in browsers that support the File System Access API
- Does not support server-side functionality (APIs, databases, etc.)
- Cannot access resources from different domains unless they allow CORS

## License

MIT

---

Created with ❤️ to simplify the web development workflow
