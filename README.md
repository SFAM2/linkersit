# LinkersIT

A responsive LinkersIT website based on the supplied screenshot, assets and animated HTML reference. Uses locally served Cabin, purple brand colors, selected original illustrations and partner logos.

## Run

Requires Node.js 18 or newer. No package installation is necessary.

```sh
node server.mjs
```

Open http://localhost:3000.

## Build

```sh
node build.mjs
```

Deploy the contents of `dist` to a static host. The website uses relative asset paths and has no external runtime dependencies.

## Contact and updates

The forms validate input and prepare an email to `contact@linkersit.com` in the visitor’s email application. They do not send messages or subscribe visitors automatically. The UI states this explicitly. Connect a form delivery service and newsletter provider before enabling automatic submission.

Contact details were transcribed from the supplied screenshot, including the second phone number. Confirm the number before publishing: its +213 prefix differs from Tunisia’s country code.

## Accessibility and motion

Includes semantic sections, labelled fields, keyboard focus styles, a skip link, mobile navigation with Escape handling, responsive layouts, and reduced-motion support. Content remains visible without animation support.

## Verification

`verify.mjs` exercises real Chromium using Playwright and Microsoft Edge. Set `PLAYWRIGHT_PATH` to a local Playwright module if running outside this workspace. Start the server, then run `node verify.mjs`.

Checks include responsive overflow, image/font loading, navigation, mobile menu, form validation, email draft contents and reduced-motion behavior. Email delivery requires a visitor’s configured mail application and is not automated by the site.
