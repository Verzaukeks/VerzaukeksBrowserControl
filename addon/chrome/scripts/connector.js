const connector = {

    checkForUpdatesId: 0,
    checkForUpdates: () => {
        if (!config.connectorEnabled) return;
        if (connector.checkForUpdatesId == -1) return;
        connector.checkForUpdatesId = -1;
        fetch('http://' + config.connectorHost + ':' + config.connectorPort + '/' + config.connectorCheckInterval)
            .then(response => {
                debug.log(debug.CONNECTOR_RECEIVE, () => 'connector packet received: ' + response);
                return response.json();
            })
            .then(json => {
                if (json.queue) json.queue.forEach(connector.onUpdate);
                connector.checkForUpdatesId = setTimeout(connector.checkForUpdates, config.connectorCheckInterval);
            })
            .catch(error => {
                connector.checkForUpdatesId = setTimeout(connector.checkForUpdates, config.connectorCheckInterval);
            });
    },

    onUpdate: (packet) => {
        if (!packet.type) return
        switch (packet.type) {
        case "ping":
            connector.sendAnswer(packet, {});
            break;

        case "newTab":
            handler.newTab(packet);
            break;
        case "getCurrentTab":
            handler.getCurrentTab(packet);
            break;
        case "getTabs":
            handler.getTabs(packet);
            break;

        case "getTabFromId":
            handler.getTabFromId(packet);
            break;
        case "reloadTab":
            handler.reloadTab(packet);
            break;
        case "removeTab":
            handler.removeTab(packet);
            break;
        case "executeScript":
            handler.executeScript(packet);
            break;
        case "insertCSS":
            handler.insertCSS(packet);
            break;
        default:
            return;
        }
        config.dataPacketsReceived ++;
    },

    sendUpdate: (packet, onResponse) => {
        if (!config.connectorEnabled) return;
        let strPacket = JSON.stringify(packet)
        debug.log(debug.CONNECTOR_SEND, () => 'connector packet send: ' + strPacket);

        fetch('http://' + config.connectorHost + ':' + config.connectorPort, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: strPacket
        })
            .then(response => response.json())
            .then(json => {
                if (onResponse) onResponse(json);
                config.dataPacketsSend ++;
            })
    },

    sendAnswer: (packet, response) => {
        if (!packet.expectAnswer) return;
        connector.sendUpdate({
            id: packet.id,
            type: packet.type,
            response: response
        });
    }

};