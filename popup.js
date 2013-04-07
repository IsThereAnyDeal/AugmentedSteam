document.addEventListener('DOMContentLoaded', function () {
  document.getElementById("options").addEventListener("click", function() {
    chrome.tabs.create({url: "options.html"});
  });

  document.getElementById("contribute").addEventListener("click", function() {
    chrome.tabs.create({url: "https://github.com/jshackles/Enhanced_Steam"});
  });
});