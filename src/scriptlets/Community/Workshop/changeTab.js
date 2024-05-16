(function(){
    const params = JSON.parse(document.currentScript.dataset.params);
    const {query, totalCount, count} = params;

    g_oSearchResults.m_iCurrentPage = 0;
    g_oSearchResults.m_strQuery = query;
    g_oSearchResults.m_cTotalCount = totalCount;
    g_oSearchResults.m_cPageSize = count;
    g_oSearchResults.UpdatePagingDisplay();
})();
