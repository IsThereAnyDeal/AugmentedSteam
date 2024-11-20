/**
 * @contentScript
 * @match *://steamcommunity.com/tradeoffer/*
 */

import CTradeOffer from "./CTradeOffer";
import Localization from "@Core/Localization/Localization";
import {SettingsStore} from "@Options/Data/Settings";
import ApplicationConfig from "@Core/AppConfig/ApplicationConfig";
import LanguageFactory from "@Core/Localization/LanguageFactory";

(async function() {

    const appConfig = (new ApplicationConfig()).load();
    const language = (new LanguageFactory(appConfig)).createFromLegacy();

    try {
        await SettingsStore.init();
        await Localization.init(language);
    } catch (err) {
        console.group("Augmented Steam initialization");
        console.error("Failed to initialize Augmented Steam");
        console.error(err);
        console.groupEnd();
        return;
    }

    const context = new CTradeOffer();
    context.language = language;
    await context.applyFeatures();
})();
