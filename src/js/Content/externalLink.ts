import {SyncedStorage} from "../modulesCore";

const OpenInNewTab = SyncedStorage.get("openinnewtab");

export default function external(node: HTMLAnchorElement): void {
    if (!OpenInNewTab) { return; }

    node.target = "_blank";
    node.rel = "noreferrer noopener";
}
