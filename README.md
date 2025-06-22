# YouTube Playlist Focus Mode

Transform YouTube playlists into a distraction-free learning interface.

## Table of Contents

* [Installation](#installation)
* [Usage](#usage)
* [Features](#features)
* [File Structure](#file-structure)
* [Technologies](#technologies)
* [Contributing](#contributing)
* [License](#license)

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Shreya6901/Learn-Flow.git
   cd Learn-Flow
   ```
2. **Load the extension in Chrome**

   * Open chrome://extensions/ in your browser
   * Enable Developer mode
   * Click Load unpacked and select the Learn-Flow directory

## Usage

1. Navigate to a YouTube playlist 
2. Click the red Focus Mode button in the top right corner, or open the extension popup and click Enable Focus Mode
3. The interface will transform into a distraction-free mode:

   * Hides related videos, comments, and suggestions
   * Displays a custom course progress sidebar
   * Allows you to take and save notes for each video
4. To exit Focus Mode, click Exit Focus or disable it via the popup

## Features

* **Distraction Removal**
  Hides elements like related videos, comments, and sidebar suggestions 
* **Course Progress**
  Shows current video index and total videos in the playlist
* **Per-Video Notes**
  Write, auto-save, and persist notes for each video using chrome storage sync 
* **SPA Navigation Support**
  Automatically updates when YouTube single page navigation changes URLs
* **Custom Interface**
  Injects a clean focus oriented sidebar with interactive controls

## File Structure

```
Learn-Flow/
├── manifest.json        # Extension metadata and permissions ([github.com](https://github.com/Shreya6901/Learn-Flow/raw/main/manifest.json))
├── content.js           # Content script for injecting focus mode features ([github.com](https://github.com/Shreya6901/Learn-Flow/raw/main/content.js))
├── popup.html           # Popup UI for enabling and disabling focus mode
├── popup.js             # Popup logic and messaging with content script
├── styles.css           # Styles for focus interface
└── .DS_Store            # macOS directory file ignore
```

## Technologies

* Chrome Extensions Manifest V3
* JavaScript ES6+
* HTML5 and CSS3

## Contributing

Contributions are welcome. Please open an issue or submit a pull request with improvements or bug fixes.

