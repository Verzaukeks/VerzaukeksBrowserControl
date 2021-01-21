from browser import Browser
from time import sleep

if __name__ == "__main__":
    browser = Browser()
    browser.start()  # browser.start(port)
    browser.ping()

    tab = browser.new_tab('https://example.com')  # new_tab(url, active)
    current_tab = browser.get_current_tab()
    tabs = browser.get_tabs()  # get_tabs(options)

    browser.on_tab_created.append(lambda it: print(f'New tab was created: {it}'))
    browser.on_tab_updated.append(lambda it: print(f'A tab was updated: {it}'))

    result = tab.execute_script('console.log(\'hello\'); \'result value\';')  # execute_script(script, expect_answer)
    tab.insert_css('* {background: red}')

    tab.click_element('button')  # click_element(selector, wait_till_finished)
    tab.input_text('input', 'custom text here')  # input_text(selector, value, wait_till_finished)

    element = tab.query_selector('h1')
    elements = tab.query_selector_all('div')

    tab.update_info()
    tab.reload()  # tab.reload(bypass_cache)
    tab.remove()

    sleep(1)
    browser.stop()  # stop(clear_listeners)
