import Options from "./OptionsPage.svelte";
import Environment, {ContextType} from "@Core/Environment";

Environment.CurrentContext = ContextType.Options;

document.addEventListener("DOMContentLoaded", function() {
    let root = document.querySelector("#options");
    if (!root) { return; }

    new Options({
        target: root
    });
});
