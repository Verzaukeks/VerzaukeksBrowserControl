from tab import Tab
import http.server
import socketserver
import _thread
import json

class BrowserRequestHandler(http.server.BaseHTTPRequestHandler):

    __browser = None

    def __init__(self, browser, request, client_address, server):
        super(BrowserRequestHandler, self).__init__(request, client_address, server)
        self.__browser = browser

    def send_response(self, code=200):
        # self.log_request(code)
        self.send_response_only(code)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Content-Type', 'application/json')
        self.end_headers()

    def do_GET(self):
        self.send_response()
        # self.wfile.write(b'{"method":"get"}')
        print(self.__browser)
        # packet = self.__browser.request_queue
        packet = "test"
        packet = {"queue":packet}
        packet = json.dumps(packet)
        packet = packet.encode('utf-8')
        self.wfile.write(packet)

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        content = self.rfile.read(content_length).decode('utf-8')
        self.send_response()
        # self.wfile.write(b'{"method":"post"}')

class Browser:

    __server = None
    check_interval = 500

    __packet_index = 1
    request_queue = []
    __response_queue = {}

    __on_tab_created = []
    __on_tab_updated = []

    def start(self, port=58001):
        """
        opens the connection to receive messages from an addon
        - port (default = 58001)
        """
        if self.__server != None:
            return
        self.__server = socketserver.TCPServer(("", port), lambda a, b, c : BrowserRequestHandler(self, a, b, c))
        _thread.start_new_thread(self.__server.serve_forever, ())

    def stop(self, clear_listeners=False):
        """
        stops the connection to be able to receive messages from an addon
        - clear_listeners (default = False) removes all listeners add by onFunctions
        """
        if self.__server == None:
            return
        self.__server.server_close()
        self.request_queue.clear()
        self.__response_queue.clear()
        if clear_listeners:
            self.__on_tab_created.clear()
            self.__on_tab_updated.clear()
        self.__server = None

    def request(self, request, type, expect_answer):
        """
        manually send a packet to an addon, normally not invoked by you
        - request packet to send
        - type packet type so addon knows what to do
        - expectAnswer if set to true function will block until addon sends a response back
        @exception TimeoutException thrown if 12*checkInterval has passed without a response (only if expectAnswer)
        """
        pass

    def ping(self):
        """
        check if an addon has established a connection, else throw an error
        """
        pass

    def new_tab(self, url, active = True):
        """
        - url
        - active (default = True) should the new tab become the current active one
        """
        pass

    def get_current_tab(self):
        """
        = get_tabs(active=true, current_window=true).last()
        """
        pass

    def get_tabs(self, options):
        pass

    def on_tab_created(self, block):
        pass

    def on_tab_updated(self, block):
        pass