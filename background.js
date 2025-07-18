// background.js - Service Worker for YouTube Transcript Extractor

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractTranscript') {
    // Instead of making API calls, we'll use the content script to extract from the page
    extractTranscriptFromPage(request.url)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({
        success: false,
        error: error.message
      }));
    
    // Return true to indicate we'll send a response asynchronously
    return true;
  }
});

// Helper function to extract YouTube video ID from URL
function getVideoId(url) {
  const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// New approach: Use content script to extract transcript from the page
async function extractTranscriptFromPage(url) {
  try {
    const videoId = getVideoId(url);
    
    if (!videoId) {
      throw new Error("Could not extract a valid YouTube video ID from the URL.");
    }

    // Get the active tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];

    // Check if we're already on the YouTube video page
    if (activeTab.url.includes(videoId)) {
      // We're on the right page, extract transcript directly
      const result = await chrome.tabs.sendMessage(activeTab.id, {
        action: 'extractTranscriptFromDOM'
      });
      return result;
    } else {
      // We need to navigate to the YouTube page first
      return await navigateAndExtract(url, videoId);
    }

  } catch (error) {
    console.error("Error extracting transcript:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Navigate to YouTube page and extract transcript
async function navigateAndExtract(url, videoId) {
  try {
    // Create a new tab or update existing one
    const tab = await chrome.tabs.create({ url: url, active: false });
    
    // Wait for the page to load
    await new Promise((resolve) => {
      const listener = (tabId, changeInfo) => {
        if (tabId === tab.id && changeInfo.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
    });

    // Wait a bit more for YouTube to load fully
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Now extract the transcript
    const result = await chrome.tabs.sendMessage(tab.id, {
      action: 'extractTranscriptFromDOM'
    });

    // Close the tab if it was created for extraction
    await chrome.tabs.remove(tab.id);

    return result;

  } catch (error) {
    throw new Error(`Failed to extract transcript: ${error.message}`);
  }
}