"use strict";

import Options from "./OptionsPage.svelte";

document.addEventListener("DOMContentLoaded", function() {
    let root = document.querySelector("#options");
    if (!root) { return; }

    new Options({
        target: root
    });
});
