const config = {

    connectorEnabled: false,
    connectorHost: '127.0.0.1',
    connectorPort: 58001,
    connectorCheckInterval: 500,

    dataPacketsSend: 0,
    dataPacketsReceived: 0

};

browser.storage.local.get(config)
.then(data => {
    config.connectorEnabled = data.connectorEnabled;
    config.connectorHost = data.connectorHost;
    config.connectorPort = data.connectorPort;
    config.connectorCheckInterval = data.connectorCheckInterval;
    config.dataPacketsSend = data.dataPacketsSend;
    config.dataPacketsReceived = data.dataPacketsReceived;
});

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.receiver != 'config') return;

    if (request.command == 'receive') {
        sendResponse(config);
    }
    else if (request.command == 'insert') {
        if (config.connectorEnabled)
            clearTimeout(connector.checkForUpdatesId);

        config.connectorHost = request.host;
        config.connectorPort = parseInt(request.port);
        config.connectorCheckInterval = parseInt(request.interval);
        browser.storage.local.set(config);

        if (config.connectorEnabled) {
            if (connector.checkForUpdatesId != -1)
                connector.checkForUpdates();
        }
    }

    else if (request.command == 'enableConnector') {
        if (config.connectorEnabled) return;

        config.connectorEnabled = true;
        if (connector.checkForUpdatesId != -1)
            connector.checkForUpdates();
    }
    else if (request.command == 'disableConnector') {
        if (!config.connectorEnabled) return;

        config.connectorEnabled = false;
        clearTimeout(connector.checkForUpdatesId);
    }
});