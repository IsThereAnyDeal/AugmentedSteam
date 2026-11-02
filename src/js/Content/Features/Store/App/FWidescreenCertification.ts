import self_ from "./FWidescreenCertification.svelte";
import type CApp from "@Content/Features/Store/App/CApp";
import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";
import {mount} from "svelte";
import {MountTargetError} from "@Core/Errors/Errors";

export default class FWidescreenCertification extends Feature<CApp> {

    override async isEnabled(): Promise<boolean> {
        return Settings.showwsgf && !this.context.isDlcLike && !this.context.isVideoOrHardware;
    }

    override async apply(): Promise<string|null> {
        const wsgf = (await this.context.data)?.wsgf;
        if (!wsgf) {
            return "No data";
        }

        const detailsNode = document.querySelector("div.game_details");
        if (!detailsNode) {
            throw new MountTargetError();
        }

        mount(self_, {
            target: detailsNode.parentElement!,
            anchor: detailsNode.nextElementSibling ?? undefined,
            props: {
                url: wsgf.url,
                wsg: wsgf.wide,
                mmg: wsgf.multi_monitor,
                fkg: wsgf["4k"],
                uws: wsgf.ultrawide
            }
        });
        return null;
    }
}
