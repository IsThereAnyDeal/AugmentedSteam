/*
 * Preventing event page to unload, see ITAD_Api.authorize()
 * Can't inline in authorizationFrame due to Content Security Policy
 */
browser.runtime.connect();
