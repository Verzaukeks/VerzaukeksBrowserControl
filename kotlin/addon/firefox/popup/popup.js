const binding = {
    status: document.getElementById('status'),
    host: document.getElementById('host'),
    port: document.getElementById('port'),
    interval: document.getElementById('interval'),
    send: document.getElementById('send'),
    received: document.getElementById('received'),
    save: document.getElementById('save'),
    stop: document.getElementById('stop'),
    start: document.getElementById('start')
};

function updateInformation(onlyPackets) {
    browser.runtime.sendMessage({
        'receiver': 'config',
        'command': 'receive'
    }).then(config => {
        if (!onlyPackets) {
            binding.status.textContent = (config.connectorEnabled ? 'Running' : 'Halted');
            binding.host.value = config.connectorHost;
            binding.port.value = config.connectorPort;
            binding.interval.value = config.connectorCheckInterval;
        }
        binding.send.textContent = config.dataPacketsSend;
        binding.received.textContent = config.dataPacketsReceived;
    });
}

binding.save.onclick = () => {
    browser.runtime.sendMessage({
        'receiver': 'config',
        'command': 'insert',
        'host': binding.host.value,
        'port': binding.port.value,
        'interval': binding.interval.value
    }).then(response => {
        updateInformation(false);
    });
};

binding.stop.onclick = () => {
    browser.runtime.sendMessage({
        'receiver': 'config',
        'command': 'disableConnector'
    }).then(response => {
        updateInformation(false);
    });
};

binding.start.onclick = () => {
    browser.runtime.sendMessage({
        'receiver': 'config',
        'command': 'enableConnector'
    }).then(response => {
        updateInformation(false);
    });
};

binding.host.placeholder = '127.0.0.1';
binding.port.placeholder = '58001';
binding.interval.placeholder = '500';

setInterval(updateInformation, 1000, true);
updateInformation(false);