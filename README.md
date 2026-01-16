# Sungrow iSolarCloud Monitor

A Firefox/Chrome extension that monitors your Sungrow solar plants and devices in real-time.

## Features

- **Plant Selection**: Browse and select from all your registered iSolarCloud plants.
- **Real-Time Monitoring**: View live plant status, type, and communication status.
- **Detailed Device List**: See all devices (Inverters, Batteries, Loggers) with status-based icons (Normal, Fault, Alarm).
- **Specialized Battery Support**: Real-time State of Charge (SOC) percentage display for battery devices.

## Installation

### From Source (Development)

1. Clone the repository.
2. Install dependencies:
   ```bash
   bun install
   ```
3. Build the extension:
   ```bash
   bun run build
   ```
4. Load in Browser:
   - **Firefox**: Go to `about:debugging` -> This Firefox -> Load Temporary Add-on -> Select `dist/manifest.json`.
   - **Chrome/Edge**: Go to `chrome://extensions` -> Enable "Developer mode" -> Load unpacked -> Select the `dist` folder.

## Usage

### Prerequisites

1. Get your **App Key** and **Secret Key** from the [Sungrow Developer Portal](https://developer-api.isolarcloud.com).
2. Use your existing **iSolarCloud** username and password.

### Configuration

1. Click the addon icon.
2. Enter your credentials in the Login screen.
3. Once authenticated:
   - Select your **Country/Gateway** from the dropdown.
   - Select your **Plant** to see live performance data.
   - View the **Devices** list for specific hardware status and SOC.

## Tech Stack

- **Framework**: [React](https://reactjs.org/)
- **Bundler**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Language**: TypeScript

## Security

- Credentials and tokens are stored using the `browser.storage.local` API.
- All communications are strictly between your browser and the official Sungrow Global APIs.
