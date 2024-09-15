import browser, {type Manifest} from "webextension-polyfill";

export default class Permissions {

    static contains(permissions: Manifest.Permission[]): Promise<boolean> {
        return browser.permissions.contains({permissions});
    }

    static request(permissions: Manifest.OptionalPermission[]): Promise<boolean> {
        return browser.permissions.request({permissions});
    }

    static async remove(permissions: Manifest.OptionalPermission[]): Promise<boolean> {
        return browser.permissions.remove({permissions});
    }

    static async when(
        permission: Manifest.OptionalPermission,
        onAdded: () => Promise<void>|void,
        onRemoved: () => Promise<void>|void
    ): Promise<void> {

        if (onAdded) {
            if (await Permissions.contains([permission])) {
                onAdded();
            }

            browser.permissions.onAdded.addListener((p: browser.Permissions.Permissions): void => {
                if (p.permissions?.includes(permission)) {
                    onAdded();
                }
            });
        }

        if (onRemoved) {
            browser.permissions.onRemoved.addListener(p => {
                if (p.permissions?.includes(permission)) {
                    onRemoved();
                }
            });
        }
    }
}
