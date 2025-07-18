// content.js - Content script for YouTube pages
// This script runs on YouTube pages and extracts transcript data from the DOM

// Function to get current video URL
function getCurrentVideoUrl() {
  return window.location.href;
}

// Function to get video ID from current page
function getCurrentVideoId() {
  const url = getCurrentVideoUrl();
  const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Function to wait for element to appear
function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver((mutations) => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

// Function to click the transcript button and wait for transcript to load
async function openTranscriptPanel() {
  try {
    // Look for the transcript button - YouTube has multiple possible selectors
    const transcriptSelectors = [
      'button[aria-label*="transcript" i]',
      'button[aria-label*="Show transcript" i]',
      'button[title*="transcript" i]',
      'yt-button-renderer[aria-label*="transcript" i]',
      '[role="button"][aria-label*="transcript" i]'
    ];

    let transcriptButton = null;
    for (const selector of transcriptSelectors) {
      transcriptButton = document.querySelector(selector);
      if (transcriptButton) break;
    }

    if (!transcriptButton) {
      // Try to find it in the more actions menu
      const moreButton = document.querySelector('button[aria-label*="More actions" i], button[title*="More actions" i]');
      if (moreButton) {
        moreButton.click();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        for (const selector of transcriptSelectors) {
          transcriptButton = document.querySelector(selector);
          if (transcriptButton) break;
        }
      }
    }

    if (!transcriptButton) {
      throw new Error('Transcript button not found. This video may not have a transcript available.');
    }

    // Click the transcript button
    transcriptButton.click();
    
    // Wait for transcript panel to load
    await new Promise(resolve => setTimeout(resolve, 1000));

    return true;
  } catch (error) {
    throw new Error(`Failed to open transcript panel: ${error.message}`);
  }
}

// Function to extract transcript from the DOM
async function extractTranscriptFromDOM() {
  try {
    // First, try to open the transcript panel
    await openTranscriptPanel();

    // Wait for transcript segments to load
    await waitForElement('[data-params] ytd-transcript-segment-renderer, .ytd-transcript-segment-list-renderer', 5000);

    // Get all transcript segments
    const segments = document.querySelectorAll('[data-params] ytd-transcript-segment-renderer, .ytd-transcript-segment-list-renderer ytd-transcript-segment-renderer');
    
    if (segments.length === 0) {
      throw new Error('No transcript segments found. This video may not have a transcript available.');
    }

    let transcript = '';
    
    segments.forEach(segment => {
      // Extract timestamp
      const timestampElement = segment.querySelector('.ytd-transcript-segment-renderer[role="button"] .segment-timestamp, .ytd-transcript-segment-renderer .segment-timestamp');
      const timestamp = timestampElement ? timestampElement.textContent.trim() : '00:00';
      
      // Extract text content
      const textElement = segment.querySelector('.segment-text, .ytd-transcript-segment-renderer .segment-text');
      const text = textElement ? textElement.textContent.trim() : '';
      
      if (text) {
        transcript += `${timestamp} - ${text}\n`;
      }
    });

    if (!transcript) {
      throw new Error('No transcript text found.');
    }

    return {
      success: true,
      transcript: transcript.trim()
    };

  } catch (error) {
    console.error('Error extracting transcript:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Alternative method: Try to extract from YouTube's internal data
async function extractTranscriptFromYouTubeData() {
  try {
    // Look for YouTube's internal data
    const scripts = document.querySelectorAll('script');
    let ytInitialData = null;
    
    for (const script of scripts) {
      if (script.textContent.includes('ytInitialData')) {
        const match = script.textContent.match(/ytInitialData["']?\s*[:=]\s*({.+?});/);
        if (match) {
          ytInitialData = JSON.parse(match[1]);
          break;
        }
      }
    }

    if (!ytInitialData) {
      throw new Error('YouTube data not found');
    }

    // Search for transcript data in the YouTube data
    const findTranscriptData = (obj) => {
      if (typeof obj !== 'object' || obj === null) return null;
      
      if (Array.isArray(obj)) {
        for (const item of obj) {
          const result = findTranscriptData(item);
          if (result) return result;
        }
      } else {
        for (const [key, value] of Object.entries(obj)) {
          if (key.includes('transcript') || key.includes('caption')) {
            if (value && typeof value === 'object') {
              return value;
            }
          }
          const result = findTranscriptData(value);
          if (result) return result;
        }
      }
      return null;
    };

    const transcriptData = findTranscriptData(ytInitialData);
    
    if (!transcriptData) {
      throw new Error('Transcript data not found in YouTube data');
    }

    // This is a fallback - the actual implementation would need to parse the specific structure
    return {
      success: false,
      error: 'Transcript extraction from YouTube data not yet implemented'
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getCurrentUrl') {
    sendResponse({
      url: getCurrentVideoUrl(),
      videoId: getCurrentVideoId()
    });
  } else if (request.action === 'extractTranscriptFromDOM') {
    extractTranscriptFromDOM()
      .then(result => {
        if (!result.success) {
          // Try alternative method
          return extractTranscriptFromYouTubeData();
        }
        return result;
      })
      .then(result => sendResponse(result))
      .catch(error => sendResponse({
        success: false,
        error: error.message
      }));
    
    // Return true to indicate we'll send a response asynchronously
    return true;
  }
});

// Optional: Log when the script loads on a YouTube page
console.log('YouTube Transcript Extractor content script loaded');