import self_ from "./FPlayers.svelte";
import Settings from "@Options/Data/Settings";
import Feature from "@Content/Modules/Context/Feature";
import type CApp from "@Content/Features/Store/App/CApp";
import { mount } from "svelte";

export default class FPlayers extends Feature<CApp> {

    override async checkPrerequisites(): Promise<boolean> {
        return Settings.show_players_info
            && !this.context.isDlcLike
            && !this.context.isVideoOrHardware;
    }

    override async apply(): Promise<void> {
        const players = (await this.context.data)?.players;
        if (!players) {
            return;
        }

        const target = document.querySelector(".rightcol.game_meta_data");
        if (!target) {
            throw new Error("Node not found");
        }

        mount(self_, {
            target,
            anchor: target.firstElementChild ?? undefined,
            props: {
                recent: players.recent,
                peakToday: players.peak_today,
                peakAll: players.peak_all
            }
        });
    }
}
