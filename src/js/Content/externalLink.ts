import Settings from "@Options/Data/Settings";
import type {Attachment} from "svelte/attachments";

const external: Attachment<HTMLAnchorElement> = (node: HTMLAnchorElement): void => {
     const OpenInNewTab = Settings.openinnewtab;
     if (!OpenInNewTab) { return; }

     node.target = "_blank";
     node.rel = "noreferrer noopener";
}
export default external;