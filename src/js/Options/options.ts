import Options from "./OptionsPage.svelte";
import Environment, {ContextType} from "@Core/Environment";
import { mount } from "svelte";

Environment.CurrentContext = ContextType.Options;

document.addEventListener("DOMContentLoaded", function() {
    let root = document.querySelector("#options");
    if (!root) { return; }

    mount(Options, {
            target: root
        });
});
