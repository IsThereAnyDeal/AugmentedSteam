/*
 Copyright 2017 Yan Li

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

/** @var {object} $ */

(async function () {
  const FILE_SIZE_MULTIPLIER = {
    B:   Math.pow(1024, 0),
    KiB: Math.pow(1024, 1),
    MiB: Math.pow(1024, 2),
    GiB: Math.pow(1024, 3),
    TiB: Math.pow(1024, 4),
    PiB: Math.pow(1024, 5),
    EiB: Math.pow(1024, 6),
    ZiB: Math.pow(1024, 7),
    YiB: Math.pow(1024, 8)
  };


  await SyncedStorage.init().catch(err => console.error(err));
  await Localization.init().catch(err => console.error(err));

  let library = {
      "perPage": SyncedStorage.get('library_rows_per_page'),
      "enabled": SyncedStorage.get('library_pagination'),
      "sortBy": SyncedStorage.get('library_default_sort')
    }
  if (!library.enabled)
    return;

  let s = document.createElement('script');
  s.innerHTML = `(function() {
  Object.defineProperty(window, 'rgGames', {
    configurable: true,
    get() {
      return [];
    },
    set(newValue) {
      window.SLIWIPI_rgGames = newValue;
    }
  });

  function onReady() {
    let str = window.BuildGameRow.toString().split('\\n');

    function comment(line) {
      str[line] = '//' + str[line];
    }

    if (str.length !== 111)
      return;

    /* I think including the actual code from the page with slight modifications
     would be illegal?.. So this array contains the numbers of lines in the original
     function that should be commented out. */
    let lines = [
      69, 70, 71, 72, 73, 74,
      81, 82, 83, 84,
      92, 93, 94, 95,
      98,
      100, 101, 102, 103, 104, 105,
      107, 108, 109
    ];

    for (let line of lines) {
      comment(line);
    }

    let s = document.createElement('script');
    s.innerHTML = str.join('\\n');
    document.head.appendChild(s);
    s.parentNode.removeChild(s);

    window.SLIWIPI_BUILD_GAME_ROW_PATCHED = true;

    delete window.rgGames;
    window.rgGames = window.SLIWIPI_rgGames;
    delete window.SLIWIPI_rgGames;
  }

  document.addEventListener('DOMContentLoaded', onReady);
})();`
  //s.src = chrome.extension.getURL('/js/BuildGameRow-injectable.js');
  document.documentElement.appendChild(s);
  s.parentNode.removeChild(s);

  async function onReady() {

    let link1 = document.createElement('link');
    link1.setAttribute('rel', 'stylesheet');
    link1.setAttribute('href', chrome.extension.getURL('/css/sliwipi-common.css'));
    document.head.appendChild(link1);

    let html = await (await fetch(chrome.extension.getURL('library.html'))).text();
    let parser = new DOMParser();
    let doc = parser.parseFromString("<html><body>"+html+"</body></html>", "text/html");
    let nodes = doc.querySelectorAll("[data-locale-text]");
    for (let node of nodes) {
      let translation = Localization.getString(node.dataset.localeText);
      if (translation) {
        node.textContent = translation;
      } else {
        console.warn(`Missing translation ${node.dataset.localeText}`);
      }
    }
    html = doc.body.innerHTML;

    let s = document.createElement('script');
    s.innerHTML = `window.SLIWIPI = { 
      perPage: ${library.perPage},
      fileSizeMultipliers: ${JSON.stringify(FILE_SIZE_MULTIPLIER)},
      sortBy: ${JSON.stringify(library.sortBy)},
      html: \`${encodeURIComponent(html)}\`
    };`;
    document.body.appendChild(s);
    s.parentNode.removeChild(s);

    s = document.createElement('script');
    s.innerHTML = await (await fetch(chrome.extension.getURL('/js/sliwipi/thenBy.js'))).text();
    document.body.appendChild(s);
    s.parentNode.removeChild(s);

    s = document.createElement('script');
    s.innerHTML = await (await fetch(chrome.extension.getURL('/js/sliwipi/library-performance-injectable.js'))).text();
    document.body.appendChild(s);
    s.parentNode.removeChild(s);
  }

  if(document.readyState === 'interactive' || document.readyState === 'complete')
    onReady();
  else
    document.addEventListener('DOMContentLoaded', onReady);
})();