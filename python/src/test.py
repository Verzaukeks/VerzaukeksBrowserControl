from browser import Browser
from time import sleep

if __name__ == "__main__":

    browser = Browser()
    browser.start()
    browser.ping()

    sleep(20)

    browser.stop()