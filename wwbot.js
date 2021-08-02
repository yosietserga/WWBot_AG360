//'use strict';
/*
let __cookiePrefix = 'ag360_';

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
*/
// Exposes the internal Store to the WhatsApp Web client
/* moduleRaid
 * https://github.com/pixeldesu/moduleRaid
 *
 * Copyright pixeldesu and other contributors
 * Licensed under the MIT License
 * https://github.com/pixeldesu/moduleRaid/blob/master/LICENSE
 */

const moduleRaid = function () {
  moduleRaid.mID  = Math.random().toString(36).substring(7);
  moduleRaid.mObj = {};

  const fillModuleArray = function() {
    (window.webpackChunkbuild || window.webpackChunkwhatsapp_web_client).push([
      [moduleRaid.mID], {}, function(e) {
        Object.keys(e.m).forEach(function(mod) {
          moduleRaid.mObj[mod] = e(mod);
        })
      }
    ]);
  }

  fillModuleArray();

  const get = function get (id) {
    return moduleRaid.mObj[id]
  }

  const findModule = function findModule (query) {
    const results = [];
    const modules = Object.keys(moduleRaid.mObj);

    modules.forEach(function(mKey) {
      let mod = moduleRaid.mObj[mKey];

      if (typeof mod !== 'undefined') {
        if (typeof query === 'string') {
          if (typeof mod.default === 'object') {
            for (key in mod.default) {
              if (key == query) results.push(mod);
            }
          }

          for (key in mod) {
            if (key == query) results.push(mod);
          }
        } else if (typeof query === 'function') { 
          if (query(mod)) {
            results.push(mod);
          }
        } else {
          throw new TypeError('findModule can only find via string and function, ' + (typeof query) + ' was passed');
        }
        
      }
    })

    return results;
  }

  return {
    modules: moduleRaid.mObj,
    constructors: moduleRaid.cArr,
    findModule: findModule,
    get: get
  }
}

