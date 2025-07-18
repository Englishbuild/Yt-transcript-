// popup.js
document.addEventListener('DOMContentLoaded', function() {
  const urlInput = document.getElementById('youtube-url');
  const extractBtn = document.getElementById('extract-btn');
  const currentTabBtn = document.getElementById('current-tab-btn');
  const status = document.getElementById('status');
  const transcriptOutput = document.getElementById('transcript-output');

  // Show status message
  function showStatus(message, type) {
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';
  }

  // Hide status message
  function hideStatus() {
    status.style.display = 'none';
  }

  // Show transcript output
  function showTranscript(transcript) {
    transcriptOutput.textContent = transcript;
    transcriptOutput.style.display = 'block';
  }

  // Hide transcript output
  function hideTranscript() {
    transcriptOutput.style.display = 'none';
  }

  // Extract transcript from URL
  async function extractTranscript(url) {
    try {
      hideTranscript();
      showStatus('Extracting transcript...', 'loading');
      extractBtn.disabled = true;
      currentTabBtn.disabled = true;

      const result = await chrome.runtime.sendMessage({
        action: 'extractTranscript',
        url: url
      });

      if (result.success) {
        showStatus('✅ Transcript extracted successfully!', 'success');
        showTranscript(result.transcript);
      } else {
        showStatus(`❌ Error: ${result.error}`, 'error');
      }
    } catch (error) {
      showStatus(`❌ Error: ${error.message}`, 'error');
    } finally {
      extractBtn.disabled = false;
      currentTabBtn.disabled = false;
    }
  }

  // Extract button click handler
  extractBtn.addEventListener('click', function() {
    const url = urlInput.value.trim();
    if (!url) {
      showStatus('Please enter a YouTube URL', 'error');
      return;
    }
    extractTranscript(url);
  });

  // Current tab button click handler
  currentTabBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentUrl = tabs[0].url;
      if (currentUrl.includes('youtube.com') || currentUrl.includes('youtu.be')) {
        urlInput.value = currentUrl;
        extractTranscript(currentUrl);
      } else {
        showStatus('Current tab is not a YouTube page', 'error');
      }
    });
  });

  // Enter key handler for URL input
  urlInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      extractBtn.click();
    }
  });
});