[![Banner](.github/banner.png)](https://augmentedsteam.com/)

[![Chrome download link](https://user-images.githubusercontent.com/14999077/137792613-1a22f12c-9744-4dbe-b0f4-fcb78e197b16.png)](https://chrome.google.com/webstore/detail/augmented-steam/dnhpnfgdlenaccegplpojghhmaamnnfp)
[![Firefox download link](https://user-images.githubusercontent.com/14999077/137792665-c8a21478-49e4-49b9-bdd1-2ed441f22987.png)](https://addons.mozilla.org/firefox/addon/enhanced-steam-an-itad-fork/)
[![Edge download link](https://user-images.githubusercontent.com/14999077/137792554-21463932-9e19-4ea5-a0ec-15cd10effe16.png)](https://microsoftedge.microsoft.com/addons/detail/augmented-steam/dnpjkgmekpilchdgolfifobohlohlioc)

[![chrome users](https://img.shields.io/chrome-web-store/users/dnhpnfgdlenaccegplpojghhmaamnnfp?label=chrome%20users&logo=googlechrome)](https://chrome.google.com/webstore/detail/augmented-steam/dnhpnfgdlenaccegplpojghhmaamnnfp)
[![firefox users](https://img.shields.io/amo/users/enhanced-steam-an-itad-fork?label=firefox%20users&color=4c1&logo=firefoxbrowser)](https://addons.mozilla.org/firefox/addon/enhanced-steam-an-itad-fork/)
[![edge users](https://img.shields.io/badge/dynamic/json?label=edge%20users&query=%24.activeInstallCount&url=https://microsoftedge.microsoft.com/addons/getproductdetailsbycrxid/dnpjkgmekpilchdgolfifobohlohlioc&logo=microsoftedge)](https://microsoftedge.microsoft.com/addons/detail/augmented-steam/dnpjkgmekpilchdgolfifobohlohlioc)

![eslint](https://github.com/tfedor/AugmentedSteam/workflows/eslint/badge.svg)

Augmented Steam is a browser extension by [IsThereAnyDeal](https://isthereanydeal.com/) that improves your experience on the [Steam](https://store.steampowered.com/) platform by providing helpful information and tons of customization options.

Some selected features:
- Price details (current best, historical low) for any game or DLC sourced from many authorized stores
- More visible highlighting of games you own or have wishlisted or ignored (also works with your IsThereAnyDeal Waitlist and Collection!)
- Fine-tuned product search with search filters such as review count / score and Early Access
- Sort and filter options for the market, games, friends, groups, achievements, badges and reviews
- Links to popular websites with additional related information, plus the ability to add your own custom links
- Quick / Instant Sell items in your inventory
- Custom profile backgrounds and styles, visible to all users of Augmented Steam
- Take and store notes about any game
- Maximize information relevance by hiding unwanted content blocks from app pages or the homepage
- Automatically skip age gates for NSFW content
- Batch actions for various scenarios, e.g. registering multiple product keys or adding multiple DLCs to your cart at once
- And many more!

Augmented Steam is a fork and spiritual successor of [Enhanced Steam](https://github.com/jshackles/Enhanced_Steam), which has come to its end of life in February 2019.  
Visit the [extension's page](https://augmentedsteam.com/) for more information.

We like to help you on our [Discord server](https://discord.gg/yn57q7f) in the `#as-general` or `#as-bugs` channels.  
If you want to report a bug, please use this repository's [issue tracker](https://github.com/tfedor/AugmentedSteam/issues).

This is the repository for the extension, not the [server repository](https://github.com/tfedor/AugmentedSteam_Server).

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
