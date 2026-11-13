import self_ from "./FLicensesSummary.svelte";
import type CLicenses from "@Content/Features/Store/Licenses/CLicenses";
import Feature from "@Content/Modules/Context/Feature";
import { mount } from "svelte";
import {MountTargetError} from "@Core/Errors/Errors";

export default class FLicensesSummary extends Feature<CLicenses> {

    override async isEnabled(): Promise<boolean> {
        return true; // FIXME add setting
    }

    override async apply(): Promise<string|null> {
        let target = document.querySelector(".youraccount_page");
        if (!target) {
            throw new MountTargetError()
        }

        mount(self_, {
            target,
            anchor: target.firstElementChild ?? undefined,
        });
        return null;
    }
}
