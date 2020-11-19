var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest

/** for importing bookmarks from chrome */
var bookmarkImportObject = []
var cust_keys = []

function sendData(route,data,callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "http://localhost:5000/"+route, true); 
    xhr.setRequestHeader('Content-Type', 'application/json');   
    xhr.onload = () => {
        //console.log(xhr.status,xhr.responseText)
        callback(JSON.parse(xhr.responseText))
    }   
    xhr.send(data);     
}

//read callbacks
function recentlyAddedCB(data){
    for (var i=1;i<data.length+1;i++){
        var site = data[i-1]
        document.getElementById('t'+i.toString()).innerHTML = titleCase(site.title);        
        document.getElementById('u'+i.toString()).innerHTML = (site.url).substring(0, 25)+'...';
        document.getElementById('r'+i.toString()).addEventListener('click',(ev)=>{
            window.open(site.url)
        })
    }
}

function recentlyAddedReadLaterCB(data) {
    if (data.length===0){
        document.getElementById('rlMsg').style.display = 'block'
    }

    for (var i=1;i<data.length+1;i++){
        var site = data[i-1]
        //console.log(site)
        document.getElementById('tt'+i.toString()).innerHTML = titleCase(site.title);        
        document.getElementById('uu'+i.toString()).innerHTML = site.url;
        document.getElementById('l'+i.toString()).addEventListener('click',(ev)=>{
            window.open(site.url)
        })
    }
}

function getFolderOptionsCB(data) {
    var par = document.getElementById('parent')
    data.forEach( (e) =>{
        var el = document.createElement("option")
        el.textContent = e.title
        el.value = e.id
        par.appendChild(el)
    })
}

function getTagsCurrentPageCB(data){   
    var msg = document.getElementById('tagmsg')
    if(data.data == 'not received'){
        msg.innerHTML = 'Could not get tags!'
    }
    else if(data.tags == null){
        msg.innerHTML = 'Could not get tags!'
    }
    else{
        data.tags.forEach(e => {
            var t = document.createElement('text')
            var n = document.createTextNode(e.term)
            t.appendChild(n)
            t.classList.add('tagword') 
            t.style.margin = '100px 5px'   
            var par = document.getElementById("taghold")
            var end = document.getElementById('tend')
            t.addEventListener('click',(ev) =>{
                par.removeChild(t)
            })
            par.insertBefore(t,end)
            par.style.display = 'inline-block'
        })
        msg.style.display = 'none'
    }    
}

//write callbacks
function importBookmarksCB(data) {
    alert('Bookmarks imported sucessfully!')    
}

function addBookMarkCB(data) {
    alert('Bookmark added!')
}

//callbacks
function getTagsCurrentPage(url) {
    var data = {"url":url.toString()}
    sendData('tags',data,getTagsCurrentPageCB)
}

function addBookMark(rlbool){
    var data = {
        title: document.getElementById('title').value,
        url: document.getElementById('url').value,
        tags: [],
        rl: rlbool,
        date: Date.now(),
        parent: document.getElementById("parent").options[parent.selectedIndex].value
    }
    var user_tags = document.getElementsByClassName('tagword')
    for(let i = 0; i<user_tags.length; i++){
        data.tags.push(user_tags[i].innerHTML)
    }
    // console.log('tags:',data.tags)
    sendData('addBookmark',data,addBookMarkCB)        
}
 
function recentlyAdded(n){
    var data = {'n':n}
    sendData('recent',data,recentlyAddedCB)
}

function recentlyAddedReadLater(n) {
    var data = {'n':n}
    sendData('recent',data,recentlyAddedReadLaterCB)        
}

function importBookmarks() {
    //function to get all bookmarks
    readChromeBookmarks('0')
    data = window.bookmarkImportObject
    sendData('recent',data,importBookmarksCB)    
}

function getFolderOptions() {
    sendData('folder','',getFolderOptionsCB)        
}

/** utility functions */
function readChromeBookmarksCB(node, callback){
    callback(node)
}

function readChromeBookmarks(id) {
    chrome.bookmarks.getChildren(id, function(children) {
        children.forEach(function(bookmark) {
            var bookmark_json = {
                id : bookmark.id,
                title : bookmark.title,
                index : bookmark.index,
                url : bookmark.url,
                parent : bookmark.parentId,
                date : bookmark.dateAdded
            }                 
            readChromeBookmarksCB(bookmark_json, function(node){
                window.bookmarkImportObject[node.id] = node
            }) 
            readChromeBookmarks(bookmark.id);              
        });
    });
}
/* title case */
function titleCase(sentence) {
    sentence = sentence.toLowerCase().split(" ");
    for (let i = 0; i < sentence.length; i++) {
      sentence[i] = sentence[i][0].toUpperCase() + sentence[i].slice(1);
    }    
    return sentence.join(" ");
}

function getCurrentPageDetails() {
    chrome.tabs.query({
        'active':true,
        'windowId':chrome.windows.WINDOW_ID_CURRENT},
        (tabs) => {            
            var url = tabs[0].url
            var inp = document.getElementById('url')
            inp.value = url

            var title = tabs[0].title
            var inp = document.getElementById('title')
            inp.value = title 
        }
    )
    getTagsCurrentPage(document.getElementById('url').value)       
}
//add a word tag into doc

function addkey(word){
    if (!cust_keys.includes(word)){
        cust_keys.push(word)
        return false
    }
    return true
}

function removekey(word){
    var Index = cust_keys.indexOf(word);
    cust_keys.splice(Index, 1);
}

function addTag(word){
    var x = addkey(word)
    if (!x){
        var t = document.createElement('text')
        var n = document.createTextNode(word)
        t.appendChild(n)
        t.classList.add('tagword') 
        t.style.margin = '100px 5px'   
        var par = document.getElementById("taghold")
        var end = document.getElementById('tend')
        t.addEventListener('click',(ev) =>{
            removekey(word)
            par.removeChild(t)
        })
        par.insertBefore(t,end)
    }    
}


/** event handlers */


function addEventsToPage() {
    /** get page data */
    
    getCurrentPageDetails()

    /** tag bar enter key */

    var tagbar = document.getElementById('tagbar')
    tagbar.addEventListener('keydown',(ev) => {
        if(ev.keyCode===13){
            document.getElementById('taghold').style.display = 'block'
            addTag(tagbar.value)
            tagbar.value = ''
        }
    })

    /** add button toggle event */

    var addHead = document.getElementById("addhead")
    var addToggle = document.getElementById("addform");    
    addHead.addEventListener('click',function(event){  
        if (addToggle.style.display == "none") addToggle.style.display = "block";
        else addToggle.style.display = "none";
    });

    /** import button event */

    var impbutton = document.getElementById('importhead')
    impbutton.addEventListener('click', (ev)=>{
        var msg = document.getElementById('message')
        msg.style.display = 'block'
        msg.innerHTML = "Importing... This can take a while!"
        importBookmarks() 
    })

    /** add bm and read later button events  */

    document.getElementById('ab1').addEventListener('click',(ev)=>{addBookMark(false)})
    document.getElementById('ab2').addEventListener('click',(ev)=>{addBookMark(true)})

    /** manager button event */

    document.getElementById('manage').addEventListener('click', (ev) =>{
        window.open("manager.html");
    })

    /** load folders */
    getFolderOptions()    
    
}


// sendData('test',data,sendDataCallback)

window.onload = addEventsToPage()