# Augmented Steam

Enhanced Steam fork by IsThereAnyDeal.

This is an extension repository, find [server repository here](https://github.com/tfedor/AugmentedSteam_Server).

We are commited to continue it's development, after the [original extension](https://github.com/jshackles/Enhanced_Steam) has ended its life.

Visit [extension's page](https://es.isthereanydeal.com/) or our [Discord channel](https://discord.gg/yn57q7f) for more info.

## Development Setup

1. Run `npm i` to install the required packages

### Manual building

2. Run `npm run build` to build the extension

You can supply the `build` script with extra parameters:
- The browser you want to build the extension for (`chrome` (default) or `firefox`)
- The build configuration (`dev` (default) or `prod`)

So if you wanted to build a release version for Firefox, you'd run `npm run build firefox prod`.

### Automatic rebuilding

2. Run `npm run start` in order to build the extension that will communicate with the Hot Extension Reload Server
3. Terminate the server and reload the extension manually
4. Run `npm run start` to start the Hot Extension Reload Server

Now, for every change you make in the source code, the server will rebuild and reload the extension and refresh all affected pages automatically.

Steps 2 & 3 only have to be done for the initial setup, afterwards step 4 will suffice.

## License

Augmented Steam uses Enhanced Steam's license.

Enhanced Steam is Copyright 2012-2018 Jason Shackles.  This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License v3 or newer as published by the Free Software Foundation.  A copy of the GNU General Public License v3 can be found in [LICENSE](LICENSE) or at https://www.gnu.org/licenses/gpl-3.0.html.
