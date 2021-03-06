package browser.control

import com.google.gson.Gson
import com.google.gson.JsonArray
import com.google.gson.JsonObject
import java.io.InvalidObjectException
import java.net.ServerSocket
import java.net.SocketException
import java.util.concurrent.TimeoutException
import kotlin.concurrent.thread

class Browser {

    private var server: ServerSocket? = null
    private var thread: Thread? = null
    private var checkInterval = 500L

    private val gson = Gson()
    private var packetIndex = 1
    private val requestQueue = ArrayList<JsonObject>()
    private val responseQueue = HashMap<Int, JsonObject>()

    private val onTabCreated = ArrayList<(Tab) -> Unit>()
    private val onTabUpdated = ArrayList<(Tab) -> Unit>()

    /**
     * opens the connection to receive messages from an addon
     * @param port (default = 58001)
     * @param daemon (default = false) should the thread run as a deamon
     */
    fun start(port: Int = 58001, daemon: Boolean = false) {
        if (server != null) return

        server = ServerSocket(port)
        thread = thread(isDaemon = daemon, block = ::run)
    }

    /**
     * stops the connection to be able to receive messages from an addon
     * @param clearListeners (default = false) removes all listeners add by onFunctions
     */
    fun stop(clearListeners: Boolean = false) {
        if (server == null) return

        thread?.interrupt()
        server?.close()
        requestQueue.clear()
        responseQueue.clear()
        if (clearListeners) {
            onTabCreated.clear()
            onTabUpdated.clear()
        }

        server = null
        thread = null
    }

    private fun run() {
        while (!Thread.interrupted() && server != null && !server!!.isClosed) {

            val socket = try { server!!.accept() } catch (e: SocketException) { continue }
            val inputStream = socket.getInputStream()
            val outputStream = socket.getOutputStream()

            val headers = HashMap<String,String>()
            val descriptor = readLine(inputStream)
            while (true) {
                val line = readLine(inputStream)
                if (line.isEmpty()) break

                val key = line.substringBefore(": ").lowercase()
                val value = line.substringAfter(": ")
                headers[key] = value
            }

            val type = descriptor.substringBefore(" ").uppercase()
            val contentLength = headers.getOrDefault("content-length", "0").toInt()
            val buffer = ByteArray(contentLength)
            inputStream.read(buffer)

            val json = when (type) {
                "GET" -> {
                    runCatching { descriptor.split(" ")[1].substring(1).toLong() }
                    .onSuccess { checkInterval = it }
                    runGet()
                }
                "POST" -> {
                    val json = gson.fromJson(buffer.decodeToString(), JsonObject::class.java)
                    runPost(json) ?: JsonObject()
                }
                else -> runGet()
            }.let(gson::toJson)

            val response =
                "HTTP/1.1 200 OK\n" +
                "Access-Control-Allow-Origin: *\n" +
                "Access-Control-Allow-Headers: *\n" +
                "Content-Type: application/json\n" +
                "Content-Length: ${json.length}\n" +
                "\n" + json
            outputStream.write(response.encodeToByteArray())
            outputStream.flush()

            inputStream.close()
            outputStream.close()
            socket.close()
        }
    }

    private fun runGet() =
        JsonObject().apply {
            add("queue", JsonArray().apply {
                synchronized(requestQueue) {
                    requestQueue.forEach(::add)
                    requestQueue.clear()
                }
            })
        }

    private fun runPost(packet: JsonObject): JsonObject? {
        if ("id" !in packet || "type" !in packet) return null
        when (packet["type"].asString) {
            "onTabCreated" -> {
                val tab = Tab.fromJson(this, packet["response"].asJsonObject["tab"].asJsonObject)
                onTabCreated.forEach { it(tab) }
            }
            "onTabUpdated" -> {
                val tab = Tab.fromJson(this, packet["response"].asJsonObject["tab"].asJsonObject)
                onTabUpdated.forEach { it(tab) }
            }
            else -> responseQueue[packet["id"].asInt] = packet
        }
        return null
    }

    /**
     * manually send a packet to an addon, normally not invoked by you
     * @param request packet to send
     * @param type packet type so addon knows what to do
     * @param expectAnswer if set to true function will block until addon sends a response back
     * @exception TimeoutException thrown if 12*checkInterval has passed without a response (only if expectAnswer)
     */
    fun request(request: JsonObject, type: String, expectAnswer: Boolean): JsonObject? {
        if (server == null) throw Exception("Server is not running. Browser.start() has yet to be called.")
        val id = packetIndex++

        val packet = JsonObject().apply {
            addProperty("id", id)
            addProperty("type", type)
            addProperty("expectAnswer", expectAnswer)
            add("request", request)
        }

        synchronized(requestQueue) { requestQueue += packet }
        if (!expectAnswer) return null

        var tries = 0
        while (true) {

            if (id in responseQueue) {
                val rPacket = responseQueue[id]!!
                responseQueue.remove(id)

                if (rPacket["type"].asString == "heartbeat") {
                    tries = 0
                    continue
                }

                if ("response" !in rPacket)
                    throw InvalidObjectException("invalid packet: $rPacket")

                return rPacket["response"].asJsonObject
            }

            if (++tries >= 12)
                throw TimeoutException("no response from packet: $packet")

            Thread.sleep(checkInterval)
        }
    }

    /**
     * check if an addon has established a connection, else throw an error
     */
    fun ping() {
        request(JsonObject(), "ping", true)
    }

    /**
     * @param url
     * @param active (default = true) should the new tab become the current active one
     */
    fun newTab(url: String, active: Boolean = true): Tab {
        val response = request(JsonObject().apply {
            addProperty("url", url)
            addProperty("active", active)
        }, "newTab", true)!!

        return Tab.fromJson(this, response["tab"].asJsonObject)
    }

    /** = getTabs(active=true, currentWindow=true).last() */
    fun getCurrentTab(): Tab {
        return getTabs(TabOptions().apply {
            active = true
            currentWindow = true
        }).last()
    }

    fun getTabs(options: TabOptions? = null): List<Tab> {
        val response = request(JsonObject().apply {
            add("options", (options ?: TabOptions()).toJson())
        }, "getTabs", true)!!

        val list = ArrayList<Tab>()
        val tabs = response["tabs"].asJsonArray
        for (tab in tabs)
            list += Tab.fromJson(this, tab.asJsonObject)
        return list
    }

    fun onTabCreated(block: (Tab) -> Unit) { onTabCreated += block }
    fun onTabUpdated(block: (Tab) -> Unit) { onTabUpdated += block }

}