# DropServe

A browser-based static site server that lets you preview your projects instantly with just a drag and drop.

![DropServe Logo](https://placehold.co/600x400?text=DropServe)

## What is DropServe?

DropServe is a lightweight, browser-based tool that eliminates the tedious workflow of opening your code editor and running a server just to preview static websites. Simply drag your project folder onto the DropServe interface, and it instantly serves your files locally for preview.

## Features

- 🖱️ **Drag & Drop Interface** - Just drag your folder onto the browser window
- 🗂️ **Built-in File Explorer** - Browse your project structure with ease
- 👁️ **Instant Preview** - See your HTML, images, and SVGs rendered in real-time
- 🔍 **Code View with Syntax Highlighting** - Examine source code with proper highlighting
- 🏃‍♂️ **Zero Setup** - No installation, no command line, no dependencies
- 🔒 **Fully Local** - Your files never leave your computer

## Getting Started

1. Download the `dropserve.html` file
2. Open it in a modern browser (Chrome, Edge, or other Chromium-based browsers)
3. Drag your static site folder onto the drop area (or click to select a folder)
4. Start browsing and previewing your site instantly

## Browser Compatibility

DropServe uses the File System Access API, which is currently supported in:

- Google Chrome (version 86+)
- Microsoft Edge (version 86+)
- Other Chromium-based browsers (Opera, Brave, etc.)

## Use Cases

- Quick previews of static websites during development
- Teaching web development without complicated tooling setup
- Previewing HTML email templates
- Inspecting static site generator output
- Checking exported design prototypes

## Limitations

- Works only in browsers that support the File System Access API
- Complex sites with many interdependent files might have some import resolution issues
- ES modules with bare imports won't be automatically resolved

## License

MIT

## Author

Created with ❤️ to simplify the web development workflow
