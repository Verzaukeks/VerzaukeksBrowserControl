package browser.control

import com.google.gson.JsonArray
import com.google.gson.JsonObject

class TabOptions {

    /** Whether the tabs are active in their windows. */
    var active: Boolean? = null

    /** Whether the tabs are audible. */
    var audible: Boolean? = null

    /** Whether the tabs can be discarded automatically by the browser when resources are low. */
    var autoDiscardable: Boolean? = null

    /** Use this to return only tabs whose cookie store ID is cookieStoreId. */
    var cookieStoreId: String? = null

    /** Whether the tabs are in the current window. */
    var currentWindow: Boolean? = null

    /** Whether the tabs are discarded. A discarded tab is one whose content has been unloaded from memory, but is still visible in the tab strip. Its content gets reloaded the next time it's activated. */
    var discarded: Boolean? = null

    /** Whether the tabs are hidden. */
    var hidden: Boolean? = null

    /** Whether the tabs are highlighted. */
    var highlighted: Boolean? = null

    /** The position of the tabs within their windows. */
    var index: Int? = null

    /** Whether the tabs are muted. */
    var muted: Boolean? = null

    /** Whether the tabs are in the last focused window. */
    var lastFocusedWindow: Boolean? = null

    /** Whether the tabs are pinned. */
    var pinned: Boolean? = null

    /** Whether the tabs have completed loading.
     * Possible values are: 'loading' and 'complete' */
    var status: String? = null

    /** Match page titles against a pattern. */
    var title: String? = null

    /** Match tabs against one or more match patterns. Note that fragment identifiers are not matched. */
    var url: String? = null
    /** Match tabs against one or more match patterns. Note that fragment identifiers are not matched. */
    var urls: List<String>? = null

    /** The id of the parent window. */
    var windowId: Int? = null

    /** The type of window the tabs are in.
     * Possible values are: 'normal', 'popup', 'panel', 'devtools' */
    var windowType: String? = null

    fun toJson() = JsonObject().apply {
        if (active != null) addProperty("active", active)
        if (audible != null) addProperty("audible", audible)
        if (autoDiscardable != null) addProperty("autoDiscardable", autoDiscardable)
        if (cookieStoreId != null) addProperty("cookieStoreId", cookieStoreId)
        if (currentWindow != null) addProperty("currentWindow", currentWindow)
        if (discarded != null) addProperty("discarded", discarded)
        if (hidden != null) addProperty("hidden", hidden)
        if (highlighted != null) addProperty("highlighted", highlighted)
        if (index != null) addProperty("index", index)
        if (muted != null) addProperty("muted", muted)
        if (lastFocusedWindow != null) addProperty("lastFocusedWindow", lastFocusedWindow)
        if (pinned != null) addProperty("pinned", pinned)
        if (status != null) addProperty("status", status)
        if (title != null) addProperty("title", title)
        if (url != null) addProperty("url", url)
        if (urls != null) add("url", JsonArray().also { urls!!.forEach(it::add) })
        if (windowId != null) addProperty("windowId", windowId)
        if (windowType != null) addProperty("windowType", windowType)
    }

}