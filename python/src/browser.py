from tab import Tab
import http.server
import socketserver
import _thread
import json
import time

class BrowserRequestHandler(http.server.BaseHTTPRequestHandler):

    def __init__(self, browser, request, client_address, server):
        self.__browser = browser
        super(BrowserRequestHandler, self).__init__(request, client_address, server)

    def send_response(self, code=200):
        # self.log_request(code)
        self.send_response_only(code)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Content-Type', 'application/json')
        self.end_headers()

    def do_GET(self):
        try:
            check_interval = int(self.path[1:])
            self.__browser.check_interval = check_interval
        except: pass

        packet = self.__browser.request_queue
        packet = {'queue': packet}
        packet = json.dumps(packet)
        packet = packet.encode('utf-8')
        self.__browser.request_queue.clear()

        self.send_response()
        self.wfile.write(packet)

    def do_POST(self):
        packet_length = int(self.headers['Content-Length'])
        packet = self.rfile.read(packet_length)
        packet = packet.decode('utf-8')
        packet = json.loads(packet)

        packet = self.__handle(packet)
        packet = json.dumps(packet)
        packet = packet.encode('utf-8')

        self.send_response()
        self.wfile.write(packet)

    def __handle(self, packet):
        if 'id' not in packet or 'type' not in packet: return
        type = packet['type']

        if type == 'onTabCreated':
            tab = packet['response']['tab']
            tab = Tab.from_json(self.__browser, tab)
            for on in self.__browser.on_tab_created:
                on(tab)

        elif type == 'onTabUpdated':
            tab = packet['response']['tab']
            tab = Tab.from_json(self.__browser, tab)
            for on in self.__browser.on_tab_created:
                on(tab)

        else:
            print(packet['id'])
            self.__browser.response_queue[packet['id']] = packet

        return {}
        
        

class Browser:

    def __init__(self):
        self.__server = None
        self.check_interval = 500

        self.__packet_index = 1
        self.request_queue = []
        self.response_queue = {}

        self.on_tab_created = []
        self.on_tab_updated = []

    def start(self, port=58001):
        """
        opens the connection to receive messages from an addon
        - port (default = 58001)
        """
        if self.__server != None: return

        self.__server = socketserver.TCPServer(("", port), lambda a, b, c: BrowserRequestHandler(self, a, b, c))
        _thread.start_new_thread(self.__run, ())

    def __run(self):
        while True:
            try:
                self.__server.handle_request()
            except: pass

    def stop(self, clear_listeners=False):
        """
        stops the connection to be able to receive messages from an addon
        - clear_listeners (default = False) removes all listeners add by onFunctions
        """
        if self.__server == None: return

        self.__server.server_close()
        self.request_queue.clear()
        self.response_queue.clear()

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
        id = self.__packet_index
        self.__packet_index += 1

        packet = {
            'id': id,
            'type': type,
            'expectAnswer': expect_answer,
            'request': request
        }

        self.request_queue.append(packet)
        if not expect_answer: return None

        tries = 0
        while True:

            if id in self.response_queue:
                rpacket = self.response_queue[id]
                self.response_queue.pop(id)

                if rpacket['type'] == 'heartbeat':
                    tries = 0
                    continue

                if 'response' not in rpacket:
                    raise TypeError(f'invalid packet: {rpacket}')

                return rpacket['response']

            tries += 1
            if tries >= 12:
                raise TimeoutError(f'no response from packet: {packet}')

            time.sleep(self.check_interval / 1000.0)

    def ping(self):
        """
        check if an addon has established a connection, else throw an error
        """
        self.request({}, 'ping', True)

    def new_tab(self, url, active = True):
        """
        - url
        - active (default = True) should the new tab become the current active one
        """
        response = self.request({
            'url': url,
            'active': active
        }, 'newTab', True)

        return Tab.from_json(self, response['tab'])

    def get_current_tab(self):
        """
        = get_tabs(active=true, current_window=true).last()
        """
        return self.get_tabs({
            'active': True,
            'currentWindow': True
        })[-1]

    def get_tabs(self, options={}):
        """
        options = {
            'active': Boolean,
            'audible': Boolean,
            'autoDiscardable': Boolean,
            'cookieStoreId': String,
            'currentWindow': Boolean,
            'discarded': Boolean,
            'hidden': Boolean,
            'highlighted': Boolean,
            'index': Int,
            'muted': Boolean,
            'lastFocusedWindow': Boolean,
            'pinned': Boolean,
            'status': String,
            'title': String,
            'url': String|StringArray,
            'windowId': Int,
            'windowType': String(normal|popup|panel|devtools),
        }
        """
        response = self.request({
            'options': options
        }, 'getTabs', True)

        list = []
        tabs = response['tabs']
        for tab in tabs:
            list.append(Tab.from_json(self, tab))
        
        return list