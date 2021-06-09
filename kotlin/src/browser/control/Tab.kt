package browser.control

import com.google.gson.JsonObject
import java.util.ArrayList

class Tab(
        private val browser: Browser,
        val id: Int,
        var url: String,
        var title: String,
        var status: String
)  {

    companion object {
        fun fromJson(browser: Browser, json: JsonObject): Tab {
            return Tab(browser,
                json["id"]?.asInt ?: -1,
                json["url"]?.asString ?: "",
                json["title"]?.asString ?: "",
                json["status"]?.asString ?: "")
        }
    }

    /**
     * pull updated information from the addon about this tab, because it will not automatically do so
     * (function blocks)
     */
    fun updateInfo() {
        val response = browser.request(JsonObject().apply {
            addProperty("tabId", id)
        }, "getTabFromId", true)!!

        val tab = response["tab"].asJsonObject
        url = tab["url"].asString
        title = tab["title"].asString
        status = tab["status"].asString
    }

    /**
     * (function does not block)
     * @param bypassCache (default = false)
     */
    fun reload(bypassCache: Boolean = false) {
        browser.request(JsonObject().apply {
            addProperty("tabId", id)
            addProperty("bypassCache", bypassCache)
        }, "reloadTab", false)
    }

    /**
     * (function does not block)
     */
    fun remove() {
        browser.request(JsonObject().apply {
            addProperty("tabId", id)
        }, "removeTab", false)
    }

    /**
     * @param script
     * @param expectAnswer (default = true) if set to true, function will block until a response is received,
     * if set to false, function will directly return an empty string
     */
    fun executeScript(script: String, expectAnswer: Boolean = true): String {
        val response = browser.request(JsonObject().apply {
            addProperty("tabId", id)
            addProperty("script", script)
        }, "executeScript", expectAnswer) ?: return ""

        if ("result" !in response) return ""
        return response["result"].asString
    }

    fun insertCSS(css: String) {
        browser.request(JsonObject().apply {
            addProperty("tabId", id)
            addProperty("css", css)
        }, "insertCSS", false)
    }

    /**
     * @param selector document.querySelector($selector)
     * @param waitTillFinished (default = true) block until browser has actually pressed the button
     */
    fun clickElement(selector: String, waitTillFinished: Boolean = true)
            = executeScript("document.querySelector('$selector').click();", waitTillFinished)

    /**
     * @param selector document.querySelector($selector)
     * @param value
     * @param waitTillFinished (default = false) block until browser has actually inserted the value
     */
    fun inputText(selector: String, value: String, waitTillFinished: Boolean = false)
            = executeScript("document.querySelector('$selector').value = '$value';", waitTillFinished)

    /**
     * @param selector (default = "html") document.querySelector($selector)
     */
    fun querySelector(selector: String = "html")
            = executeScript("document.querySelector('$selector').outerHTML;")

    fun querySelectorAll(selector: String): List<String> {
        val response = executeScript("var ret_38764238074687246823 = ''; document.querySelectorAll('$selector').forEach(element => ret_38764238074687246823 += element.outerHTML + '\\n'); ret_38764238074687246823;")
        if (response.isEmpty()) return ArrayList<String>()
        return response.substring(0, response.length-1).split("\n")
    }

    override fun toString() = "Tab{id=$id, url='$url', title='$title', status=$status}"

}