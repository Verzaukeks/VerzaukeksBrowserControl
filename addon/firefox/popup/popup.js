let darkThemeLink = undefined

const binding = {
    logo: document.getElementById('logo'),
    address: document.getElementById('address'),
    interval: document.getElementById('interval'),
    send: document.getElementById('send'),
    received: document.getElementById('received'),
    toggleTheme: document.getElementById('toggleTheme'),
    save: document.getElementById('save'),
    stop: document.getElementById('stop'),
    start: document.getElementById('start')
}

function updateInformation(onlyPackets) {
    browser.runtime.sendMessage({
        'receiver': 'config',
        'command': 'receive'
    }).then(config => {
        if (!onlyPackets) {
            if (config.connectorEnabled) {
                binding.address.disabled = true
                binding.interval.disabled = true

                binding.save.setAttribute('class', 'disabled')
                binding.stop.removeAttribute('class')
                binding.start.setAttribute('class', 'disabled')
            } else {
                binding.address.disabled = false
                binding.interval.disabled = false

                binding.save.removeAttribute('class')
                binding.stop.setAttribute('class', 'disabled')
                binding.start.removeAttribute('class')
            }
            binding.address.value = config.connectorAddress
            binding.interval.value = config.connectorCheckInterval

            if (config.darkMode) {
                if (darkThemeLink == undefined || darkThemeLink == null) {
                    darkThemeLink = document.createElement('LINK')
                    darkThemeLink.setAttribute('rel', 'stylesheet')
                    darkThemeLink.setAttribute('href', 'popup_dark.css')
                    document.head.appendChild(darkThemeLink)

                    binding.toggleTheme.textContent = '🌕'
                }
            } else {
                if (darkThemeLink == undefined || darkThemeLink != null) {
                    if (darkThemeLink != undefined) document.head.removeChild(darkThemeLink)
                    darkThemeLink = null

                    binding.toggleTheme.textContent = '🌑'
                }
            }
        }

        if (config.connectorEnabled) {
            if (config.endpointReachable) binding.logo.setAttribute('class', 'green')
            else binding.logo.setAttribute('class', 'yellow')
        } else binding.logo.setAttribute('class', 'gray')

        binding.send.textContent = config.dataPacketsSend
        binding.received.textContent = config.dataPacketsReceived
    })
}

function sendSaveMessage(onResponse) {
    browser.runtime.sendMessage({
        'receiver': 'config',
        'command': 'insert',
        'address': binding.address.value,
        'interval': binding.interval.value
    }).then(onResponse)
}

binding.toggleTheme.onclick = () => {
    browser.runtime.sendMessage({
        'receiver': 'config',
        'command': 'toggleDarkMode'
    }).then(response => {
      updateInformation(false)
    })
}

binding.save.onclick = () => {
    if (binding.save.getAttribute('class') == 'disabled') return
    binding.save.setAttribute('class', 'disabled')
    sendSaveMessage(response => {
        setTimeout(updateInformation, 1000, false)
    })
}

binding.stop.onclick = () => {
    if (binding.stop.getAttribute('class') == 'disabled') return
    browser.runtime.sendMessage({
        'receiver': 'config',
        'command': 'disableConnector'
    }).then(response => {
        updateInformation(false)
    })
}

binding.start.onclick = () => {
    if (binding.start.getAttribute('class') == 'disabled') return
    sendSaveMessage(r => {
        browser.runtime.sendMessage({
            'receiver': 'config',
            'command': 'enableConnector'
        }).then(response => {
            updateInformation(false)
        })
    })
}

binding.address.placeholder = '127.0.0.1:58001'
binding.interval.nextElementSibling.textContent = '500'
binding.interval.oninput = () => { binding.interval.nextElementSibling.textContent = binding.interval.value }

setInterval(updateInformation, 1000, true)
updateInformation(false)