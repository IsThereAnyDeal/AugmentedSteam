/*
 * Preventing event page to unload, see ITADApi.authorize()
 * Can't inline in authorizationFrame due to Content Security Policy
 */
browser.runtime.connect();
