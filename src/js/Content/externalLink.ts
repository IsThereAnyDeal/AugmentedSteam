import {SyncedStorage} from "../modulesCore";

export default function external(node: HTMLAnchorElement): void {
    const OpenInNewTab = SyncedStorage.get("openinnewtab");
    if (!OpenInNewTab) { return; }

    node.target = "_blank";
    node.rel = "noreferrer noopener";
}
