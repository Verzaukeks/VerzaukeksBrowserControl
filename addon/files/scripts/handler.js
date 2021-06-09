const converter = {

    tabAsJson: (tab) => {
        let json = {}
        json.id = tab.id
        json.url = tab.url
        json.title = tab.title
        json.status = tab.status
        return json
    }

}

const browserAction = {

    blinkStatus: false,
    blinkIntervalId: 0,

    init: () => {
        chrome.browserAction.setBadgeBackgroundColor({ color: '#0000' })
        if (!config.isChrome) chrome.browserAction.setBadgeTextColor({ color: '#fff000' })
        if (config.connectorEnabled) browserAction.blink()
    },

    updateColor: () => {
        if (config.isChrome) return
        if (config.endpointReachable) browser.browserAction.setBadgeTextColor({ color: '#00ff00' })
        else browser.browserAction.setBadgeTextColor({ color: '#fff000' })
    },

    clearBlink: () => {
        clearTimeout(browserAction.blinkIntervalId)
        browserAction.blinkStatus = false
        chrome.browserAction.setBadgeText({ text: '' })
        if (!config.isChrome) chrome.browserAction.setBadgeTextColor({ color: '#fff000' })
    },

    blink: () => {
        if (config.isMobile) {
            chrome.browserAction.setBadgeText({ text: '⨀' })
            browserAction.blinkStatus = true
            return
        }
        browserAction.blinkIntervalId = setInterval(() => {
            if (browserAction.blinkStatus) {
                chrome.browserAction.setBadgeText({ text: '' })
                browserAction.blinkStatus = false
            } else {
                chrome.browserAction.setBadgeText({ text: '⨀' })
                browserAction.blinkStatus = true
            }
        }, 500)
    }

}

const handler = {

    doWhenTabCompleted: (tabId, onCompleted) => {
        chrome.tabs.get(tabId, (tab) => {
            if (tab.status == 'loading')
                setTimeout(handler.doWhenTabCompleted, 10, tabId, onCompleted)
            else
                onCompleted(tab)
        })
    },

    init: () => {
        chrome.tabs.onCreated.addListener(tab => {
            let packet = {}
            packet.id = -1
            packet.type = "onTabCreated"

            packet.response = {}
            packet.response.tab = converter.tabAsJson(tab)
            connector.sendUpdate(packet)
        })
        chrome.tabs.onUpdated.addListener((_1, _2, tab) => {
            let packet = {}
            packet.id = -1
            packet.type = "onTabUpdated"

            packet.response = {}
            packet.response.tab = converter.tabAsJson(tab)
            connector.sendUpdate(packet)
        })
    },

    newTab: (packet) => {
        chrome.tabs.create({
            url: packet.request.url,
            active: packet.request.active
        }, (tab) => {
            let response = {}
            response.tab = converter.tabAsJson(tab)
            connector.sendAnswer(packet, response)
        })
    },

    getTabs: (packet) => {
        chrome.tabs.query(packet.request.options, (tabs) => {
            let response = {}
            response.tabs = []

            for (let tab of tabs) {
                let json = converter.tabAsJson(tab)
                response.tabs.push(json)
            }
            connector.sendAnswer(packet, response)
        })
    },



    getTabFromId: (packet) => {
        chrome.tabs.get(packet.request.tabId, (tab) => {
            let response = {}
            response.tab = converter.tabAsJson(tab)
            connector.sendAnswer(packet, response)
        })
    },

    reloadTab: (packet) => {
        chrome.tabs.reload(packet.request.tabId, { bypassCache: packet.request.bypassCache }, () => connector.sendAnswer(packet, {}))
    },

    removeTab: (packet) => {
        chrome.tabs.remove(packet.request.tabId, () => connector.sendAnswer(packet, {}))
    },

    executeScript: (packet) => {
        handler.doWhenTabCompleted(packet.request.tabId, (tab) => {
            let script = 'try { ' + packet.request.script + ' } catch (e) {}'
            chrome.tabs.executeScript(packet.request.tabId, { code: script }, (results) => {
                if (results[0] == null) results[0] == undefined
                let response = {}
                response.result = results[0]
                connector.sendAnswer(packet, response)
            })
        })
    },

    insertCSS: (packet) => {
        handler.doWhenTabCompleted(packet.request.tabId, (tab) => {
            chrome.tabs.insertCSS(packet.request.tabId, { code: packet.request.css }, () => connector.sendAnswer(packet, {}))
        })
    }

}