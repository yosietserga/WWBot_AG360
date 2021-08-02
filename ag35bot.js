String.prototype.hashCode = function(){
    if (Array.prototype.reduce){
        return this.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);              
    } 
    var hash = 0;
    if (this.length === 0) return hash;
    for (var i = 0; i < this.length; i++) {
        var character  = this.charCodeAt(i);
        hash  = ((hash<<5)-hash)+character;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
} 

const log = console.log;
const __cookiePrefix = 'ag360_';
let __queue=[];
let __links=[];
let __phones=[];
let __tabOpened = false;

const getLinks = ()=>{
    $('#dataTable tbody tr').each(function(){ 
        __links.push( $(this).find('td').eq(0).find('a').attr('href') );
    });
    return __links;
};

const getCellphones = ()=>{
    $('#dataTable tbody tr').each(function(){ 
        __phones.push( $(this).find('td').eq(10).text() );
    });
    return __phones;
};

const processQueue = ()=>{
    if (__tabOpened && !__tabOpened.closed) {
    	log(['Queue bussy!']);
    	return;
    } else {
	    let linksToProcess = getLinks();
	    linksToProcess.map(url=>{
	        if (!__queue.includes(url) && (!__tabOpened || __tabOpened.closed)) {
	            __queue.push(url);
	            openTab(url);
	        } else if (__queue.length >= __links) {
				clearInterval(i);
	        }
	    });
	    
    }
};

const openTab = url => {
    const o = url => {
        if (!__tabOpened || __tabOpened.closed) {
            __tabOpened = window.open(url, '_blank');
            __tabOpened.blur();
            __tabOpened.addEventListener("beforeunload", function(e) {
            	log(['event:beforeunload', e, __tabOpened]);
            });
        } else {
            log(['__tabOpened', __tabOpened.window]);
        }
    };

    o(url);
}

const botControls = {};
const setCookie = (name, value, days) => {
    var expires = "";
    name = __cookiePrefix+name;
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

const getCookie = name => {
    name = __cookiePrefix+name;
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

const eraseCookie = name => {
    name = __cookiePrefix+name;
    document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
};

async function askWritePermission() {
	try {
    	const { state } = await window.navigator.permissions.query({ name: 'clipboard-write' });
    	return state === 'granted';
	} catch (error) {
    	return false;
	}
};

async function askReadPermission() {
	try {
    	const { state } = await window.navigator.permissions.query({ name: 'clipboard-read' });
    	return state === 'granted';
	} catch (error) {
    	return false;
	}
};

async function writeToClipboard(data) {
	try {
    	log(await window.navigator.clipboard.write(data));
	} catch (error) {
    	log(error);
	}
};

async function readFromClipboard() {
	try {
	    const clipboardItems = await navigator.clipboard.read();
	    for (const clipboardItem of clipboardItems) {
	    	for (const type of clipboardItem.types) {
	        	const blob = await clipboardItem.getType(type);
	        	log(URL.createObjectURL(blob));
	    	}
	    }
	} catch (error) {
    	log(error);
	}
};

//Rewrite of website function 
async function copyImage(input, event){
	log(['event',event]);
    let canWriteToClipboard = await askWritePermission();
    let canReadToClipboard  = await askReadPermission();

    log(canWriteToClipboard);
    log(canReadToClipboard);

    if (canWriteToClipboard) {
        try {
            setCanvasImage(
                input.src, 
                function(resp){
		            const data = [
		                new window.ClipboardItem({ 
		                    [resp.type]: resp.value 
		                })
		            ];
                    writeToClipboard(data);
            		log( readFromClipboard() );
                }, true);
        } catch(e) {
            log(e);
        }
    }
}


//Convert images to PNG
const img = new Image;
const c = document.createElement('canvas');
const ctx = c.getContext('2d');
let imgBase64;
function setCanvasImage(path, cb, encoded=false){
    img.onload = function(){
        c.width = this.naturalWidth;
        c.height = this.naturalHeight;
        ctx.drawImage(this,0,0);
        
        if (encoded) {
            let phones = getCellphones();
            phones = phones.join(',');
			imgBase64 = c.toDataURL("image/png");
			navigator.clipboard.writeText( phones +':'+ imgBase64.replace(/^data:image\/(png|jpeg);base64,/, "") );
        } else {
	        c.toBlob(blob=>{
	        	log(blob);
	            cb({type:blob.type,value:blob});
	        },'image/png');
        }
    }
    img.src = path;
    log(img);
}

let i;
function renderUI() {
	let container = document.querySelector('#clickCopy').parentNode;
	if (!container) return;
	
	let button = document.createElement('button');
	button.classList.add('btn');
	button.classList.add('btn-secondary');
	button.classList.add('btn-bot');
	
	let btnSendAll = button.cloneNode(true);
	let btnReset = button.cloneNode(true);
	
	btnSendAll.addEventListener('click', async function(e) {
		i = setInterval(function(){
		    processQueue();
		}, 1000 * 1);
	});
	
	btnReset.addEventListener('click', async function(e) {
		__queue=[];
		__tabOpened = false;
		i = setInterval(function(){
		    processQueue();
		}, 1000 * 1);
	});
	
	container.appendChild( btnSendAll );
	container.appendChild( btnReset );
	
	let iel = document.createElement('i');
	iel.classList.add('fas');
	
	let iconSend = iel.cloneNode(true);
	iconSend.classList.add('fa-comments');
	
	let iconReSend = iel.cloneNode(true);
	iconReSend.classList.add('fa-redo');
	
	btnReset.appendChild( iconReSend );
	btnSendAll.appendChild( iconSend );
	
	Array.from( document.querySelectorAll('input[onclick*="copyImage"]') )
	.map( 
		item => { 
			item.onclick = function(e) { 
				copyImage(item, e);
				
			}
		}
	);
}

window.onload = renderUI;


            

