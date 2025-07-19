# ==============================================================================
# STEP 1: INSTALL LIBRARIES & ENTER CREDENTIALS
# ==============================================================================
print("▶️ Step 1: Installing libraries and capturing credentials...")

# Install selenium quietly
!pip install selenium -q

# Import all necessary libraries
import time
from getpass import getpass
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from IPython.display import display, Image

# --- SCRIPT WILL NOW PROMPT YOU FOR CREDENTIALS ---
my_email = input('Enter your Google email: ')
my_password = getpass('Enter your Google password: ')
print("✅ Credentials captured.")