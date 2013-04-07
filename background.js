function checkForValidUrl(tabId, changeInfo, tab) {
  if (tab.url.indexOf('://store.steampowered.com/') > -1 || tab.url.indexOf('://steamcommunity.com/') > -1) {
    chrome.pageAction.show(tabId);
  }
}

chrome.tabs.onUpdated.addListener(checkForValidUrl);