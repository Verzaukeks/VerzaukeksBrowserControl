
class Tab:

    @staticmethod
    def from_json(browser, json):
        id = json['id'] if 'id' in json else -1
        url = json['url'] if 'url' in json else ''
        title = json['title'] if 'title' in json else ''
        status = json['status'] if 'status' in json else ''
        return Tab(browser, id, url, title, status)

    def __init__(self, browser, id, url, title, status):
        self.__browser = browser
        self.id = id
        self.url = url
        self.title = title
        self.status = status

    def update_info(self):
        """
        pull updated information from the addon about this tab, because it will not automatically do so
        (function blocks)
        """
        response = self.__browser.request({
            'tabId': self.id
        }, 'getTabFromId', True)

        tab = response['tab']
        self.url = tab['url']
        self.title = tab['title']
        self.status = tab['status']

    def reload(self, bypass_cache = False):
        """
        (function does not block)
        - bypassCache (default = False)
        """
        self.__browser.request({
            'tabId': self.id,
            'bypassCache': bypass_cache
        }, 'reloadTab', False)

    def remove(self):
        """
        (function does not block)
        """
        self.__browser.request({
            'tabId': self.id
        }, 'removeTab', False)

    def execute_script(self, script, expect_answer = True):
        """
        - script
        - expect_answer (default = True) if set to true, function will block until a response is received,
        if set to false, function will directly return an empty string
        """
        response = self.__browser.request({
            'tabId': self.id,
            'script': script
        }, 'executeScript', expect_answer)

        if not expect_answer: return ''
        return response['result'] if 'result' in response else ''

    def insert_css(self, css):
        self.__browser.request({
            'tabId': self.id,
            'css': css
        }, 'insertCSS', False)

    def click_element(self, selector, wait_till_finished = True):
        """
        - selector document.querySelector($selector)
        - wait_till_finished (default = true) block until browser has actually pressed the button
        """
        return self.execute_script(f'document.querySelector(\'{selector}\').click();', wait_till_finished)

    def input_text(self, selector, value, wait_till_finished = False):
        """
        - selector document.querySelector($selector)
        - value
        - wait_till_finished (default = False) block until browser has actually inserted the value
        """
        return self.execute_script(f'document.querySelector(\'{selector}\').value = \'{value}\';', wait_till_finished)

    def query_selector(self, selector = "html"):
        """
        - selector (default = "html") document.querySelector($selector)
        """
        return self.execute_script('document.querySelector(\'{selector}\').outerHTML;')

    def query_selector_all(self, selector):
        response = self.execute_script('var ret_38764238074687246823 = \'\'; document.querySelectorAll(\'{selector}\').forEach(element => ret_38764238074687246823 += element.outerHTML + \'\\n\'); ret_38764238074687246823;')
        if not response: return []
        return response[:-1].split('\n')


    def __str__(self):
        return f'Tab{{id={self.id}, url=\'{self.url}\', title=\'{self.title}\', status={self.status}}}'