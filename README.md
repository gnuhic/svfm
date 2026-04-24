# Salary Variance Forecast Model

Local-only web tool for in-year salary variance forecasting and actuals monitoring. Inputs and calculations stay in the browser unless you export a configuration file.

## Prerequisites

- [Node.js](https://nodejs.org/) 20 or newer (current LTS is recommended)

## Run locally (development)

```bash
npm install
npm run dev
```

The Vite dev server starts at [http://localhost:5173](http://localhost:5173) unless the terminal shows another port.

## Production build (static files, served locally)

```bash
npm install
npm run build
npx serve dist
```

Open the URL printed by `serve` (often [http://localhost:3000](http://localhost:3000)). Use this for a stable local demo without the dev server.

## Quality checks

```bash
npm test
npm run lint
```

## Data and privacy

Application state is stored in **browser local storage**. Clearing site data removes it. Use **Settings → Export configuration** to save a JSON file you can re-import later or move to another machine.

## Browsers

Primary development targets are **Chromium-based browsers** (Chrome, Edge). **Firefox** and **Safari** are expected to work for this stack; verify print layout with **Print preview** before board meetings.
