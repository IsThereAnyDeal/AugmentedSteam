import Settings from "@Options/Data/Settings";

export default function external(node: HTMLAnchorElement): void {
    const OpenInNewTab = Settings.openinnewtab;
    if (!OpenInNewTab) { return; }

    node.target = "_blank";
    node.rel = "noreferrer noopener";
}