const LoadUtils = () => {
        
    try {
        window.mR = moduleRaid();
        window.Store = window.mR.findModule('Chat')[0].default;
        window.Store.AppState = window.mR.findModule('STREAM')[0].default;
        window.Store.Conn = window.mR.findModule('Conn')[0].default;
        window.Store.CryptoLib = window.mR.findModule('decryptE2EMedia')[0];
        window.Store.Wap = window.mR.findModule('Wap')[0].default;
        window.Store.SendSeen = window.mR.findModule('sendSeen')[0];
        window.Store.SendClear = window.mR.findModule('sendClear')[0];
        window.Store.SendDelete = window.mR.findModule('sendDelete')[0];
        window.Store.genId = window.mR.findModule('randomId')[0].default;
        window.Store.SendMessage = window.mR.findModule('addAndSendMsgToChat')[0];
        window.Store.MsgKey = window.mR.findModule((module) => module.default && module.default.fromString)[0].default;
        window.Store.Invite = window.mR.findModule('sendJoinGroupViaInvite')[0];
        window.Store.OpaqueData = window.mR.findModule(module => module.default && module.default.createFromData)[0].default;
        window.Store.MediaPrep = window.mR.findModule('MediaPrep')[0];
        window.Store.MediaObject = window.mR.findModule('getOrCreateMediaObject')[0];
        window.Store.MediaUpload = window.mR.findModule('uploadMedia')[0];
        window.Store.Cmd = window.mR.findModule('Cmd')[0].default;
        window.Store.MediaTypes = window.mR.findModule('msgToMediaType')[0];
        window.Store.VCard = window.mR.findModule('vcardFromContactModel')[0];
        window.Store.UserConstructor = window.mR.findModule((module) => (module.default && module.default.prototype && module.default.prototype.isServer && module.default.prototype.isUser) ? module.default : null)[0].default;
        window.Store.Validators = window.mR.findModule('findLinks')[0];
        window.Store.WidFactory = window.mR.findModule('createWid')[0];
        window.Store.BlockContact = window.mR.findModule('blockContact')[0];
        window.Store.GroupMetadata = window.mR.findModule((module) => module.default && module.default.handlePendingInvite)[0].default;
        window.Store.Sticker = window.mR.findModule('Sticker')[0].default.Sticker;
        window.Store.UploadUtils = window.mR.findModule((module) => (module.default && module.default.encryptAndUpload) ? module.default : null)[0].default;
        window.Store.Label = window.mR.findModule('LabelCollection')[0].default;
        window.Store.Features = window.mR.findModule('FEATURE_CHANGE_EVENT')[0].default;
        window.Store.QueryOrder = window.mR.findModule('queryOrder')[0];
        window.Store.QueryProduct = window.mR.findModule('queryProduct')[0];
    } catch(error) {
        console.log([error]);
    }

    window.WWebJS = {};

    window.WWebJS.getNumberId = async (id) => {

        let result = await window.Store.Wap.queryExist(id);
        if (result.jid === undefined)
            throw 'The number provided is not a registered whatsapp user';
        return result.jid;
    };

    window.WWebJS.sendSeen = async (chatId) => {
        let chat = window.Store.Chat.get(chatId);
        if (chat !== undefined) {
            await window.Store.SendSeen.sendSeen(chat, false);
            return true;
        }
        return false;

    };
    
    window.WWebJS.sendMessage = async (chat, content, options = {}) => {
        let attOptions = {};
        if (options.attachment) {
            attOptions = options.sendMediaAsSticker 
                ? await window.WWebJS.processStickerData(options.attachment)
                : await window.WWebJS.processMediaData(options.attachment, {
                    forceVoice: options.sendAudioAsVoice, 
                    forceDocument: options.sendMediaAsDocument,
                    forceGif: options.sendVideoAsGif
                });

            content = options.sendMediaAsSticker ? undefined : attOptions.preview;

            delete options.attachment;
            delete options.sendMediaAsSticker;
        }

        let quotedMsgOptions = {};
        if (options.quotedMessageId) {
            let quotedMessage = window.Store.Msg.get(options.quotedMessageId);
            if (quotedMessage.canReply()) {
                quotedMsgOptions = quotedMessage.msgContextInfo(chat);
            }
            delete options.quotedMessageId;
        }

        if (options.mentionedJidList) {
            options.mentionedJidList = options.mentionedJidList.map(cId => window.Store.Contact.get(cId).id);
        }

        let locationOptions = {};
        if (options.location) {
            locationOptions = {
                type: 'location',
                loc: options.location.description,
                lat: options.location.latitude,
                lng: options.location.longitude
            };
            delete options.location;
        }

        let vcardOptions = {};
        if (options.contactCard) {
            let contact = window.Store.Contact.get(options.contactCard);
            vcardOptions = {
                body: window.Store.VCard.vcardFromContactModel(contact).vcard,
                type: 'vcard',
                vcardFormattedName: contact.formattedName
            };
            delete options.contactCard;
        } else if (options.contactCardList) {
            let contacts = options.contactCardList.map(c => window.Store.Contact.get(c));
            let vcards = contacts.map(c => window.Store.VCard.vcardFromContactModel(c));
            vcardOptions = {
                type: 'multi_vcard',
                vcardList: vcards,
                body: undefined
            };
            delete options.contactCardList;
        } else if (options.parseVCards && typeof (content) === 'string' && content.startsWith('BEGIN:VCARD')) {
            delete options.parseVCards;
            try {
                const parsed = window.Store.VCard.parseVcard(content);
                if (parsed) {
                    vcardOptions = {
                        type: 'vcard',
                        vcardFormattedName: window.Store.VCard.vcardGetNameFromParsed(parsed)
                    };
                }
            } catch (_) {
                // not a vcard
            }
        }

        if (options.linkPreview) {
            delete options.linkPreview;
            const link = window.Store.Validators.findLink(content);
            if (link) {
                const preview = await window.Store.Wap.queryLinkPreview(link.url);
                preview.preview = true;
                preview.subtype = 'url';
                options = { ...options, ...preview };
            }
        }

        const newMsgId = new window.Store.MsgKey({
            fromMe: true,
            remote: chat.id,
            id: window.Store.genId(),
        });

        const message = {
            ...options,
            id: newMsgId,
            ack: 0,
            body: content,
            from: window.Store.Conn.wid,
            to: chat.id,
            local: true,
            self: 'out',
            t: parseInt(new Date().getTime() / 1000),
            isNewMsg: true,
            type: 'chat',
            ...locationOptions,
            ...attOptions,
            ...quotedMsgOptions,
            ...vcardOptions
        };
        log([message]);
        //await window.Store.SendMessage.addAndSendMsgToChat(chat, message);
        await window.Store.SendMessage.addAndSendMsgToChat(window.Store.Chat.get(chat.id), message);
        return window.Store.Msg.get(newMsgId._serialized);
    };

    window.WWebJS.processStickerData = async (mediaInfo) => {
        if (mediaInfo.mimetype !== 'image/webp') throw new Error('Invalid media type');

        const file = window.WWebJS.mediaInfoToFile(mediaInfo);
        let filehash = await window.WWebJS.getFileHash(file);   
        let mediaKey = await window.WWebJS.generateHash(32);

        const controller = new AbortController();
        const uploadedInfo = await window.Store.UploadUtils.encryptAndUpload({
            blob: file,
            type: 'sticker',
            signal: controller.signal,
            mediaKey
        });

        const stickerInfo = {
            ...uploadedInfo,
            clientUrl: uploadedInfo.url,
            deprecatedMms3Url: uploadedInfo.url,
            uploadhash: uploadedInfo.encFilehash,
            size: file.size,
            type: 'sticker',
            filehash
        };

        return stickerInfo;
    };

    window.WWebJS.processMediaData = async (mediaInfo, { forceVoice, forceDocument, forceGif }) => {
        const file = window.WWebJS.mediaInfoToFile(mediaInfo);
        const mData = await window.Store.OpaqueData.createFromData(file, file.type);
        const mediaPrep = window.Store.MediaPrep.prepRawMedia(mData, { asDocument: forceDocument });
        const mediaData = await mediaPrep.waitForPrep();
        const mediaObject = window.Store.MediaObject.getOrCreateMediaObject(mediaData.filehash);

        const mediaType = window.Store.MediaTypes.msgToMediaType({
            type: mediaData.type,
            isGif: mediaData.isGif
        });

        if (forceVoice && mediaData.type === 'audio') {
            mediaData.type = 'ptt';
        }

        if (forceGif && mediaData.type === 'video') {
            mediaData.isGif = true;
        }

        if (forceDocument) {
            mediaData.type = 'document';
        }

        if (!(mediaData.mediaBlob instanceof window.Store.OpaqueData)) {
            mediaData.mediaBlob = await window.Store.OpaqueData.createFromData(mediaData.mediaBlob, mediaData.mediaBlob.type);
        }

        mediaData.renderableUrl = mediaData.mediaBlob.url();
        mediaObject.consolidate(mediaData.toJSON());
        mediaData.mediaBlob.autorelease();

        const uploadedMedia = await window.Store.MediaUpload.uploadMedia({
            mimetype: mediaData.mimetype,
            mediaObject,
            mediaType
        });
    log(uploadedMedia);
        const mediaEntry = uploadedMedia.mediaEntry;
        if (!mediaEntry) {
            throw new Error('upload failed: media entry was not created');
        }

        mediaData.set({
            clientUrl: mediaEntry.mmsUrl,
            deprecatedMms3Url: mediaEntry.deprecatedMms3Url,
            directPath: mediaEntry.directPath,
            mediaKey: mediaEntry.mediaKey,
            mediaKeyTimestamp: mediaEntry.mediaKeyTimestamp,
            filehash: mediaObject.filehash,
            encFilehash: mediaEntry.encFilehash,
            uploadhash: mediaEntry.uploadHash,
            size: mediaObject.size,
            streamingSidecar: mediaEntry.sidecar,
            firstFrameSidecar: mediaEntry.firstFrameSidecar
        });

        return mediaData;
    };

    window.WWebJS.getMessageModel = message => {
        const msg = message.serialize();
        
        msg.isStatusV3 = message.isStatusV3;
        msg.links = (message.getLinks()).map(link => link.href);

        if (msg.buttons) {
            msg.buttons = msg.buttons.serialize();
        }
        
        delete msg.pendingAckUpdate;
        
        return msg;
    };

    window.WWebJS.getChatModel = async chat => {
        let res = chat.serialize();
        res.isGroup = chat.isGroup;
        res.formattedTitle = chat.formattedTitle;
        res.isMuted = chat.mute && chat.mute.isMuted;

        if (chat.groupMetadata) {
            await window.Store.GroupMetadata.update(chat.id._serialized);
            res.groupMetadata = chat.groupMetadata.serialize();
        }

        delete res.msgs;
        delete res.msgUnsyncedButtonReplyMsgs;
        delete res.unsyncedButtonReplies;

        return res;
    };

    window.WWebJS.getChat = async chatId => {
        const chat = window.Store.Chat.get(chatId);
        return await window.WWebJS.getChatModel(chat);
    };

    window.WWebJS.getChats = async () => {
        const chats = window.Store.Chat.models;

        const chatPromises = chats.map(chat => window.WWebJS.getChatModel(chat));
        return await Promise.all(chatPromises);
    };

    window.WWebJS.getContactModel = contact => {
        let res = contact.serialize();
        res.isBusiness = contact.isBusiness;

        if (contact.businessProfile) {
            res.businessProfile = contact.businessProfile.serialize();
        }

        res.isMe = contact.isMe;
        res.isUser = contact.isUser;
        res.isGroup = contact.isGroup;
        res.isWAContact = contact.isWAContact;
        res.isMyContact = contact.isMyContact;
        res.isBlocked = contact.isContactBlocked;
        res.userid = contact.userid;

        return res;
    };

    window.WWebJS.getContact = contactId => {
        const contact = window.Store.Contact.get(contactId);
        return window.WWebJS.getContactModel(contact);
    };

    window.WWebJS.getContacts = () => {
        const contacts = window.Store.Contact.models;
        return contacts.map(contact => window.WWebJS.getContactModel(contact));
    };

    window.WWebJS.mediaInfoToFile = ({ data, mimetype, filename }) => {
        const binaryData = atob(data);

        const buffer = new ArrayBuffer(binaryData.length);
        const view = new Uint8Array(buffer);
        for (let i = 0; i < binaryData.length; i++) {
            view[i] = binaryData.charCodeAt(i);
        }

        const blob = new Blob([buffer], { type: mimetype });
        return new File([blob], filename, {
            type: mimetype,
            lastModified: Date.now()
        });
    };

    window.WWebJS.downloadBuffer = (url) => {
        return new Promise(function (resolve, reject) {
            let xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.responseType = 'arraybuffer';
            xhr.onload = function () {
                if (xhr.status == 200) {
                    resolve(xhr.response);
                } else {
                    reject({
                        status: this.status,
                        statusText: xhr.statusText
                    });
                }
            };
            xhr.onerror = function () {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            };
            xhr.send(null);
        });
    };

    window.WWebJS.readBlobAsync = (blob) => {
        return new Promise((resolve, reject) => {
            let reader = new FileReader();

            reader.onload = () => {
                resolve(reader.result);
            };

            reader.onerror = reject;

            reader.readAsDataURL(blob);
        });
    };

    window.WWebJS.getFileHash = async (data) => {                  
        let buffer = await data.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
    };

    window.WWebJS.generateHash = async (length) => {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    };

    window.WWebJS.sendClearChat = async (chatId) => {
        let chat = window.Store.Chat.get(chatId);
        if (chat !== undefined) {
            await window.Store.SendClear.sendClear(chat, false);
            return true;
        }
        return false;
    };

    window.WWebJS.sendDeleteChat = async (chatId) => {
        let chat = window.Store.Chat.get(chatId);
        if (chat !== undefined) {
            await window.Store.SendDelete.sendDelete(chat);
            return true;
        }
        return false;
    };

    window.WWebJS.sendChatstate = async (state, chatId) => {
        switch (state) {
        case 'typing':
            await window.Store.Wap.sendChatstateComposing(chatId);
            break;
        case 'recording':
            await window.Store.Wap.sendChatstateRecording(chatId);
            break;
        case 'stop':
            await window.Store.Wap.sendChatstatePaused(chatId);
            break;
        default:
            throw 'Invalid chatstate';
        }

        return true;
    };

    window.WWebJS.getLabelModel = label => {
        let res = label.serialize();
        res.hexColor = label.hexColor;
        
        return res;
    };

    window.WWebJS.getLabels = () => {
        const labels = window.Store.Label.models;
        return labels.map(label => window.WWebJS.getLabelModel(label));
    };

    window.WWebJS.getLabel = (labelId) => {
        const label = window.Store.Label.get(labelId);
        return window.WWebJS.getLabelModel(label);
    };

    window.WWebJS.getChatLabels = async (chatId) => {
        const chat = await window.WWebJS.getChat(chatId);
        return (chat.labels || []).map(id => window.WWebJS.getLabel(id));
    };

    window.WWebJS.getOrderDetail = async (orderId, token) => {
        return window.Store.QueryOrder.queryOrder(orderId, 80, 80, token);
    };

    window.WWebJS.getProductMetadata = async (productId) => {
        let sellerId = window.Store.Conn.wid;
        let product = await window.Store.QueryProduct.queryProduct(sellerId, productId);
        if (product && product.data) {
            return product.data;
        }

        return undefined;
    };
    
    window.WWebJS.loadChats = async () => {
        try {
            let allchats = await window.WWebJS.getChats();
            window.wwChats = {};
            allchats.map( async (item,i) => {
                let contact = await WWebJS.getContact(item.id);
                window.wwChats[item.id._serialized] = {
                    id:item.id,
                    title:item.formattedTitle,
                    chat:item,
                    contact
                };
            });
        } catch(error) {
            log(error);
        }
    };
};

