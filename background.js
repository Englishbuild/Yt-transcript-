// background.js - Service Worker for YouTube Transcript Extractor

// The static InnerTube API key
const INNERTUBE_API_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";

// Helper function to extract YouTube video ID from URL
function getVideoId(url) {
  const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Helper function to format timestamp from milliseconds to MM:SS
function formatTimestamp(msStr) {
  const ms = parseInt(msStr);
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Recursively search for transcript params in the API response
function findTranscriptParams(data) {
  if (typeof data === 'object' && data !== null) {
    if (Array.isArray(data)) {
      for (const item of data) {
        const result = findTranscriptParams(item);
        if (result) return result;
      }
    } else {
      if (data.getTranscriptEndpoint && data.getTranscriptEndpoint.params) {
        return data.getTranscriptEndpoint.params;
      }
      for (const value of Object.values(data)) {
        const result = findTranscriptParams(value);
        if (result) return result;
      }
    }
  }
  return null;
}

// Main transcript extraction function
async function extractTranscript(url) {
  try {
    const videoId = getVideoId(url);
    
    if (!videoId) {
      throw new Error("Could not extract a valid YouTube video ID from the URL.");
    }

    console.log(`Video ID found: ${videoId}`);

    // Step 1: Get the 'params' token from the /next endpoint
    console.log("Step 1: Fetching initial page data to find the transcript token...");
    
    const nextUrl = `https://www.youtube.com/youtubei/v1/next?key=${INNERTUBE_API_KEY}`;
    const nextPayload = {
      context: {
        client: {
          clientName: "WEB",
          clientVersion: "2.20241217.01.00",
          platform: "DESKTOP",
          osName: "Windows",
          osVersion: "10.0"
        }
      },
      videoId: videoId
    };

    const nextResponse = await fetch(nextUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'X-YouTube-Client-Name': '1',
        'X-YouTube-Client-Version': '2.20241217.01.00',
        'Origin': 'https://www.youtube.com',
        'Referer': 'https://www.youtube.com/'
      },
      body: JSON.stringify(nextPayload)
    });

    if (!nextResponse.ok) {
      throw new Error(`HTTP error! status: ${nextResponse.status}`);
    }

    const nextData = await nextResponse.json();
    const paramsToken = findTranscriptParams(nextData);

    if (!paramsToken) {
      throw new Error("Could not find the transcript 'params' token in the initial page data. This video may not have a transcript available via this method.");
    }

    console.log("Success! Found the necessary transcript token.");

    // Step 2: Use the token to call the /get_transcript endpoint
    console.log("Step 2: Calling the 'get_transcript' endpoint with the token...");

    const transcriptUrl = `https://www.youtube.com/youtubei/v1/get_transcript?key=${INNERTUBE_API_KEY}`;
    const transcriptPayload = {
      context: {
        client: {
          clientName: "WEB",
          clientVersion: "2.20241217.01.00",
          platform: "DESKTOP",
          osName: "Windows",
          osVersion: "10.0"
        }
      },
      params: paramsToken
    };

    const transcriptResponse = await fetch(transcriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'X-YouTube-Client-Name': '1',
        'X-YouTube-Client-Version': '2.20241217.01.00',
        'Origin': 'https://www.youtube.com',
        'Referer': 'https://www.youtube.com/'
      },
      body: JSON.stringify(transcriptPayload)
    });

    if (!transcriptResponse.ok) {
      throw new Error(`HTTP error! status: ${transcriptResponse.status}`);
    }

    const transcriptData = await transcriptResponse.json();

    // Parse the transcript data
    const actions = transcriptData.actions || [{}];
    const segments = actions[0]?.updateEngagementPanelAction?.content?.transcriptRenderer?.content?.transcriptSearchPanelRenderer?.body?.transcriptSegmentListRenderer?.initialSegments || [];

    if (!segments || segments.length === 0) {
      throw new Error("API call was successful, but no transcript segments were returned.");
    }

    console.log("Success! Parsed the final transcript data.");

    // Format the transcript
    let transcript = "";
    for (const segment of segments) {
      const renderer = segment.transcriptSegmentRenderer || {};
      const textRuns = renderer.snippet?.runs || [{}];
      const fullText = textRuns.map(run => run.text || "").join("");
      const startMs = renderer.startMs || "0";

      const timestamp = formatTimestamp(startMs);
      const cleanText = fullText.replace(/\n/g, ' ').trim();
      
      if (cleanText) {
        transcript += `${timestamp} - ${cleanText}\n`;
      }
    }

    return {
      success: true,
      transcript: transcript.trim()
    };

  } catch (error) {
    console.error("Error extracting transcript:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractTranscript') {
    extractTranscript(request.url)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({
        success: false,
        error: error.message
      }));
    
    // Return true to indicate we'll send a response asynchronously
    return true;
  }
});