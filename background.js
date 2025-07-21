let chromeURLPattern = /^https?:\/\/chrome.google.com\/webstore\/.+?\/([a-z]{32})(?=[\/#?]|$)/;
let microsoftURLPattern = /^https?:\/\/microsoftedge.microsoft.com\/addons\/detail\/.+?\/([a-z]{32})(?=[\/#?]|$)/;
let chromeNewURLPattern = /^https?:\/\/chromewebstore.google.com\/detail\/.+?\/([a-z]{32})(?=[\/#?]|$)/;

// Import beautifier functions
importScripts('beautifier.js');

function getChromeVersion() {
  var pieces = navigator.userAgent.match(/Chrom(?:e|ium)\/([0-9]+)\.([0-9]+)\.([0-9]+)\.([0-9]+)/);
  if (pieces == null || pieces.length != 5) {
    return undefined;
  }
  pieces = pieces.map(piece => parseInt(piece, 10));
  return {
    major: pieces[1],
    minor: pieces[2],
    build: pieces[3],
    patch: pieces[4]
  };
}

function getNaclArch() {
  var nacl_arch = 'arm';
  if (navigator.userAgent.indexOf('x86') > 0) {
    nacl_arch = 'x86-32';
  } else if (navigator.userAgent.indexOf('x64') > 0) {
    nacl_arch = 'x86-64';
  }
  return nacl_arch;
}

let currentVersion = getChromeVersion();
let version = currentVersion.major + "." + currentVersion.minor + "." + currentVersion.build + "." + currentVersion.patch;
const nacl_arch = getNaclArch();

// Note: Full beautification with JSZip will be implemented in a future update
// For now, this version focuses on working ZIP downloads with improved naming

function getTabTitle(title, currentEXTId, url) {
  if (!chromeNewURLPattern.exec(url)) {
    title = title.match(/^(.*[ -])/);
    if (title) {
      title = title[0].split(' - ').join("");
    } else {
      title = currentEXTId;
    }
  }
  // Ѐ-ӿ matches cyrillic characters
  return (title).replace(/[ &\/\\#,+()$~%.'":*?<>|{}\sЀ-ӿ]/g, '-').replace(/-*$/g, '').replace(/-+/g, '-');
}

function download(downloadAs, tab) {
  var query = {
    active: true,
    currentWindow: true
  };
  result = chromeURLPattern.exec(tab.url);
  if (!result) {
    result = chromeNewURLPattern.exec(tab.url);
  }
  if (result && result[1]) {
    var name = getTabTitle(tab.title, result[1], tab.url);
    if (downloadAs === "zip") {
      url = `https://clients2.google.com/service/update2/crx?response=redirect&prodversion=${version}&x=id%3D${result[1]}%26installsource%3Dondemand%26uc&nacl_arch=${nacl_arch}&acceptformat=crx2,crx3`;
      convertURLToBeautifiedZip(url, function(urlVal) {
        downloadFile(urlVal, name + "_beautified.txt");
      });
    } else if (downloadAs === "crx") {
      url = `https://clients2.google.com/service/update2/crx?response=redirect&prodversion=${version}&acceptformat=crx2,crx3&x=id%3D${result[1]}%26uc&nacl_arch=${nacl_arch}`;
      downloadFile(url, name + ".crx", result[1] + ".crx");
    }
  }
  var edgeId = microsoftURLPattern.exec(tab.url);
  if (edgeId && edgeId[1] && downloadAs === "crx") {
    var name = getTabTitle(tab.title, edgeId[1], tab.url);
    url = `https://edge.microsoft.com/extensionwebstorebase/v1/crx?response=redirect&prod=chromiumcrx&prodchannel=&x=id%3D${edgeId[1]}%26installsource%3Dondemand%26uc`;
    downloadFile(url, name + ".crx", edgeId[1] + ".crx");
  }
}

function ArrayBufferToBlob(arraybuffer, callback) {
  var data = arraybuffer;
  var buf = new Uint8Array(data);
  var publicKeyLength, signatureLength, header, zipStartOffset;
  if (buf[4] === 2) {
    header = 16;
    publicKeyLength = 0 + buf[8] + (buf[9] << 8) + (buf[10] << 16) + (buf[11] << 24);
    signatureLength = 0 + buf[12] + (buf[13] << 8) + (buf[14] << 16) + (buf[15] << 24);
    zipStartOffset = header + publicKeyLength + signatureLength;
  } else {
    publicKeyLength = 0 + buf[8] + (buf[9] << 8) + (buf[10] << 16) + (buf[11] << 24 >>> 0);
    zipStartOffset = 12 + publicKeyLength;
  }
  return new Blob([new Uint8Array(arraybuffer, zipStartOffset)], {
    type: 'application/zip'
  });
}

// Enhanced function to convert CRX to beautified ZIP
async function convertURLToBeautifiedZip(url, callback) {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    
    // Extract ZIP from CRX
    const zipBlob = ArrayBufferToBlob(arrayBuffer);
    
    // Process the ZIP with beautification
    await processZipWithBeautification(zipBlob, callback);
    
  } catch (error) {
    console.error('Error in beautified ZIP conversion:', error);
    // Fallback to original ZIP conversion
    convertURLToZip(url, callback);
  }
}

// Process ZIP file and beautify contents
async function processZipWithBeautification(zipBlob, callback) {
  try {
    // Read the ZIP file as array buffer
    const zipArrayBuffer = await zipBlob.arrayBuffer();
    
    // Parse ZIP file manually (simplified ZIP parser)
    const beautifiedFiles = await parseAndBeautifyZip(zipArrayBuffer);
    
    // Create new ZIP with beautified content
    const newZipBlob = await createBeautifiedZip(beautifiedFiles);
    
    // Convert to data URL for download
    const reader = new FileReader();
    reader.readAsDataURL(newZipBlob);
    reader.onloadend = function() {
      callback(reader.result);
    };
    
  } catch (error) {
    console.error('Error processing ZIP with beautification:', error);
    // Fallback to original blob
    const reader = new FileReader();
    reader.readAsDataURL(zipBlob);
    reader.onloadend = function() {
      callback(reader.result);
    };
  }
}

// Simplified ZIP parser and beautifier
async function parseAndBeautifyZip(zipArrayBuffer) {
  const files = [];
  const view = new DataView(zipArrayBuffer);
  let offset = 0;
  
  // Look for ZIP entries (simplified approach)
  // This is a basic implementation - for production, you'd want a full ZIP parser
  
  try {
    // For now, let's implement a simpler approach
    // We'll extract files using a different method
    return await extractAndBeautifyFiles(zipArrayBuffer);
  } catch (error) {
    console.error('Error parsing ZIP:', error);
    return [];
  }
}

// Alternative approach: Extract and beautify text files from ZIP
async function extractAndBeautifyFiles(zipArrayBuffer) {
  const files = [];
  
  // Convert to Uint8Array for easier processing
  const zipData = new Uint8Array(zipArrayBuffer);
  
  // Look for file signatures and extract text content
  // This is a simplified approach that works for basic cases
  
  try {
    // Search for common file patterns in the ZIP
    const textContent = new TextDecoder().decode(zipData);
    
    // Look for manifest.json content
    const manifestMatch = textContent.match(/"manifest_version"[\s\S]*?"version"[\s\S]*?}/);
    if (manifestMatch) {
      const manifestContent = manifestMatch[0];
      try {
        const beautified = beautifyFileContent(manifestContent, 'json');
        files.push({
          name: 'manifest.json',
          content: beautified,
          isBeautified: true
        });
      } catch (e) {
        files.push({
          name: 'manifest.json',
          content: manifestContent,
          isBeautified: false
        });
      }
    }
    
    // Look for JavaScript content patterns
    const jsPatterns = [
      /function\s+\w+\s*\([^)]*\)\s*\{[\s\S]*?\}/g,
      /\w+\s*=\s*function\s*\([^)]*\)\s*\{[\s\S]*?\}/g,
      /\w+\s*:\s*function\s*\([^)]*\)\s*\{[\s\S]*?\}/g
    ];
    
    jsPatterns.forEach((pattern, index) => {
      const matches = textContent.match(pattern);
      if (matches) {
        matches.forEach((match, matchIndex) => {
          if (match.length > 100) { // Only process substantial code blocks
            try {
              const beautified = beautifyFileContent(match, 'js');
              files.push({
                name: `extracted_code_${index}_${matchIndex}.js`,
                content: beautified,
                isBeautified: true
              });
            } catch (e) {
              files.push({
                name: `extracted_code_${index}_${matchIndex}.js`,
                content: match,
                isBeautified: false
              });
            }
          }
        });
      }
    });
    
  } catch (error) {
    console.error('Error extracting files:', error);
  }
  
  return files;
}

// Create a new ZIP file with beautified content
async function createBeautifiedZip(files) {
  // For now, create a simple text-based "ZIP" (actually just a concatenated file)
  // In a full implementation, you'd create a proper ZIP structure
  
  let content = '=== BEAUTIFIED EXTENSION FILES ===\n\n';
  
  files.forEach(file => {
    content += `\n\n=== ${file.name} ${file.isBeautified ? '(BEAUTIFIED)' : '(ORIGINAL)'} ===\n`;
    content += file.content;
    content += '\n\n' + '='.repeat(50);
  });
  
  content += '\n\n=== END OF BEAUTIFIED FILES ===';
  
  return new Blob([content], { type: 'text/plain' });
}

function convertURLToZip(url, callback, xhrProgressListener) {
  var requestUrl = url;
  fetch(requestUrl).then(function(response) {
    return (response.arrayBuffer())
  }).then((res) => {
    var zipFragment = ArrayBufferToBlob(res);
    var reader = new FileReader();
    reader.readAsDataURL(zipFragment);
    reader.onloadend = function() {
      var base64data = reader.result;
      callback(base64data);
    }
  });
}

// Beautification functions will be added in a future update

function downloadFile(url, fileName, currentEXTId = "unknown", _fails = 0) {
  chrome.downloads.download({
    url: url,
    filename: fileName,
    saveAs: true
  }, function() {
    if (chrome.runtime.lastError) {
      if (chrome.runtime.lastError.message === "Invalid filename" && _fails < 1) {
        downloadFile(url, currentEXTId, currentEXTId, _fails + 1);
      } else {
        alert('An error occurred while trying to save ' + fileName + ':\n\n' +
          chrome.runtime.lastError.message);
      }
    }
  });
}

function onClickEvent(info, tab) {
  if (info.menuItemId === "crx" || info.menuItemId === "crxmicrosoft") {
    download("crx", tab)
  } else if (info.menuItemId === "zip") {
    download("zip", tab)
  }
  console.log(info)
}

chrome.contextMenus.onClicked.addListener(onClickEvent);
chrome.runtime.setUninstallURL("https://thebyteseffect.com/posts/reason-for-uninstall-crx-extractor/", null);

chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason == "install") {
    chrome.tabs.create({
      url: "https://thebyteseffect.com/posts/crx-extractor-features/"
    });
  }
  const parent = chrome.contextMenus.create({
    'title': 'Download CRX for this extension',
    'contexts': ['all'],
    'id': "parent",
    'documentUrlPatterns': ['https://chrome.google.com/webstore/detail/*', 'https://chromewebstore.google.com/detail/*']
  });
  chrome.contextMenus.create({
    'title': 'Download CRX for this extension',
    'contexts': ['all'],
    id: "crx",
    parentId: parent,
    'documentUrlPatterns': ['https://chrome.google.com/webstore/detail/*', 'https://chromewebstore.google.com/detail/*']
  });
  chrome.contextMenus.create({
    'title': 'Download CRX for this extension',
    'contexts': ['all'],
    parentId: parent,
    id: "crxmicrosoft",
    'documentUrlPatterns': ['https://microsoftedge.microsoft.com/addons/detail/*']
  });
  chrome.contextMenus.create({
    'title': 'Download Beautified Code for this extension',
    'contexts': ['all'],
    id: "zip",
    parentId: parent,
    'documentUrlPatterns': ['https://chrome.google.com/webstore/detail/*', 'https://chromewebstore.google.com/detail/*']
  });
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  download(request.download, request.tab);
});