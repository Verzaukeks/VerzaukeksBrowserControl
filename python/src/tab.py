
class Tab:

    __browser = None
    id = None
    url = None
    title = None
    status = None

    @staticmethod
    def from_json(browser, json):
        pass

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
        pass

    def reload(self, bypass_cache = False):
        """
        (function does not block)
        - bypassCache (default = False)
        """
        pass

    def remove(self):
        """
        (function does not block)
        """
        pass

    def execute_script(self, script, expect_answer = True):
        """
        - script
        - expect_answer (default = True) if set to true, function will block until a response is received,
        if set to false, function will directly return an empty string
        """
        pass

    def insert_css(self, css):
        pass

    def click_element(self, selector, wait_till_finished = True):
        """
        - selector document.querySelector($selector)
        - wait_till_finished (default = true) block until browser has actually pressed the button
        """
        pass

    def input_text(self, select, value, wait_till_finished = False):
        """
        - selector document.querySelector($selector)
        - value
        - wait_till_finished (default = False) block until browser has actually inserted the value
        """
        pass

    def query_selector(self, selector = "html"):
        """
        - selector (default = "html") document.querySelector($selector)
        """
        pass

    def query_selector_all(self, select):
        pass
