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
                    if ("id" in json) json["id"].asInt else -1,
                    if ("url" in json) json["url"].asString else "",
                    if ("title" in json) json["title"].asString else "",
                    if ("status" in json) json["status"].asString else "")
        }
    }

    fun updateInfo() {
        val response = browser.request(JsonObject().apply {
            addProperty("tabId", id)
        }, "getTabFromId", true)!!

        val tab = response["tab"].asJsonObject
        url = tab["url"].asString
        title = tab["title"].asString
        status = tab["status"].asString
    }

    fun reload(bypassCache: Boolean = false) {
        browser.request(JsonObject().apply {
            addProperty("tabId", id)
            addProperty("bypassCache", bypassCache)
        }, "reloadTab", false)
    }

    fun remove() {
        browser.request(JsonObject().apply {
            addProperty("tabId", id)
        }, "removeTab", false)
    }

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

    fun clickElement(selector: String, waitTillFinished: Boolean = true)
            = executeScript("document.querySelector('$selector').click();", waitTillFinished)

    fun inputText(selector: String, value: String, waitTillFinished: Boolean = false)
            = executeScript("document.querySelector('$selector').value = '$value';", waitTillFinished)

    fun querySelector(selector: String = "html")
            = executeScript("document.querySelector('$selector').outerHTML;")

    fun querySelectorAll(selector: String): List<String> {
        val response = executeScript("var ret_38764238074687246823 = ''; document.querySelectorAll('$selector').forEach(element => ret_38764238074687246823 += element.outerHTML + '\\n'); ret_38764238074687246823;")
        if (response.isEmpty()) return ArrayList<String>()
        return response.substring(response.indices).split("\n")
    }

    override fun toString() = "Tab{id=$id, url='$url', title='$title', status=$status}"

}