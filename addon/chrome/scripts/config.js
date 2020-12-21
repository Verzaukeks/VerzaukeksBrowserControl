const config = {

    version: 1,
    connectorEnabled: false,
    connectorHost: '127.0.0.1',
    connectorPort: 58001,
    connectorCheckInterval: 500,

    dataPacketsSend: 0,
    dataPacketsReceived: 0,
    darkMode: false,

    load: () => {
        chrome.storage.local.get({
            version: -1,
            connectorEnabled: false,
            connectorHost: '127.0.0.1',
            connectorPort: 58001,
            connectorCheckInterval: 500,
           darkMode: false
        }, data => {
           if (data.version != config.version) {
               debug.log(debug.CONFIG, () => 'saved config outdated');
               return;
           }
           config.connectorEnabled = data.connectorEnabled;
           config.connectorHost = data.connectorHost;
           config.connectorPort = data.connectorPort;
           config.connectorCheckInterval = data.connectorCheckInterval;
           config.darkMode = data.darkMode;
           debug.log(debug.CONFIG, () => 'config successfully loaded');
       });
    },

    save: () => {
        chrome.storage.local.set({
            version: config.version,
            connectorEnabled: config.connectorEnabled,
            connectorHost: config.connectorHost,
            connectorPort: config.connectorPort,
            connectorCheckInterval: config.connectorCheckInterval,
            darkMode: config.darkMode
        }, ret => {
           debug.log(debug.CONFIG, () => 'config successfully saved');
       });
    },

    init: () => {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.receiver != 'config') return;
            debug.log(debug.CONFIG, () => 'config packet received: ' + JSON.stringify(request));

            if (request.command == 'receive') {
                sendResponse(config);
            }
            else if (request.command == 'insert') {
                config.connectorHost = request.host;
                config.connectorPort = parseInt(request.port);
                config.connectorCheckInterval = parseInt(request.interval);
                config.save();

                if (config.connectorEnabled) {
                    clearTimeout(connector.checkForUpdatesId);
                    connector.checkForUpdates();
                }
            }

            else if (request.command == 'enableConnector') {
                if (config.connectorEnabled) return;

                config.connectorEnabled = true;
                connector.checkForUpdates();
                chromeAction.blink();
            }
            else if (request.command == 'disableConnector') {
                if (!config.connectorEnabled) return;

                config.connectorEnabled = false;
                clearTimeout(connector.checkForUpdatesId);
                chromeAction.clearBlink();
            }

            else if (request.command == 'toggleDarkMode') {
                config.darkMode = !config.darkMode;
                config.save();
            }
        });
    }

};