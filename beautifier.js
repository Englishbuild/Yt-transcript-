// Beautifier functions for different file types
// This script handles the beautification logic

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

function getFileExtension(filename) {
  return filename.split('.').pop().toLowerCase();
}

function shouldBeautifyFile(filename) {
  const extension = getFileExtension(filename);
  return BEAUTIFY_EXTENSIONS.includes(extension);
}

function shouldIgnoreFile(filename) {
  const extension = getFileExtension(filename);
  const isEssentialFile = ['manifest.json', 'package.json'].includes(filename.toLowerCase()) || 
                         filename.toLowerCase().endsWith('manifest.json');
  return IGNORE_EXTENSIONS.includes(extension) && !isEssentialFile;
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
    }
    
    result += char;
    
    if (char === '>') {
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

// Export functions if in module environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    beautifyFileContent,
    shouldBeautifyFile,
    shouldIgnoreFile,
    getFileExtension,
    BEAUTIFY_EXTENSIONS,
    IGNORE_EXTENSIONS
  };
}