window.onload = LoadUtils;

const MarkAllRead = () => {
    let Chats = window.Store.Chat.models;

    for (let chatIndex in Chats) {
        if (isNaN(chatIndex)) {
            continue;
        }

        let chat = Chats[chatIndex];

        if (chat.unreadCount > 0) {
            chat.markSeen();
            window.Store.Wap.sendConversationSeen(chat.id, chat.getLastMsgKeyForAction(), chat.unreadCount - chat.pendingSeenCount);
        }
    }
};



/*******************************************************************************
********************************************************************************
********************************************************************************


            NO MODIFICAR NADA DESDE AQUI EN ADELANTE!!!


********************************************************************************
********************************************************************************
********************************************************************************/
//
// GLOBAL VARS AND CONFIGS
//
const CHAT_ELEMENT = '._2aBzC';
const CHAT_UNREAD_ICON = '._38M1B';
const MESSAGES_CONTAINER = '';
const MESSAGES = '.GDTQm';
const MESSAGE_IN_ELEMENT = '.message-in';
const MESSAGE_OUT_ELEMENT = 'message-out';
const MESSAGE_SYSTEM_ELEMENT = 'msg-system';
const MESSAGE_CONTENT = '.selectable-text';
const MESSAGE_INPUT = '[contenteditable="true"]';
const MESSAGE_SEND_BUTTON = 'span[data-icon="send"]';
const CHAT_ACTIVE_TITLE = '#main span[title]';
const CHATS_LIST_TITLE = '._3Dr46 span[title]'; //all chats 
const CHATS_LIST_LAST_MSG = '._1SjZ2 ._1adfa._35k-1'; //all chats 

