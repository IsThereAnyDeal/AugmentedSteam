import type Context from "@Content/Modules/Context/Context";
import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";
import {__viewinclient} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import "./FInstallSteamButton.css";

export default class FInstallSteamButton extends Feature<Context> {

    public override async checkPrerequisites(): Promise<boolean> {
        return Settings.installsteam !== "show";
    }

    public override async apply(): Promise<void> {
        const react = this.context.isReact;

        const btn = document.querySelector<HTMLAnchorElement>(react
            ? "header nav ~ div a[href*='/about/']"
            : "a.header_installsteam_btn"
        );
        if (!btn) {
            console.error(`Couldn't find "Install Steam" button element.`);
            return;
        }

        if (Settings.installsteam === "hide") {
            btn.remove();
        } else if (Settings.installsteam === "replace") {
            if (react) {
                btn.textContent = L(__viewinclient);
                btn.classList.add("is-react");
            } else {
                btn.querySelector("div")!.textContent = L(__viewinclient);
            }

            btn.href = `steam://openurl/${window.location.href}`;
            btn.classList.add("as_steamclient_btn");
        }
    }
}