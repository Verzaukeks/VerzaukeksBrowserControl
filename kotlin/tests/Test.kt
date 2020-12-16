import browser.control.Browser
import java.lang.Thread.sleep

// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API

fun main(args: Array<String>) {

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


    sleep(1000)
    browser.stop() // stop(clearListeners)

}