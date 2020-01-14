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

/**
 * @property {function} String.prototype.escapeHTML
 * @property {string} HTMLElement.prototype.dataset.img
 */
/**
 * @typedef {object} IGameInfo
 * @property {string} name
 * @property {string} appid
 * @property {string|null} hours_forever
 * @property {string|null} hours_message
 * @property {string|null} stats_links
 * @property {string|null} stats_button
 * @property {number} hours
 * @property {object} client_summary
 * @property {number} installedSize
 * @property {boolean} status
 * @property {boolean} played
 * @property {object} availStatLinks
 * @property {string|null} item_background
 * @property {string} logo
 * @property {string} persona_name
 * @property {string} profile_link
 * @property {string} name_encoded
 * @property {string} name_escaped
 * @property {string} info_link
 */
/**
 * @typedef {object} PaginationPluginParams
 * @property {number} currentPage
 * @property {Array} elements
 * @property {number} perPage
 * @property {function} change
 */
/**
 * @typedef {object} ITemplate
 * @property {string} template
 * @property {RegExp} pattern
 */

/**
 * @method
 * @name ITemplate#evaluate
 * @param {object}
 * @returns {string}
 */

/**
 * @typedef {object} ISliwipi
 * @property {number} perPage
 * @property {object} fileSizeMultipliers
 * @property {string} html
 */

/** @var {object[]} rgGames */
/** @var {ISliwipi} SLIWIPI */
/** @var {Template} gameLinksPopupTemplate */
/** @var {Template} gameStatsPopupTemplate */
/** @var {Template} gameTemplate */
/** @var {Template} gameStatsAchievementsTemplate */
/** @var {Template} gameStatsLeaderboardTemplate */
/** @var {Template} gameStatsGlobalAchievementsTemplate */
/** @var {Template} gameStatsGlobalLeaderboardsTemplate */
/** @var {Template} gameHoursForeverTemplate */
/** @var {Template} gameStatsTemplate */
/** @var {Template} gameStatsUserTemplate */
/** @var {string} personaName */
/** @var {string} profileLink */
/** @var {function} UpdateGameInfoFromSummary */
/** @var {boolean} SLIWIPI_BUILD_GAME_ROW_PATCHED */

