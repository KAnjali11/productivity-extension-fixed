
# Chrome Extension - Personal Productivity Tracker (React)

This project is a React-based Chrome extension popup + background service worker that allows users to:
- Set a daily productivity goal (minutes)
- Add websites to track
- See today's tracked time per site
- Data is stored in chrome.storage

## How to build & load into Chrome (developer mode)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Build the React app:
   ```bash
   npm run build
   ```
   The build output will be placed in `build/`.
3. Copy `manifest.json` and `background.js` from `public/` into the `build/` folder manually (React build does not copy them automatically).
4. Load extension into Chrome:
   - Open `chrome://extensions/` in Chrome.
   - Enable "Developer mode".
   - Click "Load unpacked" and select the `build/` folder.
5. The extension's popup will appear when you click the extension icon.
   - The background service worker (background.js) runs in the background and tracks active time on sites added to the tracked list.

Notes:
- You must grant permissions requested in `manifest.json` when installing the unpacked extension.
- This is a simple tracker for demo/learning purposes and not optimized for production. It uses basic heuristics to measure active tab time.
