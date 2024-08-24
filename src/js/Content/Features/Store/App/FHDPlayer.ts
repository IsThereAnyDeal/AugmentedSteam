import LocalStorage from "@Core/Storage/LocalStorage";
import TimeUtils from "@Core/Utils/TimeUtils";
import type {IResettableTimer} from "@Core/Utils/TimeUtils";
import Feature from "@Content/Modules/Context/Feature";
import type CApp from "@Content/Features/Store/App/CApp";

export default class FHDPlayer extends Feature<CApp> {

    override checkPrerequisites(): boolean {
        return document.querySelector("div.highlight_movie") !== null;
    }

    override apply(): void {
        for (const container of document.querySelectorAll<HTMLDivElement>("div.highlight_movie")) {

            // Check if the video has already loaded
            if (container.children[0] instanceof HTMLVideoElement) {
                this._addHDControl(container);
                this._addMouseMoveHandler(container);
                continue;
            }

            // Apply features to each video as it's added to the DOM
            new MutationObserver((_, observer) => {
                // The video may fail to load, but just disconnect for now
                observer.disconnect();

                if (container.children[0] instanceof HTMLVideoElement) {
                    this._addHDControl(container);
                    this._addMouseMoveHandler(container);
                }
            }).observe(container, {"childList": true});
        }
    }

    private async _clickHDControl(): Promise<void> {
        const playInHD = await LocalStorage.get("playback_hd") ?? false;

        // When the "HD" button is clicked change the definition for all videos accordingly
        for (const node of document.querySelectorAll<HTMLVideoElement>("video.highlight_movie")) {
            this.context.toggleVideoDefinition(node, !playInHD);
        }

        await LocalStorage.set("playback_hd", !playInHD);
    }

    private async _addHDControl(container: HTMLElement): Promise<void> {
        const video = container.children[0] as HTMLVideoElement;

        const btn = document.createElement("div");
        btn.classList.add("es_hd_toggle");
        btn.textContent = "HD";
        btn.addEventListener("click", () => { this._clickHDControl(); });
        container.querySelector(".time")!.after(btn);

        // Toggle fullscreen on double click
        video.addEventListener("dblclick", () => {
            container.querySelector<HTMLButtonElement>(".fullscreen_button")!.click();
        });

        this.context.toggleVideoDefinition(video, (await LocalStorage.get("playback_hd")) ?? false);
    }

    private _addMouseMoveHandler(container: HTMLElement): void {
        // There may be a 3rd element - the titlebar, but Steam hides it after playing the video for 5s
        const children = container.children;
        const video: HTMLVideoElement = children[0] as HTMLVideoElement;
        const overlay: HTMLElement = children[1] as HTMLElement;

        let timer: IResettableTimer|null = null;

        video.addEventListener("mousemove", () => {
            if (timer) {
                timer.reset();
                video.style.cursor = "";
                overlay.style.bottom = "0px";
            } else {
                timer = TimeUtils.resettableTimer(() => {
                    video.style.cursor = "none";
                    overlay.style.bottom = "-35px";
                }, 2000);
            }
        });

        video.addEventListener("mouseleave", () => {
            // Avoid hiding the overlay when moving the cursor from video to overlay
            timer?.stop();
        });
    }
}
