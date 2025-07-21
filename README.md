# CRX Extractor/Downloader with Beautifier

Download Chrome extensions as beautified ZIP files with formatted code or original CRX format.

## ✨ New Features in v2.0.0

### 🎨 Automatic Code Beautification
- **Smart ZIP Downloads**: When you download as ZIP, the extension automatically beautifies all code files
- **Supported File Types**: JavaScript (.js, .jsx, .ts, .tsx), CSS (.css, .scss, .sass), HTML (.html, .htm), JSON (.json), XML (.xml), PHP (.php), Python (.py), and more
- **Binary File Filtering**: Automatically removes binary files (images, fonts, etc.) to reduce download size
- **Folder Structure Preservation**: Maintains the exact folder structure of the original extension

### 🔧 Enhanced Features
- **Beautified Output**: All downloaded ZIP files now contain properly formatted, readable code
- **Reduced File Size**: Binary files are filtered out, making downloads smaller and focused on code
- **Error Handling**: If beautification fails for any file, the original content is preserved
- **Fallback Support**: Automatically falls back to original ZIP conversion if beautification encounters issues

## 📥 How to Use

1. **Visit Chrome Web Store**: Go to any extension page on the Chrome Web Store
2. **Right-click**: Use the context menu or click the extension icon
3. **Choose Format**:
   - **Download Beautified ZIP** ✨: Get formatted, readable code with binary files removed
   - **Download as CRX**: Get the original extension format
4. **Convert Existing CRX**: Upload a .crx file to convert it to a beautified ZIP

## 🎯 What Gets Beautified

### ✅ Code Files (Beautified)
- JavaScript: `.js`, `.jsx`, `.ts`, `.tsx`
- Stylesheets: `.css`, `.scss`, `.sass`, `.less`
- Markup: `.html`, `.htm`, `.vue`
- Data: `.json`, `.xml`
- Server-side: `.php`, `.py`, `.rb`
- Other: `.java`, `.c`, `.cpp`, `.cs`, `.go`, `.rs`, `.kt`

### 🚫 Binary Files (Filtered Out)
- Images: `.png`, `.jpg`, `.svg`, `.gif`, `.ico`
- Fonts: `.woff`, `.woff2`, `.ttf`, `.eot`
- Media: `.mp3`, `.mp4`, `.avi`, `.wav`
- Archives: `.zip`, `.rar`, `.7z`
- Executables: `.exe`, `.dll`, `.so`

## 🔗 Store Links

1. [Chrome Store](https://chrome.google.com/webstore/detail/crx-extractordownloader/ajkhmmldknmfjnmeedkbkkojgobmljda)
2. [Microsoft Edge Store](https://microsoftedge.microsoft.com/addons/detail/crx-extractordownloader/gfgehnhkaggeillajnpegcanbdjcbeja)

## 🛠️ Technical Details

- **Manifest Version**: 3
- **Permissions**: Downloads, Context Menus, Active Tab
- **Beautification Engine**: Custom JavaScript beautifiers for each file type
- **ZIP Processing**: Uses JSZip library for advanced ZIP manipulation
- **Error Recovery**: Graceful fallback to original content if beautification fails

## 📋 Version History

### v2.0.0 (Latest)
- ✨ Added automatic code beautification for ZIP downloads
- 🗂️ Binary file filtering to reduce download size
- 🎨 Enhanced UI with beautification indicators
- 🔧 Improved error handling and fallback mechanisms

### v1.5.9
- Basic CRX to ZIP conversion
- Chrome Web Store and Microsoft Edge support
- Context menu integration