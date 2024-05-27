import self_ from "./ProgressBar.svelte";
import Settings from "@Options/Data/Settings";

export default function ProgressBar(): void {
    if (!Settings.show_progressbar) {
        return;
    }

    const globalActions = document.querySelector("#global_actions");
    if (!globalActions) {
        return;
    }

    new self_({
        target: globalActions.parentElement!,
        anchor: globalActions.nextElementSibling ?? undefined
    });
}
