import self_ from "./ProgressBar.svelte";
import Settings from "@Options/Data/Settings";
import ReactDOM from "@Content/Steam/ReactDOM";

export default class ProgressBar {

    private static build(react: boolean, node: HTMLElement|null): void {
        if (!Settings.show_progressbar || !node) {
            return;
        }

        new self_({
            target: node.parentElement!,
            anchor: node.nextElementSibling ?? undefined,
            props: {react}
        });
    }

    static buildLegacy(): void {
        this.build(false, document.querySelector("#global_actions"));
    }

    static buildReact(): void {
        this.build(true, ReactDOM.globalActions());
    }
}
