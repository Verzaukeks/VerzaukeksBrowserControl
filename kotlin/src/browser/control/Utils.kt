package browser.control

import com.google.gson.JsonObject
import java.io.InputStream

fun readLine(stream: InputStream): String {
    val buffer = ByteArray(1024)
    var index = 0

    while (index < 1024) {
        val char = stream.read()
        if (char == -1) break    // EOF
        if (char == 10) break    // \n
        if (char == 13) continue // \r

        buffer[index++] = char.toByte()
    }

    return buffer.decodeToString(0, index)
}

operator fun JsonObject.contains(memberName: String) = has(memberName)