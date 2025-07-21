# CRX Extractor/Downloader

Download Chrome extensions as CRX or ZIP files directly from the Chrome Web Store.

## 📥 Features

### 🔧 Core Functionality
- **Download CRX Files**: Get the original extension package format
- **Download ZIP Files**: Extract and download as standard ZIP archives
- **Chrome Web Store Support**: Works with both old and new Chrome Web Store URLs
- **Microsoft Edge Support**: Download CRX files from Microsoft Edge Add-ons store
- **Convert CRX to ZIP**: Upload existing CRX files and convert them to ZIP format

### 🎯 How to Use

1. **Visit Extension Page**: Go to any extension page on the Chrome Web Store or Microsoft Edge Add-ons
2. **Right-click Context Menu**: Right-click on the page and select download option
3. **Extension Popup**: Click the extension icon to open the popup interface
4. **Choose Format**:
   - **Download as ZIP**: Get the extension as a ZIP archive
   - **Download as CRX**: Get the original extension format
5. **Convert Existing Files**: Upload a .crx file to convert it to ZIP format

### 🛠️ Technical Details

- **Manifest Version**: 3
- **Permissions**: Downloads, Context Menus, Active Tab
- **Compatible**: Chrome Web Store (old and new URLs) and Microsoft Edge Add-ons
- **File Processing**: Extracts ZIP content from CRX packages
- **Error Handling**: Graceful fallback for invalid filenames

## 🔗 Store Links

1. [Chrome Store](https://chrome.google.com/webstore/detail/crx-extractordownloader/ajkhmmldknmfjnmeedkbkkojgobmljda)
2. [Microsoft Edge Store](https://microsoftedge.microsoft.com/addons/detail/crx-extractordownloader/gfgehnhkaggeillajnpegcanbdjcbeja)

## 📋 Version History

### v1.6.0 (Current)
- ✅ Working Chrome Web Store integration
- ✅ Microsoft Edge Add-ons support
- ✅ CRX to ZIP conversion
- ✅ Context menu integration
- ✅ Popup interface
- ✅ Error handling and validation

### v1.5.9 (Previous)
- Basic CRX to ZIP conversion
- Chrome Web Store support
- Context menu integration

## 🚀 Future Plans

- **Code Beautification**: Automatic formatting of downloaded code files
- **Binary File Filtering**: Option to exclude images and other binary files
- **Folder Structure Analysis**: Visual representation of extension structure
- **Enhanced UI**: Improved user interface with progress indicators

## 🛠️ Development

This extension is built with:
- **Manifest V3** for modern Chrome extension standards
- **Service Worker** background script for efficient processing
- **Native APIs** for downloads and context menus
- **Cross-browser compatibility** for Chrome and Edge

## 📝 Notes

- **Loading Issues**: If the extension doesn't load, ensure all files are present and manifest.json is valid
- **Download Problems**: Check that download permissions are granted
- **Compatibility**: Works with both old (`chrome.google.com/webstore`) and new (`chromewebstore.google.com`) URLs