(async function () {

  let _common = false;
  let _notcommon = false;
  let _commonGames = null;

  document.getElementById('gameslist_controls').addEventListener('update', function(e){
    let detail = JSON.parse(e.detail);
    if (detail.common != null)
      _common = detail.common;
    if (detail.notcommon != null)
      _notcommon = detail.notcommon;
    _commonGames = new Set(detail.commonGames);
    predebounceFilterApps();
  })

  /** @property {ISliwipi|null} window.SLIWIPI */
  function debounce(delay, cb) {
    let timer;
    return function() {
      if(timer)
        clearTimeout(timer);
      timer = setTimeout(cb, delay);
    };
  }
//  (window.SLIWIPI || window).debounce = debounce;

  /** @property {ISliwipi|null} window.SLIWIPI */
  function isInViewport(el) {
    const rect = el.getBoundingClientRect();
    return rect.top >= -300 &&
      rect.left >= -300 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + 300 &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth) + 300;
  }
//  (window.SLIWIPI || window).isInViewport = isInViewport;

  function generatePagination(currentPage, elements, perPage) {
    let html = '';
    let totalPages = Math.ceil(elements.length / perPage);
    if (totalPages <= 1)
      return '';
    if (currentPage > 1)
      html += '<button type="button" class="pagination-navprev btnv6_blue_hoverfade" data-locale-text="pagination_button_prev">&lt; prev</button>';
    if(currentPage !== 1)
      html += '<button type="button" class="btnv6_blue_hoverfade">1</button>';
    else
      html += '<span>1</span>';
    if(currentPage === 5)
      html += '<button type="button" class="btnv6_blue_hoverfade">2</button>';
    if (currentPage > 2) {
      if(currentPage > 5)
        html += '<span>...</span>';
      if (currentPage > 3)
        html += '<button type="button" class="btnv6_blue_hoverfade">' + (currentPage - 2) + '</button>';
      html += '<button type="button" class="btnv6_blue_hoverfade">' + (currentPage - 1) + '</button>';
    }
    if (currentPage !== 1 && currentPage !== totalPages)
      html += '<span>' + currentPage + '</span>';
    if (currentPage < totalPages - 1) {
      html += '<button type="button" class="btnv6_blue_hoverfade">' + (currentPage + 1) + '</button>';
      if (currentPage < totalPages - 2)
        html += '<button type="button" class="btnv6_blue_hoverfade">' + (currentPage + 2) + '</button>';
      if(currentPage < totalPages - 4)
        html += '<span>...</span>';
    }
    if(currentPage === totalPages - 4)
      html += '<button type="button" class="btnv6_blue_hoverfade">' + (totalPages - 1) + '</button>';
    if(currentPage !== totalPages)
      html += '<button type="button" class="btnv6_blue_hoverfade">' + totalPages + '</button>';
    else
      html += '<span>' + totalPages + '</span>';
    if (currentPage < totalPages)
      html += '<button type="button" class="pagination-navnext btnv6_blue_hoverfade" data-locale-text="pagination_button_next">next &gt;</button>';
    return html;
  }



  /**
   * @name PaginationPluginParams
   * @property {number} currentPage
   * @property {object[]} elements
   * @property {number} perPage Amount of items displayed per page
   */
  /**
   * @param {PaginationPluginParams} obj
   */
  function pagination(elements,obj) {
    let html = generatePagination(obj.currentPage, obj.elements, obj.perPage);    
    let clickListener = function (event){
        let inner = event.target;
        if (inner.tagName != "BUTTON") return;
        let newPage = inner.textContent;
        if (inner.classList.contains('pagination-navprev'))
          obj.currentPage--;
        else if (inner.classList.contains('pagination-navnext'))
          obj.currentPage++;
        else
          obj.currentPage = +newPage;
        let html = generatePagination(obj.currentPage, obj.elements, obj.perPage);
        for (let elementNumber=0; elementNumber < elements.length; elementNumber++){
          elements[elementNumber].innerHTML = html;
        }
        obj.change(obj.currentPage);

    }

    for (let elementNumber=0; elementNumber < elements.length; elementNumber++){
      elements[elementNumber].removeEventListener("click",clickListener);
      elements[elementNumber].addEventListener("click",clickListener);
      elements[elementNumber].innerHTML = html;
    }
  };
//  window.pagination = pagination;

  if(!window.SLIWIPI_BUILD_GAME_ROW_PATCHED)
    return;
  for(let game of window.rgGames) {
    BuildGameRow(game);
  }

  document.querySelector('#games_list_rows').innerHTML = '<div class="library-owned-list-pagination"></div><div class="sliwipi-actual-list"></div><div class="library-owned-list-pagination"></div>';

  let hideUnnecessaryOptionsImg1 = document.querySelector('#global_actions > a > img');
  let hideUnnecessaryOptionsImg2 = document.querySelector('.profile_small_header_avatar > .playerAvatar > img');
  let hideUnnecessaryOptions = !hideUnnecessaryOptionsImg1 || !hideUnnecessaryOptionsImg2 || hideUnnecessaryOptionsImg1.getAttribute('src') !== hideUnnecessaryOptionsImg2.getAttribute('src').replace('_medium', '');

  const originalData = JSON.parse(JSON.stringify(rgGames)).map(/**IGameInfo*/row => {
    row.hours = row.hours_forever ? parseFloat(row.hours_forever.replace(/,/g, '')) : 0;
    if(!row.client_summary) {
      row.client_summary = {
        localContentSize: '0 B'
      };
    }
    let splitSize = row.client_summary.localContentSize.split(' ');
    let size = parseFloat(splitSize[0]) * SLIWIPI.fileSizeMultipliers[splitSize[1]];
    if (isNaN(size))
      size = 0;
    row.installedSize = size;
    row.status = row.installedSize > 0;

    row.played = row.hours > 0;

    return row;
  });
  let filteredData = originalData;

  SLIWIPI.html = decodeURIComponent(SLIWIPI.html);

  let gameslistSortOptions = document.querySelector('#gameslist_sort_options');
  gameslistSortOptions.id = '';
  gameslistSortOptions.innerHTML = SLIWIPI.html;

  let br = document.createElement('br');
  let gamesInCommonCheckbox = document.querySelector('#gameslist_controls > .gray_bevel.for_text_input').nextElementSibling;
  gamesInCommonCheckbox.parentNode.insertBefore(br, gamesInCommonCheckbox);

  if(hideUnnecessaryOptions) {
    document.querySelectorAll('[data-data="installedSize"],[data-data$="installed"]').forEach(v => {
      v.parentNode.removeChild(v);
    });
  }

  let sortingBy = SLIWIPI.sortBy;
  let filterBy = 'all';

  function changeDropdownLabel(target) {
    let label = target.parentNode.parentNode.parentNode.querySelector('.sliwipi-dropdown-label');
    label.textContent = target.textContent;
    label.dataset.localeText = target.dataset.localeText;
  }
  changeDropdownLabel(document.querySelector(`[data-data="${sortingBy}"]`));
  let sortmenu = document.querySelector('#sliwipi-sort-by-dropdown').getElementsByTagName('a');
  for (let menuindex=0;menuindex<sortmenu.length;menuindex++){
    sortmenu[menuindex].addEventListener('click', function(e) {
      changeDropdownLabel(this);
      e.preventDefault();

      sortingBy = this.dataset.data;
      predebounceFilterApps();
    });
  }

  let filtermenu = document.querySelector('#sliwipi-filter-by-pulldown').getElementsByTagName('a');
  for (let menuindex=0;menuindex<filtermenu.length;menuindex++){
    filtermenu[menuindex].addEventListener('click', function(e) {
      changeDropdownLabel(this);
      e.preventDefault();

      filterBy = this.dataset.data;
      predebounceFilterApps();
    });
  }

  let filterInput = document.querySelector('#gameFilter');

  let popupsContainer = document.createElement('div');
  document.body.appendChild(popupsContainer);

  let listContainer = document.querySelector('.sliwipi-actual-list');

  let currentPage;
  SLIWIPI.pageNum = 1;

  const FILTER_OPTIONS = {
    all: 'all',
    installed: 'installed',
    noninstalled: '-installed',
    played: 'played',
    nonplayed: '-played'
  };
  const SORTING_OPTIONS = {
    name: 'name',
    playtime: 'playtime',
    installedSize: 'installedSize'
  };

  function filterOut() {
    let sortingFunction, filteringFunction;
    let name = filterInput.value.trim().toLowerCase();
    switch(sortingBy) {
      case SORTING_OPTIONS.name:
        sortingFunction = firstBy('name', { ignoreCase: true });
        break;
      case SORTING_OPTIONS.playtime:
        sortingFunction = firstBy('hours', { direction: -1 }).thenBy('name', { ignoreCase: true });
        break;
      case SORTING_OPTIONS.installedSize:
        sortingFunction = firstBy('installedSize', { direction: -1 }).thenBy('name', { ignoreCase: true });
        break;
    }
    switch(filterBy) {
      case FILTER_OPTIONS.all:
        filteringFunction = v => v.name.toLowerCase().includes(name);
        break;
      case FILTER_OPTIONS.installed:
        filteringFunction = v => v.name.toLowerCase().includes(name) && v.status;
        break;
      case FILTER_OPTIONS.noninstalled:
        filteringFunction = v => v.name.toLowerCase().includes(name) && !v.status;
        break;
      case FILTER_OPTIONS.played:
        filteringFunction = v => v.name.toLowerCase().includes(name) && v.played;
        break;
      case FILTER_OPTIONS.nonplayed:
        filteringFunction = v => v.name.toLowerCase().includes(name) && !v.played;
        break;
    }
    let esFilteringFunction  = v => filteringFunction(v) && (_common?_commonGames.has(v.appid):true) && (_notcommon?!_commonGames.has(v.appid):true);
    filteredData = originalData.filter(esFilteringFunction).sort(sortingFunction);
    window.filteredData = filteredData;
  }

  function reapplyPagination(num = 1) {
    if(!pagination) {
      setTimeout(reapplyPagination.bind(null, num), 500);
      return;
    }
    pagination(document.getElementsByClassName('library-owned-list-pagination'),{
      currentPage: num,
      elements: filteredData,
      perPage: SLIWIPI.perPage,
      change: changePage,
    });
  }

  SLIWIPI.reapplyPagination = reapplyPagination;

  function predebounceFilterApps() {
    filterOut();
    changePage(1);
    reapplyPagination();
  }

  window.filterApps = debounce(500, predebounceFilterApps);

  function changePage(newPage) {
    SLIWIPI.pageNum = newPage;
    let start = SLIWIPI.perPage * (newPage - 1);
    currentPage = filteredData.slice(start, start + SLIWIPI.perPage);
    regenerateList();
  }

  function loadImagesInViewport() {
    const images = document.querySelectorAll('.gameListRowLogo img[id^="delayedimage_"]');
    for(const image of images) {
      if(isInViewport(image)) {
        image.src = image.parentNode.parentNode.parentNode.dataset.img || image.parentNode.parentNode.parentNode.parentNode.dataset.img;
        image.removeAttribute('id');
      }
    }
  }

  document.addEventListener('scroll', debounce(50, loadImagesInViewport), { passive: true });

  function regenerateList() {
    let popupsHtml = '';
    let listHtml = '';
    for (let info of currentPage) {
      popupsHtml += `<div class="popup_block2" id="links_dropdown_${info.appid}" style="display: none;">${gameLinksPopupTemplate.evaluate(info)}</div>`;

      if (info.stats_links)
        popupsHtml += `<div class="popup_block2" id="stats_dropdown_${info.appid}" style="display: none;">${gameStatsPopupTemplate.evaluate(info)}</div>`;

      let html = gameTemplate.evaluate(info);

      listHtml += `<div class="gameListRow ${info.item_background || ''}" id="game_${info.appid}" data-img="${info.logo}">${html}</div>`;
    }

    popupsContainer.innerHTML = popupsHtml;
    listContainer.innerHTML = listHtml;

    loadImagesInViewport();
  }

  predebounceFilterApps();
})();