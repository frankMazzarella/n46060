# N46060 Weight & Balance

Weight and balance calculator for N46060, a 1968 Cessna 172I. Enter what is on board and it checks takeoff and landing against the normal or utility category weight and CG limits, with the result plotted on the handbook's CG moment envelope.

**Planning aid only.** The pilot in command is responsible for the final weight and balance. The station arms and envelope limits were read from photographs of the handbook graphs and are not yet verified. See [`docs/aircraft-data.md`](docs/aircraft-data.md).

**Open items.** Six things must be settled before this is relied on, and the first is a limit that may be too generous in the dangerous direction. They are listed in [`TODO.md`](TODO.md), and the matching spots in the code carry `TODO(Vn)` comments (`grep -rn "TODO(V" src`).

## Development

Requires Node 22 (see `.nvmrc`).

```sh
npm ci
npm run dev       # dev server
npm run verify    # typecheck, lint, format check, tests, build
```

## Structure

The code is split into model, controller and view. Dependencies point one way: view → controller → model.

```
src/
  model/        pure weight and balance logic and the N46060 data
  controller/   form state, input parsing, and the hook that connects them to the model
  view/         React components, formatting, and user-facing wording
```

For reviewers, start with [`docs/review-guide.md`](docs/review-guide.md).

## Deployment

Pushes to `main` run `npm run verify` and deploy to GitHub Pages through `.github/workflows/deploy.yml`. In the repository settings, Pages must use **GitHub Actions** as its source. The custom domain is also set there.
