
/**
 * Utility class for mapping commonly used Steam elements
 */
export default class ReactDOM {

    static globalHeader(): HTMLElement|null {
        return document.querySelector<HTMLElement>(".eGsI8rO3zfU-.bp0Pu4TVwpI-,#StoreTemplate > header");
    }

    static globalActions(): HTMLElement|null {
        return this.globalHeader()?.querySelector<HTMLElement>(".h3Jy-1Il1os-,nav + div") ?? null;
    }
}