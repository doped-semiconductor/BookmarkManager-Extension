//fetch url of site
function getUrl(){
    var url;
    chrome.tabs.query({
        'active':true,
        'windowId':chrome.windows.WINDOW_ID_CURRENT},
        (tabs) => {url = tabs[0].url}
    );
    return url;
}