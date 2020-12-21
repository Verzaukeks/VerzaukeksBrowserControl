let darkThemeLink = null;

const binding = {
    logo: document.getElementById('logo'),
    status: document.getElementById('status'),
    host: document.getElementById('host'),
    port: document.getElementById('port'),
    interval: document.getElementById('interval'),
    send: document.getElementById('send'),
    received: document.getElementById('received'),
    toggleTheme: document.getElementById('toggleTheme'),
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
            if (config.connectorEnabled) {
                binding.logo.setAttribute('class', 'green');
                binding.status.textContent = 'Running';

                binding.host.disabled = true;
                binding.port.disabled = true;
                binding.interval.disabled = true;

                binding.save.setAttribute('class', 'disabled');
                binding.stop.removeAttribute('class');
                binding.start.setAttribute('class', 'disabled');
            } else {
                binding.logo.removeAttribute('class');
                binding.status.textContent = 'Halted';

                binding.host.disabled = false;
                binding.port.disabled = false;
                binding.interval.disabled = false;

                binding.save.removeAttribute('class');
                binding.stop.setAttribute('class', 'disabled');
                binding.start.removeAttribute('class');
            }
            binding.host.value = config.connectorHost;
            binding.port.value = config.connectorPort;
            binding.interval.value = config.connectorCheckInterval;

            if (config.darkMode) {
                darkThemeLink = document.createElement('LINK');
                darkThemeLink.setAttribute('rel', 'stylesheet');
                darkThemeLink.setAttribute('href', 'popup_dark.css');
                document.head.appendChild(darkThemeLink);

                binding.toggleTheme.textContent = '🌕';
            } else {
                if (darkThemeLink != null)
                    document.head.removeChild(darkThemeLink);

                binding.toggleTheme.textContent = '🌑';
            }
        }
        binding.send.textContent = config.dataPacketsSend;
        binding.received.textContent = config.dataPacketsReceived;
    });
}

function sendSaveMessage(onResponse) {
    browser.runtime.sendMessage({
        'receiver': 'config',
        'command': 'insert',
        'host': binding.host.value,
        'port': binding.port.value,
        'interval': binding.interval.value
    }).then(onResponse);
}

binding.toggleTheme.onclick = () => {
    browser.runtime.sendMessage({
        'receiver': 'config',
        'command': 'toggleDarkMode'
    }).then(response => {
      updateInformation(false);
    });
};

binding.save.onclick = () => {
    if (binding.save.getAttribute('class') == 'disabled') return;
    binding.save.setAttribute('class', 'disabled');
    sendSaveMessage(response => {
        setTimeout(updateInformation, 1000, false);
    });
};

binding.stop.onclick = () => {
    if (binding.stop.getAttribute('class') == 'disabled') return;
    browser.runtime.sendMessage({
        'receiver': 'config',
        'command': 'disableConnector'
    }).then(response => {
        updateInformation(false);
    });
};

binding.start.onclick = () => {
    if (binding.start.getAttribute('class') == 'disabled') return;
    sendSaveMessage(r => {
        browser.runtime.sendMessage({
            'receiver': 'config',
            'command': 'enableConnector'
        }).then(response => {
            updateInformation(false);
        });
    });
};

binding.host.placeholder = '127.0.0.1';
binding.port.placeholder = '58001';
binding.interval.placeholder = '500';

setInterval(updateInformation, 1000, true);
updateInformation(false);