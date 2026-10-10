# Focus Friend 🐾

A cute Chrome extension study buddy by Erini, Arly & Sydney.

## Features
- Small draggable animal buddy injected into ordinary webpages
- Study timer, health, points, streaks, and a tiny reward shop
- Flags configurable distracting domains while a session is running
- Saves game state locally with `chrome.storage.local`
- Chrome side panel dashboard

## Install locally (Chrome)
1. Unzip the project.
2. Open `chrome://extensions`.
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select this project folder.
5. Pin Focus Friend if desired. Click its toolbar icon to open the dashboard.
6. Open a regular `https://` or `http://` page to see the floating pet.

## Notes / limitations
- This MVP injects a pet into ordinary webpages. It cannot appear on `chrome://` pages, the Chrome Web Store, some protected pages, or outside the browser.
- Website detection is domain-list based, not AI classification. You can edit the distraction list in the side panel.
- The pet is a small SVG cartoon dog for the MVP; distinct animal illustrations and animations are a next step.
- It does not read page contents or record browsing history; it checks the active tab's hostname to compare against the user's list.
- This is a hackathon prototype. Test timer/background behavior on your Chrome version before presenting.