const log = console.log;
const __debug = true;

//
// FUNCTIONS
//
function empty (mixedVar) {
  let undef
  let key
  let i
  let len
  const emptyValues = [undef, null, false, 0, '', '0']
  for (i = 0, len = emptyValues.length; i < len; i++) {
    if (mixedVar === emptyValues[i]) {
      return true
    }
  }
  if (typeof mixedVar === 'object') {
    for (key in mixedVar) {
      if (mixedVar.hasOwnProperty(key)) {
        return false
      }
    }
    return true
  }
  return false
}

function isset () {
  const a = arguments
  const l = a.length
  let i = 0
  let undef
  if (l === 0) {
    throw new Error('Empty isset')
  }
  while (i !== l) {
    if (a[i] === undef || a[i] === null) {
      return false
    }
    i++
  }
  return true
}

// Dispath an event (of click, por instance)
const eventFire = (el, etype) => {
    var evt = document.createEvent("MouseEvents");
    evt.initMouseEvent(etype, true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    if (__debug) log ( el.dispatchEvent(evt) );
    else el.dispatchEvent(evt);
}

//
// MAIN LOGIC
//
let i;
const start = async () => {
    try {
        if (window.location.href.indexOf('web.whatsapp.com') !== -1) {
            i = setInterval(__sendMessage, 300);
        } else if (window.location.href.indexOf('api.whatsapp.com') !== -1) {
            i = setInterval(openWebWhatsApp, 300);
        }
    } catch(error) {
        log([error]);
    }
}

const openWebWhatsApp = ()=>{
    if (!!document.querySelector('#action-button')) {
        eventFire(document.querySelector('#action-button'), 'click');
        //clearInterval( i );
    }
    
    Array.from( document.querySelectorAll('a._36or') ).map( el => { 
        if (el.innerText.toLowerCase().indexOf('whatsapp web') !== -1 && el.getAttribute('href').indexOf('phone') !== -1) {
            eventFire(el, 'click');
            clearInterval( i );
        }
    });
}

// Send a message
const __sendMessage = (message, cb) => {
    try {
        let messageBox = document.querySelectorAll( MESSAGE_INPUT )[1];
    
        //add text into input field
        if (!!message && message.length>0) messageBox.innerHTML = message.replace(/  /gm,'');
        
        //if message is empty and messagebox not
        message = messageBox.innerText;
        
        //Force refresh
        event = document.createEvent("UIEvents");
        event.initUIEvent("focus", true, true, window, 1);
        messageBox.dispatchEvent(event);
    
        event.initUIEvent("input", true, true, window, 1);
        messageBox.dispatchEvent(event);
        
        event.initUIEvent("blur", true, true, window, 1);
        messageBox.dispatchEvent(event);
    
        //Click at Send Button
        if (!!message && message.length>0) {
            eventFire(document.querySelector( MESSAGE_SEND_BUTTON ), 'click');
            clearInterval( i );
            try {
                if (typeof cb == 'function') {
                    cb();
                } else { 
                    setTimeout(function(){
                        window.close();
                    }, 1000);
                }
            } catch(e) {
                console.log([e]);
            }
        }
    } catch(error) {
        console.log([error]);
    }
}

async function askReadPermission() {
    try {
        const { state } = await window.navigator.permissions.query({ name: 'clipboard-read' });
        return state === 'granted';
    } catch (error) {
        return false;
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

let i3 = setInterval(renderUI, 1000*1);
function renderUI() {
    let container = document.querySelector('._1QVfy._3UaCz span');
    if (!container) return;
    clearInterval(i3);
    
    window.WWebJS.loadChats();
    
    let div = document.createElement('div');
    div.classList.add('_2cNrC');
    div.classList.add('bot-container');
    document.querySelector('._1QVfy._3UaCz span').appendChild( div );
    
    let button = document.createElement('button');
    button.classList.add('btn-bot');
    
    let btnAskPermissions = button.cloneNode(true);
    
    let img  = document.createElement('img');
    img.style.background = '#b0ffcc';
    img.style.borderRadius = '4px';
    img.style.marginTop = '0px';
    img.width= '24';
    img.src  = 'data:image/png;base64,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';
    
    btnAskPermissions.appendChild( img );
    btnAskPermissions.addEventListener('click', async function(e) {
        document.querySelector('#botNotifications').style.display = 'block';
        let canReadToClipboard  = await askReadPermission();
        if (canReadToClipboard) {
            document.querySelector('#botNotifications').innerText = 'Permitido!';
            
            navigator.clipboard.readText().then(text=>{
                let data = text.split(':');
                let phones = data[0].split(',');
                let base64Img = data[1];
                let queue = [];
                let a;
                
                log([phones, base64Img]);
                
                phones.map(async p=>{
                    if (!queue.includes( p )) {
                        
                        queue.push( p );
                        
                        a = Object.keys(wwChats).filter(i=>{
                            return i.indexOf( p.replace(/\D/,'').substr(2) ) != -1 && !wwChats[i].chat.isGroup;
                        });
                            
                        sleep( 4 );
                        
                        if (!!wwChats[a[0]]) {
                            
                            let r = WWebJS.sendMessage(
                                wwChats[a[0]].chat,
                                '',
                                {
                                    attachment: {
                                        data:base64Img,
                                        mime_type:'image/png',
                                        filename:'image.png'
                                    },
                                    sendMediaAsSticker:false,
                                    sendAudioAsVoice:false, 
                                    sendMediaAsDocument:false, 
                                    sendVideoAsGif:false
                                }
                            );
                            
                            log(Promise.resolve(r)); 
                            
                        }
                    }
                });
            });
        } else {
            document.querySelector('#botNotifications').innerText = 'NO Permitido!';
        }
        setTimeout(function() { 
            document.querySelector('#botNotifications').style.display = 'none'; 
        }, 2000);
    });
    
    let span = document.createElement('span');
    span.setAttribute('id', 'botNotifications');
    span.style.width    = '100px';
    span.style.height   = '20px';
    span.style.display  = 'none';
    span.style.clear    = 'both';
    span.style.margin   = '10px';
    span.style.padding  = '10px';
    span.style.background   = '#fefefe';
    span.style.borderRadius = '4px';
    span.style.position = 'absolute';
    span.style.top      = '10px';
    span.style.left     = '-400%';
    span.style.zIndex   = '40';
    span.style.textAlign= 'center';
    span.style.fontWeight= 'bold';
    span.style.color    = '#000';
    
    div.appendChild( btnAskPermissions );
    div.appendChild( span );
}

function sleep(s) {
    return new Promise(resolve => setTimeout(resolve, s*1000));
}

start();