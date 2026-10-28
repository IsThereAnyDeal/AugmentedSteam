
export default function dynamicNode<T extends HTMLElement = HTMLElement>(params: {
    selector: () => T|null,
    observable: Node
}): Promise<T> {

    return new Promise<T>(resolve => {
        const node: T|null = params.selector();
        if (node) {
            resolve(node);
            return;
        }

        const observer = new MutationObserver(() => {
            const node: T|null = params.selector();
            if (node) {
                observer.disconnect();
                resolve(node);
                return;
            }
        });
        observer.observe(params.observable, {
            childList: true,
            subtree: true
        });
    });
}