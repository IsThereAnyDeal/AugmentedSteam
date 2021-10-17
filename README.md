# Augmented Steam

[![chrome users](https://img.shields.io/chrome-web-store/users/dnhpnfgdlenaccegplpojghhmaamnnfp?label=chrome%20users&logo=googlechrome)](https://chrome.google.com/webstore/detail/augmented-steam/dnhpnfgdlenaccegplpojghhmaamnnfp)
[![firefox users](https://img.shields.io/amo/users/enhanced-steam-an-itad-fork?label=firefox%20users&color=4c1&logo=firefoxbrowser)](https://addons.mozilla.org/firefox/addon/enhanced-steam-an-itad-fork/)
[![edge users](https://img.shields.io/badge/dynamic/json?label=edge%20users&query=%24.activeInstallCount&url=https://microsoftedge.microsoft.com/addons/getproductdetailsbycrxid/dnpjkgmekpilchdgolfifobohlohlioc&logo=microsoftedge)](https://microsoftedge.microsoft.com/addons/detail/augmented-steam/dnpjkgmekpilchdgolfifobohlohlioc)

![eslint](https://github.com/tfedor/AugmentedSteam/workflows/eslint/badge.svg)

Enhanced Steam fork by IsThereAnyDeal.

This is an extension repository, find the [server repository here](https://github.com/tfedor/AugmentedSteam_Server).

We are commited to continue it's development, after the [original extension](https://github.com/jshackles/Enhanced_Steam) has ended its life.

Visit the [extension's page](https://augmentedsteam.com/) or our [Discord channel](https://discord.gg/yn57q7f) for more info.

## Development Setup

Run `npm install` to install the required packages.

### Building Extension

**Development build**
Run `npm run build firefox` or `npm run build chrome`

**Production build**
Run `npm run build firefox -- --production` or `npm run build chrome -- --production`

> *Note:* Run `npm run build -- --help` to see all available build options

### Hot Reload

During development, it might be convenient to run the hot reload server, so you don't need to reload the extension manually
after each build.

To do that, run build with the `--server` argument. Make sure to manually reload the extension first time after the build.
> *Example:* `npm run build -- firefox --server`

Now, for every change you make in the source code, the server will rebuild and reload the extension
and refresh all affected pages automatically.

In case the hot reload does not work or stops working, try restarting the server and reloading the extension manually.

## License

Enhanced Steam is Copyright 2012-2018 Jason Shackles.
This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License v3 or newer as published by the Free Software Foundation.  A copy of the GNU General Public License v3 can be found in [LICENSE](LICENSE) or at https://www.gnu.org/licenses/gpl-3.0.html.
