import {SyncedStorage} from "../../../Core/Storage/SyncedStorage";
import {HTML} from "../../../Core/Html/Html";
import {Localization} from "../../../Core/Localization/Localization";

class ProgressBar {
    static create() {
        if (!SyncedStorage.get("show_progressbar")) { return; }

        HTML.afterEnd("#global_actions",
            `<div class="es_progress__wrap">
                <div class="es_progress es_progress--complete" title="${Localization.str.ready.ready}">
                    <div class="es_progress__bar">
                        <div class="es_progress__value"></div>
                    </div>
                </div>
            </div>`);
        ProgressBar._progress = document.querySelector(".es_progress");
    }

    static loading() {
        if (!ProgressBar._progress) { return; }

        ProgressBar._progress.setAttribute("title", Localization.str.ready.loading);

        ProgressBar.requests = {"initiated": 0, "completed": 0};
        ProgressBar._progress.classList.remove("es_progress--complete");
        ProgressBar._progress.querySelector(".es_progress__value").style.width = "18px";
    }

    static startRequest() {
        if (!ProgressBar.requests) { return; }
        ProgressBar.requests.initiated++;
        ProgressBar.progress();
    }

    static finishRequest() {
        if (!ProgressBar.requests) { return; }
        ProgressBar.requests.completed++;
        ProgressBar.progress();
    }

    static progress(value) {
        if (!ProgressBar._progress) { return; }

        let _value = value;

        if (!_value) {
            if (!ProgressBar.requests) { return; }
            if (ProgressBar.requests.initiated > 0) {
                _value = 100 * ProgressBar.requests.completed / ProgressBar.requests.initiated;
            }
        }
        if (_value > 100) {
            _value = 100;
        }

        ProgressBar._progress.querySelector(".es_progress__value").style.width = `${_value}px`;

        if (_value >= 100) {
            ProgressBar._progress.classList.add("es_progress--complete");
            ProgressBar._progress.setAttribute("title", Localization.str.ready.ready);
            ProgressBar.requests = null;
        }
    }

    static serverOutage() {
        if (!ProgressBar._progress) { return; }

        ProgressBar._progress.classList.add("es_progress--warning");
        ProgressBar.requests = null;

        if (!ProgressBar._progress.parentElement.querySelector(".es_progress__warning, .es_progress__error")) {
            HTML.afterEnd(
                ProgressBar._progress,
                `<div class="es_progress__warning">${Localization.str.ready.server_outage}</div>`
            );
        }
    }

    static failed() {
        if (!ProgressBar._progress) { return; }

        const warningNode = ProgressBar._progress.parentElement.querySelector(".es_progress__warning");
        if (warningNode) {
            ProgressBar._progress.classList.remove("es_progress--warning"); // Errors have higher precedence
            warningNode.remove();
        }
        ProgressBar._progress.classList.add("es_progress--error");
        ProgressBar.requests = null;

        const nodeError = ProgressBar._progress.parentElement.querySelector(".es_progress__error");
        if (nodeError) {
            nodeError.textContent = Localization.str.ready.failed.replace("__amount__", ++ProgressBar._failedRequests);
        } else {
            HTML.afterEnd(
                ProgressBar._progress,
                `<div class="es_progress__error">${
                    Localization.str.ready.failed.replace("__amount__", ++ProgressBar._failedRequests)
                }</div>`
            );
        }
    }
}

ProgressBar._progress = null;
ProgressBar._failedRequests = 0;

export {ProgressBar};
