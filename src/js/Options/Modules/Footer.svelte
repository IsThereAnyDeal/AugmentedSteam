<svelte:options immutable={false} />

<script lang="ts">
    import {
        __options_clear,
        __options_footerAuthor,
        __options_footerFork,
        __options_settingsMngmt_export,
        __options_settingsMngmt_import,
        __options_settingsMngmt_importFail,
        __options_settingsMngmt_importSuccess,
        __options_settingsMngmt_reset
    } from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import {DefaultSettings, SettingsStore} from "../Data/Settings";
    import Downloader from "@Core/Downloader";
    import Info from "@Core/Info";
    import UserNotes from "@Content/Features/Store/Common/UserNotes/UserNotes";
    import type {SettingsSchema} from "@Options/Data/_types";
    import UserNotesAdapter from "@Content/Modules/UserNotes/UserNotesAdapter";


    function importSettings(e: Event & {currentTarget: EventTarget & HTMLInputElement}) {
        const input = e.currentTarget;

        const reader = new FileReader();
        reader.addEventListener("load", () => {
            const data = reader.result as string;

            let importedSettings;
            let importedNotes;
            try {
                const importedData = JSON.parse(data);

                const knownKeys = new Set(Object.keys(DefaultSettings));
                importedSettings = Object.fromEntries(
                    Object.entries(importedData)
                        .filter(([key, _value]) => knownKeys.has(key))
                ) as Partial<SettingsSchema>;

                importedNotes = importedData.user_notes ?? {};
            } catch (err) {
                console.group("Import");
                console.error("Failed to read settings file");
                console.error(err);
                console.groupEnd();

                // TODO do not use alert
                window.alert(L(__options_settingsMngmt_importFail));
                return;
            }

            try {
                console.log(importedSettings);
                SettingsStore.import(importedSettings);
                UserNotesAdapter.getAdapter().import(importedNotes);
            } catch (err) {
                console.group("Import");
                console.error("Failed to write settings to storage");
                console.error(err);
                console.groupEnd();

                // TODO do not use alert
                window.alert(L(__options_settingsMngmt_importFail));
                return;
            }

            // TODO do not use alert
            window.alert(L(__options_settingsMngmt_importSuccess));
            window.location.reload();
        });

        if (input.files && input.files.length > 0) {
            const file = input.files[0] as File;
            reader.readAsText(file);
        }
    }

    async function exportSettings() {
        const result: Record<string, any> = SettingsStore.asObject();
        result.user_notes = await (new UserNotes()).export();

        Downloader.download(
            new Blob([
                JSON.stringify(result, null, "  ")
            ]),
            `AugmentedSteam_v${Info.version}.json`
        );
    }

    function resetSettings() {
        // TODO do not use confirm
        if (!window.confirm(L(__options_clear))) {
            return;
        }
        SettingsStore.clear();
        window.location.reload();
    }
</script>


<footer>
    <div><a href="https://augmentedsteam.com">Augmented Steam</a></div>
    <div class="author">{L(__options_footerFork)}</div>
    <div class="author">{L(__options_footerAuthor)}</div>
    <div class="buttons">
        <label>
            <input type="file" accept=".json" on:change={importSettings}>
            <button type="button">{L(__options_settingsMngmt_import)}</button>
        </label>
        <button type="button" on:click={exportSettings}>{L(__options_settingsMngmt_export)}</button>
        <button type="button" on:click={resetSettings}>{L(__options_settingsMngmt_reset)}</button>
    </div>
</footer>


<style>
    footer {
        font-size: 1.2em;
        position: fixed;
        bottom: 1em;
        right: 1em;
        text-align: right;
        line-height: 1.25;
    }

    .author {
        color: var(--sub-color);
    }

    .buttons {
        margin-top: 5px;
        display: flex;
        align-items: center;
        gap: 15px;
    }

    label {
        cursor: pointer;
    }
    label > button {
        pointer-events: none;
    }

    input {
        display: none;
    }
</style>
