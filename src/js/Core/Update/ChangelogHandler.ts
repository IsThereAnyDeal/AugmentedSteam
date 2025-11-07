import Version from "@Core/Version";
import Info from "@Core/Info";
import Settings from "@Options/Data/Settings";
import Changelog from "@Core/Update/Changelog.svelte";
import { mount, unmount } from "svelte";

export default class ChangelogHandler {

    static async checkVersion(): Promise<void> {
        const lastVersion = Version.fromString(Settings.version);
        const currentVersion = Version.fromString(Info.version);

        if (currentVersion.isAfter(lastVersion) && Settings.version_show) {
            const changelog = mount(Changelog, {
                            target: document.body,
                            props: {lastVersion}
                        });
            changelog.$on("close", () => unmount(changelog));
        }

        Settings.version = Info.version;
    }
}
