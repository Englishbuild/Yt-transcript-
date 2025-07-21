let chromeURLPattern = /^https?:\/\/chrome.google.com\/webstore\/.+?\/([a-z]{32})(?=[\/#?]|$)/;
let microsoftURLPattern = /^https?:\/\/microsoftedge.microsoft.com\/addons\/detail\/.+?\/([a-z]{32})(?=[\/#?]|$)/;
let chromeNewURLPattern = /^https?:\/\/chromewebstore.google.com\/detail\/.+?\/([a-z]{32})(?=[\/#?]|$)/;

// File extensions to beautify
const BEAUTIFY_EXTENSIONS = [
  'js', 'jsx', 'ts', 'tsx', 'css', 'scss', 'sass', 'less',
  'html', 'htm', 'vue', 'json', 'xml', 'php', 'py', 'rb',
  'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'go', 'rs', 'kt'
];

// File extensions to ignore (binary files, images, etc.)
const IGNORE_EXTENSIONS = [
  'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'bmp', 'webp',
  'woff', 'woff2', 'ttf', 'eot', 'otf',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'zip', 'rar', '7z', 'tar', 'gz',
  'exe', 'dll', 'so', 'dylib',
  'mp3', 'mp4', 'avi', 'mov', 'wav', 'flac',
  'bin', 'dat', 'db', 'sqlite'
];

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
        downloadFile(urlVal, name + "_beautified.zip");
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
    // Import JSZip dynamically
    const JSZip = await import('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
    
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    
    // Extract ZIP from CRX
    const zipBlob = ArrayBufferToBlob(arrayBuffer);
    const zipArrayBuffer = await zipBlob.arrayBuffer();
    
    // Load original ZIP
    const originalZip = await JSZip.default.loadAsync(zipArrayBuffer);
    const beautifiedZip = new JSZip.default();
    
    // Process each file in the ZIP
    const entries = Object.keys(originalZip.files);
    
    for (const relativePath of entries) {
      const file = originalZip.files[relativePath];
      
      if (file.dir) {
        // Add directory to new ZIP
        beautifiedZip.folder(relativePath);
      } else {
        const extension = getFileExtension(relativePath);
        const shouldBeautify = BEAUTIFY_EXTENSIONS.includes(extension);
        const shouldIgnore = IGNORE_EXTENSIONS.includes(extension);
        
        if (shouldIgnore) {
          // Skip ignored files (binary files, images, etc.)
          continue;
        } else if (shouldBeautify) {
          // Beautify the file
          try {
            const content = await file.async('string');
            const beautifiedContent = beautifyFileContent(content, extension);
            beautifiedZip.file(relativePath, beautifiedContent);
          } catch (error) {
            console.warn(`Error beautifying ${relativePath}:`, error);
            // If beautification fails, add original content
            const content = await file.async('string');
            beautifiedZip.file(relativePath, content);
          }
        } else {
          // Copy other text files as-is
          const content = await file.async('string');
          beautifiedZip.file(relativePath, content);
        }
      }
    }
    
    // Generate the beautified ZIP
    const beautifiedBlob = await beautifiedZip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });
    
    // Convert to data URL for download
    const reader = new FileReader();
    reader.readAsDataURL(beautifiedBlob);
    reader.onloadend = function() {
      callback(reader.result);
    };
    
  } catch (error) {
    console.error('Error beautifying ZIP:', error);
    // Fallback to original ZIP conversion
    convertURLToZip(url, callback);
  }
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

// Helper functions for beautification
function getFileExtension(filename) {
  return filename.split('.').pop().toLowerCase();
}

function beautifyFileContent(content, extension) {
  try {
    switch (extension) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return beautifyJavaScript(content);
      case 'css':
      case 'scss':
      case 'sass':
      case 'less':
        return beautifyCSS(content);
      case 'html':
      case 'htm':
      case 'vue':
        return beautifyHTML(content);
      case 'json':
        return beautifyJSON(content);
      case 'xml':
        return beautifyXML(content);
      case 'php':
        return beautifyPHP(content);
      case 'py':
        return beautifyPython(content);
      default:
        return content; // Return as-is for unsupported types
    }
  } catch (error) {
    console.warn(`Error beautifying ${extension} file:`, error);
    return content; // Return original content if beautification fails
  }
}

function beautifyJavaScript(code) {
  // Enhanced JavaScript beautifier
  let result = '';
  let indentLevel = 0;
  let inString = false;
  let stringChar = '';
  let inComment = false;
  let inMultiComment = false;
  
  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const nextChar = code[i + 1];
    const prevChar = code[i - 1];
    
    // Handle comments
    if (!inString && char === '/' && nextChar === '/') {
      inComment = true;
    }
    if (!inString && char === '/' && nextChar === '*') {
      inMultiComment = true;
    }
    if (inMultiComment && char === '*' && nextChar === '/') {
      inMultiComment = false;
      result += char;
      continue;
    }
    if (inComment && char === '\n') {
      inComment = false;
    }
    
    // Handle strings and template literals
    if (!inComment && !inMultiComment && (char === '"' || char === "'" || char === '`')) {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar && prevChar !== '\\') {
        inString = false;
        stringChar = '';
      }
    }
    
    if (!inString && !inComment && !inMultiComment) {
      if (char === '{' || char === '[') {
        result += char + '\n' + '  '.repeat(++indentLevel);
        continue;
      }
      if (char === '}' || char === ']') {
        result += '\n' + '  '.repeat(--indentLevel) + char;
        if (nextChar && nextChar !== ',' && nextChar !== ';' && nextChar !== '}' && nextChar !== ']') {
          result += '\n' + '  '.repeat(indentLevel);
        }
        continue;
      }
      if (char === ';') {
        result += char + '\n' + '  '.repeat(indentLevel);
        continue;
      }
      if (char === ',' && indentLevel > 0) {
        result += char + '\n' + '  '.repeat(indentLevel);
        continue;
      }
    }
    
    result += char;
  }
  
  return result.replace(/\n\s*\n/g, '\n').trim();
}

function beautifyCSS(css) {
  let result = '';
  let indentLevel = 0;
  let inRule = false;
  
  css = css.replace(/\s+/g, ' ').trim();
  
  for (let i = 0; i < css.length; i++) {
    const char = css[i];
    const nextChar = css[i + 1];
    
    if (char === '{') {
      inRule = true;
      result += ' {\n';
      indentLevel++;
      continue;
    }
    
    if (char === '}') {
      inRule = false;
      indentLevel--;
      result += '\n' + '  '.repeat(indentLevel) + '}\n\n';
      continue;
    }
    
    if (char === ';' && inRule) {
      result += ';\n' + '  '.repeat(indentLevel);
      continue;
    }
    
    if (char === ',' && !inRule) {
      result += ',\n' + '  '.repeat(indentLevel);
      continue;
    }
    
    result += char;
  }
  
  return result.replace(/\n\s*\n\s*\n/g, '\n\n').trim();
}

function beautifyHTML(html) {
  const voidElements = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
  let result = '';
  let indentLevel = 0;
  let inTag = false;
  let tagName = '';
  
  html = html.replace(/>\s*</g, '><');
  
  for (let i = 0; i < html.length; i++) {
    const char = html[i];
    
    if (char === '<') {
      if (html[i + 1] === '/') {
        // Closing tag
        indentLevel--;
        result += '\n' + '  '.repeat(indentLevel);
      } else {
        // Opening tag
        const tagMatch = html.substring(i).match(/^<([a-zA-Z][a-zA-Z0-9]*)/);
        if (tagMatch) {
          tagName = tagMatch[1].toLowerCase();
          if (i > 0) result += '\n' + '  '.repeat(indentLevel);
          if (!voidElements.includes(tagName) && !html.substring(i).startsWith('<!')) {
            indentLevel++;
          }
        }
      }
      inTag = true;
    }
    
    result += char;
    
    if (char === '>') {
      inTag = false;
      if (voidElements.includes(tagName)) {
        indentLevel--;
      }
    }
  }
  
  return result.trim();
}

function beautifyJSON(json) {
  const parsed = JSON.parse(json);
  return JSON.stringify(parsed, null, 2);
}

function beautifyXML(xml) {
  const PADDING = '  ';
  const reg = /(>)(<)(\/*)/g;
  let formatted = xml.replace(reg, '$1\r\n$2$3');
  let pad = 0;
  
  return formatted.split('\r\n').map(line => {
    let indent = 0;
    if (line.match(/.+<\/\w[^>]*>$/)) {
      indent = 0;
    } else if (line.match(/^<\/\w/) && pad > 0) {
      pad -= 1;
    } else if (line.match(/^<\w[^>]*[^\/]>.*$/)) {
      indent = 1;
    } else {
      indent = 0;
    }
    
    const padding = PADDING.repeat(pad);
    pad += indent;
    
    return padding + line;
  }).join('\n');
}

function beautifyPHP(php) {
  // Basic PHP beautifier
  let result = '';
  let indentLevel = 0;
  
  const lines = php.split('\n');
  
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    // Decrease indent for closing braces
    if (line.startsWith('}')) {
      indentLevel = Math.max(0, indentLevel - 1);
    }
    
    result += '  '.repeat(indentLevel) + line + '\n';
    
    // Increase indent for opening braces
    if (line.endsWith('{')) {
      indentLevel++;
    }
  }
  
  return result.trim();
}

function beautifyPython(python) {
  // Basic Python beautifier (mainly fixing indentation)
  const lines = python.split('\n');
  let result = '';
  let indentLevel = 0;
  
  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      result += '\n';
      continue;
    }
    
    // Decrease indent for dedent keywords
    if (trimmed.startsWith('except') || trimmed.startsWith('elif') || 
        trimmed.startsWith('else') || trimmed.startsWith('finally')) {
      indentLevel = Math.max(0, indentLevel - 1);
      result += '  '.repeat(indentLevel) + trimmed + '\n';
      indentLevel++;
    } else {
      result += '  '.repeat(indentLevel) + trimmed + '\n';
      
      // Increase indent after colon
      if (trimmed.endsWith(':')) {
        indentLevel++;
      }
    }
  }
  
  return result.trim();
}

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
    'title': 'Download Beautified ZIP for this extension',
    'contexts': ['all'],
    id: "zip",
    parentId: parent,
    'documentUrlPatterns': ['https://chrome.google.com/webstore/detail/*', 'https://chromewebstore.google.com/detail/*']
  });
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  download(request.download, request.tab);
});