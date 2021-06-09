const config = {

    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),

    connectorEnabled: false,
    connectorAddress: '127.0.0.1:58001',
    connectorCheckInterval: 500,
    darkMode: true,

    dataPacketsSend: 0,
    dataPacketsReceived: 0,
    endpointReachable: false,

    load: () => {
        browser.storage.local.get({
            connectorEnabled: false,
            connectorAddress: '127.0.0.1:58001',
            connectorCheckInterval: 500,
            darkMode: true
        })
            .then(data => {
                config.connectorEnabled = data.connectorEnabled
                config.connectorAddress = data.connectorAddress
                config.connectorCheckInterval = data.connectorCheckInterval
                config.darkMode = data.darkMode
            })
    },

    save: () => {
        browser.storage.local.set({
            connectorEnabled: config.connectorEnabled,
            connectorAddress: config.connectorAddress,
            connectorCheckInterval: config.connectorCheckInterval,
            darkMode: config.darkMode
        })
    },

    init: () => {
        browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.receiver != 'config') return

            if (request.command == 'receive') {
                sendResponse(config)
            }
            else if (request.command == 'insert') {
                config.connectorAddress = request.address
                config.connectorCheckInterval = parseInt(request.interval)
                config.save()

                if (config.connectorEnabled) {
                    clearTimeout(connector.checkForUpdatesId)
                    connector.checkForUpdates()
                }
            }

            else if (request.command == 'enableConnector') {
                if (config.connectorEnabled) return

                config.connectorEnabled = true
                connector.checkForUpdates()
                browserAction.blink()
            }
            else if (request.command == 'disableConnector') {
                if (!config.connectorEnabled) return

                config.connectorEnabled = false
                clearTimeout(connector.checkForUpdatesId)
                browserAction.clearBlink()
            }

            else if (request.command == 'toggleDarkMode') {
                config.darkMode = !config.darkMode
                config.save()
            }
        })
    }

}