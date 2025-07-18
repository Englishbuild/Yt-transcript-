// content.js - Content script for YouTube pages
// This script runs on YouTube pages and can be used for future enhancements

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

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getCurrentUrl') {
    sendResponse({
      url: getCurrentVideoUrl(),
      videoId: getCurrentVideoId()
    });
  }
});

// Optional: Log when the script loads on a YouTube page
console.log('YouTube Transcript Extractor content script loaded');