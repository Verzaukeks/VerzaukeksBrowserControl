# VerzaukeksBrowserControl
Control your browser within your code
and get access to many useful features as if it were an add-on.

[Download Firefox-Addon Here](https://addons.mozilla.org/en-US/firefox/addon/verzaukeksbrowsercontrol/)

![Firefox Popup](addon/firefox/extras/screenshot_popup.png)

### Dependencies
* [gson](https://github.com/google/gson)

### Kotlin Usage
```kotlin
val browser = Browser()
browser.start() // browser.start(port)

val tab = browser.newTab("https://example.com") // newTab(url, active)
val currentTab = browser.getCurrentTab()
val tabs = browser.getTabs()

browser.onTabCreated { println("New tab was created: $it") }
browser.onTabUpdated { println("A tab was updated: $it") }


val result = tab.executeScript("console.log('hello'); 'result value';") // executeScript(script, expectAnswer)
tab.insertCSS("* { background: red }")

tab.clickElement("button") // clickElement(selector, waitTillFinished)
tab.inputText("input", "custom text here") // inputText(selector, value, waitTillFinished)

val element = tab.querySelector("h1")
val elements = tab.querySelectorAll("div")

tab.updateInfo()
tab.reload() // tab.reload(bypassCache)
tab.remove()


browser.stop() // stop(clearListeners)
```