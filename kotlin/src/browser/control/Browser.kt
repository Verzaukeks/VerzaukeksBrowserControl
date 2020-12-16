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
    var checkInterval: Long = 500 ; private set

    private val gson = Gson()
    private var packetIndex = 1
    private val requestQueue = ArrayList<JsonObject>()
    private val responseQueue = HashMap<Int, JsonObject>()

    private val onTabCreated = ArrayList<(Tab) -> Unit>()
    private val onTabUpdated = ArrayList<(Tab) -> Unit>()

    fun start(port: Int = 58001) {
        if (server != null) return

        server = ServerSocket(port)
        thread = thread(block = ::run)
    }

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

            val socket = try { server!!.accept()  } catch (e: SocketException) { continue }
            val inputStream = socket.getInputStream()
            val outputStream = socket.getOutputStream()

            val headers = HashMap<String,String>()
            val descriptor = readLine(inputStream)
            while (true) {
                val line = readLine(inputStream)
                if (line.isEmpty()) break

                val key = line.substringBefore(": ").toLowerCase()
                val value = line.substringAfter(": ")
                headers[key] = value
            }

            val type = descriptor.substringBefore(" ").toUpperCase()
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

            var response = ""
            response += "HTTP/1.1 200 OK\n"
            response += "Access-Control-Allow-Origin: *\n"
            response += "Access-Control-Allow-Headers: *\n"
            response += "Content-Type: application/json\n"
            response += "Content-Length: ${json.length}\n"
            response += "\n"
            response += json
            outputStream.write(response.encodeToByteArray())
            outputStream.flush()

            inputStream.close()
            outputStream.close()
            socket.close()
        }
    }

    private fun runGet(): JsonObject {
        return JsonObject().apply {
            add("queue", JsonArray().apply {
                synchronized(requestQueue) {
                    requestQueue.forEach(::add)
                    requestQueue.clear()
                }
            })
        }
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

    fun request(request: JsonObject, type: String, expectAnswer: Boolean): JsonObject? {
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

                if (rPacket["type"].asString == "heartbeat") {
                    tries = 0
                    continue
                }

                if ("response" !in rPacket)
                    throw InvalidObjectException("invalid packet: $rPacket")

                responseQueue.remove(id)
                return rPacket["response"].asJsonObject
            }

            if (++tries >= 12)
                throw TimeoutException("no response from packet: $packet")

            Thread.sleep(checkInterval)
        }
    }

    fun newTab(url: String, active: Boolean = true): Tab {
        val response = request(JsonObject().apply {
            addProperty("url", url)
            addProperty("active", active)
        }, "newTab", true)!!

        return Tab.fromJson(this, response["tab"].asJsonObject)
    }

    fun getCurrentTab(): Tab {
        val response = request(JsonObject().apply {
        }, "getCurrentTab", true)!!

        return Tab.fromJson(this, response["tab"].asJsonObject)
    }

    fun getTabs(): List<Tab> {
        val response = request(JsonObject().apply {
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