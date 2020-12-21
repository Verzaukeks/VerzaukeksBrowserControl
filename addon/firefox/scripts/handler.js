const converter = {

    insertTab: (json, tab) => {
        json.tab = converter.tabAsJson(tab);
    },

    tabAsJson: (tab) => {
        let json = {};
        json.id = tab.id;
        json.url = tab.url;
        json.title = tab.title;
        json.status = tab.status;
        return json;
    }

};

const browserAction = {

    blinkStatus: false,
    blinkIntervalId: 0,

    init: () => {
        browser.browserAction.setBadgeTextColor({ color: '#f77c' });
        browser.browserAction.setBadgeBackgroundColor({ color: '#0000' });
        if (config.connectorEnabled) browserAction.blink();
    },

    clearBlink: () => {
        clearTimeout(browserAction.blinkIntervalId);
        browserAction.blinkStatus = false;
        browser.browserAction.setBadgeText({ text: '' });
    },

    blink: () => {
        if (debug.isMobile) {
            browser.browserAction.setBadgeText({ text: '⨀' });
            browserAction.blinkStatus = true;
            return;
        }
        browserAction.blinkIntervalId = setInterval(() => {
            if (browserAction.blinkStatus) {
                browser.browserAction.setBadgeText({ text: '' });
                browserAction.blinkStatus = false;
            } else {
                browser.browserAction.setBadgeText({ text: '⨀' });
                browserAction.blinkStatus = true;
            }
        }, 500);
    }

};

const handler = {

    doWhenTabCompleted: (tabId, onCompleted) => {
        browser.tabs.get(tabId)
            .then(tab => {
                if (tab.status == 'loading')
                    setTimeout(handler.doWhenTabCompleted, 10, tabId, onCompleted);
                else
                    onCompleted(tab);
            });
    },

    init: () => {
        browser.tabs.onCreated.addListener(tab => {
            let packet = {};
            packet.id = -1;
            packet.type = "onTabCreated";

            packet.response = {};
            converter.insertTab(packet.response, tab);
            connector.sendUpdate(packet);
        });
        browser.tabs.onUpdated.addListener((_1, _2, tab) => {
            let packet = {};
            packet.id = -1;
            packet.type = "onTabUpdated";

            packet.response = {};
            converter.insertTab(packet.response, tab);
            connector.sendUpdate(packet);
        });
    },

    newTab: (packet) => {
        browser.tabs.create({
            url: packet.request.url,
            active: packet.request.active
        })
            .then(tab => {
                let response = {};
                converter.insertTab(response, tab);
                connector.sendAnswer(packet, response);
            })
    },

    getCurrentTab: (packet) => {
        browser.tabs.query({ currentWindow: true, active: true })
            .then(tabs => {
                let tab = tabs[tabs.length-1];

                let response = {};
                converter.insertTab(response, tab);
                connector.sendAnswer(packet, response);
            });
    },

    getTabs: (packet) => {
        browser.tabs.query({})
            .then(tabs => {
                let response = {};
                response.tabs = [];

                for (let tab of tabs) {
                    let json = converter.tabAsJson(tab);
                    response.tabs.push(json);
                }
                connector.sendAnswer(packet, response);
            });
    },



    getTabFromId: (packet) => {
        browser.tabs.get(packet.request.tabId)
            .then(tab => {
                let response = {};
                converter.insertTab(response, tab);
                connector.sendAnswer(packet, response);
            });
    },

    reloadTab: (packet) => {
        browser.tabs.reload(packet.request.tabId, { bypassCache: packet.request.bypassCache })
            .then(() => connector.sendAnswer(packet, {}));
    },

    removeTab: (packet) => {
        browser.tabs.remove(packet.request.tabId)
            .then(() => connector.sendAnswer(packet, {}));
    },

    executeScript: (packet) => {
        handler.doWhenTabCompleted(packet.request.tabId, (tab) => {
            let script = 'try { ' + packet.request.script + ' } catch (e) {}';
            browser.tabs.executeScript(packet.request.tabId, { code: script })
                .then(results => {
                    let response = {};
                    response.result = results[0];
                    connector.sendAnswer(packet, response);
                });
        });
    },

    insertCSS: (packet) => {
        handler.doWhenTabCompleted(packet.request.tabId, (tab) => {
            browser.tabs.insertCSS(packet.request.tabId, { code: packet.request.css })
                .then(() => connector.sendAnswer(packet, {}));
        });
    }

};