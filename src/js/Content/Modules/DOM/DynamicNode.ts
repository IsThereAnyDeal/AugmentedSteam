
export default function dynamicNode<T extends HTMLElement = HTMLElement>(params: {
    selector: () => T|null,
    observable?: Node,
    timeout?: number
}): Promise<T> {
    const observable = params.observable ?? document;
    const timeout = params.timeout ?? 2000;

    return new Promise<T>((resolve, reject) => {
        const node: T|null = params.selector();
        if (node) {
            resolve(node);
            return;
        }

        let timer: number|null = null;
        if (timeout) {
            timer = setTimeout(() => {
                observer.disconnect();
                reject("Timeout");
            }, timeout);
        }

        const observer = new MutationObserver(() => {
            const node: T|null = params.selector();
            if (node) {
                if (timer) {
                    clearTimeout(timer);
                }

                observer.disconnect();
                resolve(node);
                return;
            }
        });
        observer.observe(observable, {
            childList: true,
            subtree: true
        });
    });
}