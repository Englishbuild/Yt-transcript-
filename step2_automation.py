# ==============================================================================
# STEP 2: SEND A PROMPT AND COPY THE RESPONSE (With Stabilized Browser)
# ==============================================================================

# Install the necessary libraries and fix dependency conflicts
!pip install -q selenium-wire
!pip install -q blinker==1.4

import json
import time
from seleniumwire import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from IPython.display import display, Image

# The script will use 'my_email' and 'my_password' from Step 1.
if 'my_password' in locals() and my_password:
    print("\n▶️ Step 2: Configuring browser and starting automation...")
    driver = None # Initialize driver for the finally block
    try:
        # --- STABILIZED BROWSER CONFIGURATION ---
        options = Options()
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument('--headless=new')
        
        # --- STABILITY FIXES ---
        # COMMENT: These arguments are added to prevent the browser from crashing on startup in Colab.
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1920,1080")
        options.add_argument("--disable-extensions")
        # --- END OF FIXES ---

        options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)
        options.add_argument("--disable-infobars")
        options.add_argument("--disable-popup-blocking")
        options.add_argument("--start-maximized")
        options.add_argument('--profile-directory=Default')
        options.add_argument('--user-data-dir=/tmp/selenium_chrome_profile')

        wire_options = {
            'scopes': [
                'https://alkalimakersuite-pa.clients6.google.com/.*'
            ]
        }
        driver = webdriver.Chrome(seleniumwire_options=wire_options, options=options)
        driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

        wait = WebDriverWait(driver, 30)
        print("✅ Driver initialized successfully with enhanced stability.")

        # --- LOGIN FLOW (Unchanged) ---
        print("\nNavigating DIRECTLY to Google AI Studio...")
        driver.get("https://aistudio.google.com/")
        wait.until(EC.element_to_be_clickable((By.XPATH, "//span[contains(text(), 'Sign in with Google')] | //span[contains(text(), 'Sign in to Google')]"))).click()
        wait.until(EC.visibility_of_element_located((By.ID, "identifierId"))).send_keys(my_email)
        wait.until(EC.element_to_be_clickable((By.ID, "identifierNext"))).click()
        time.sleep(3)
        wait.until(EC.visibility_of_element_located((By.NAME, "Passwd"))).send_keys(my_password)
        wait.until(EC.element_to_be_clickable((By.ID, "passwordNext"))).click()
        print("✅ Login successful.")

        # --- 2FA & DIALOG HANDLER (Unchanged) ---
        try:
            WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Check your')] | //*[@id='headingText' and contains(., 'Verify it')]")))
            print("\n🚨 2FA SCREEN DETECTED. Taking screenshot...")
            driver.save_screenshot('2fa_number_prompt.png')
            display(Image('2fa_number_prompt.png'))
            print("\nPausing for 40 seconds to allow for approval...")
            time.sleep(40)
            print("✅ Resuming automation...")
        except Exception:
            print("✅ 2FA screen not detected.")
        try:
            closer_element = WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.XPATH, "//button[@aria-label='Close dialog'] | //mat-dialog-actions//button")))
            driver.execute_script("arguments[0].click();", closer_element)
            print("✅ Dismissed welcome dialog.")
        except:
            print("✅ No welcome dialog found. Continuing...")

        # --- SEND PROMPT AND CAPTURE NETWORK RESPONSE (Updated with correct selectors) ---
        my_prompt = "Write me a poem about a curious robot"
        print(f"\nTyping prompt: '{my_prompt}'...")
        
        # Try multiple selectors for the prompt input
        prompt_textarea = None
        selectors_to_try = [
            ".prompt-input-wrapper textarea",
            ".prompt-input-wrapper.mat-mdc-tooltip-trigger textarea",
            "ms-prompt-input-wrapper textarea",
            ".prompt-input-wrapper-container textarea",
            "textarea[placeholder*='prompt']",
            "textarea[placeholder*='Enter']",
            ".chunk-editor-main textarea"
        ]
        
        for selector in selectors_to_try:
            try:
                prompt_textarea = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, selector)))
                print(f"✅ Found prompt input using selector: {selector}")
                break
            except:
                continue
        
        if not prompt_textarea:
            raise Exception("Could not find prompt textarea with any of the provided selectors")
        
        prompt_textarea.clear()
        prompt_textarea.send_keys(my_prompt)

        del driver.requests
        
        # Try multiple selectors for the run button
        run_button = None
        run_selectors_to_try = [
            ".run-button button",
            ".disabled.no-timer.medium.ng-trigger-submit.ng-trigger.ng-tns-c1284504245-12.run-button.mat-mdc-tooltip-trigger",
            "button[class*='run-button']",
            ".ng-tns-c1284504245-12.run-button button",
            "div.button-wrapper:nth-of-type(3) button",
            ".material-icons[class*='mobile-icon']",
            "button[aria-label*='Run']",
            "button[title*='Run']"
        ]
        
        for selector in run_selectors_to_try:
            try:
                run_button = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, selector)))
                print(f"✅ Found run button using selector: {selector}")
                break
            except:
                continue
        
        if not run_button:
            # Try clicking by JavaScript if normal click fails
            try:
                run_button = driver.find_element(By.CSS_SELECTOR, ".run-button, button[class*='run'], [class*='submit']")
                driver.execute_script("arguments[0].click();", run_button)
                print("✅ Clicked run button using JavaScript")
            except:
                raise Exception("Could not find or click run button with any of the provided selectors")
        else:
            run_button.click()
            print("✅ Clicked run button successfully")

        print("✅ Prompt sent. Waiting for 'GenerateContent' API response...")

        request = driver.wait_for_request('/MakerSuiteService/GenerateContent', timeout=90)
        response = request.response

        response_body = response.body.decode('utf-8')
        if response_body.startswith(")]}'"):
            response_body = response_body[4:]
        data = json.loads(response_body)

        response_parts = []
        for chunk in data[0]:
            try:
                text_piece = chunk[0][0][0][0][0][1]
                if text_piece:
                    response_parts.append(text_piece)
            except (IndexError, TypeError):
                continue
        copied_response = "".join(response_parts)

        print("\n\n" + "="*50)
        print("✅✅✅ RESPONSE COPIED SUCCESSFULLY FROM NETWORK ✅✅✅")
        print("="*50 + "\n")
        print(copied_response)
        print("\n" + "="*50)
        driver.save_screenshot('final_response_screenshot.png')
        display(Image('final_response_screenshot.png'))

    except Exception as e:
        print(f"\n❌ An error occurred: {e}")
        if driver:
            error_filename = 'error_screenshot.png'
            driver.save_screenshot(error_filename)
            print(f"A screenshot '{error_filename}' was saved.")
            display(Image(error_filename))
    finally:
        if driver:
            driver.quit()
        print("\nBrowser has been closed.")
else:
    print("🛑 Password was not provided. Please run Step 1 first. Skipping Step 2.")