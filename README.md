# Voicemod Stream Dock Plugin (Enhanced)

<!-- Language Selector -->
<div align="center">

**🌍 Language / Lingua:** [**English**](README.md) | [Italiano](README_IT.md)

</div>

---

An enhanced plugin for Stream Dock/Stream Controller that integrates with Voicemod, adding advanced caching functionality and soundboard management.

![Plugin Demo](images/demo.gif)

## ✨ New Features

### 🔄 Persistent Cache System
- **Automatic caching**: Soundboards are automatically saved when Voicemod is online
- **Offline mode**: Uses cached data when Voicemod is unavailable
- **Persistence**: Cache remains valid between sessions until overwritten

### 🎛️ Enhanced User Interface
- **Cache indicator**: Clearly shows when using cached data
- **Refresh button**: Manually refresh soundboards with one click
- **Clear cache button**: Clear cache when needed
- **Persistent audio selection**: Remembers selected specific audio even after restart

### 🧠 Smart Logic
- **Online**: Uses real-time data + automatically updates cache
- **Offline**: Uses cache + shows appropriate warning
- **Fallback**: If no cache available, shows clean interface

![Cache Interface](images/cache-interface.png)

## 📋 Complete Features

| Action | Description | Status |
|--------|-------------|--------|
| **Voice Selection** | Select voice changer sound type | ✅ |
| **Random Voice** | Select a random voice | ✅ |
| **Voice Changer On/Off** | Toggle voice changer on/off | ✅ |
| **Hear My Voice On/Off** | Toggle hearing your own voice | ✅ |
| **Background Effects On/Off** | Toggle background sound effects | ✅ |
| **Mute On/Off** | Toggle mute mode | ✅ |
| **Instant Beep** | Play microphone censor beep sound (only works with older voicemod versions) | ✅ |
| **Push-to-Talk Voice Changer** | Activate voice changer only when pressed | ✅ |
| **Soundboard Play** | Play audio files from soundboards **(Enhanced)** | ✅ |
| **Stop All Sounds** | Stop all playing sounds and memes | ✅ |
| **Mute For Me On/Off** | Toggle "mute for me" mode | ✅ |

## 🚀 Installation

### Method 1: Download Release (Recommended)

1. **Download latest version**
   - Go to [Releases](https://github.com/kaosFWD/Stream-Dock-Voicemod-Enhanced/releases) page
   - Download `vStream Dock Voicemod Enhanced v1.0.2 by kaosFWD.zip` from the latest release

2. **Extract the plugin**
   - Extract the ZIP file contents
   - You should get a folder named `com.hotspot.streamdock.voicemod.sdPlugin` or similar

3. **Install in Stream Controller**
   - Open File Explorer and navigate to `%APPDATA%\Hotspot\StreamDock\Plugins\`
     - On Windows: Press `Win + R`, type `%APPDATA%\Hotspot\StreamDock\Plugins\` and press Enter
   - Copy the entire extracted plugin folder to this directory
   - Final structure should be:
     ```
     %APPDATA%\Stream Controller\Plugins\com.hotspot.streamdock.voicemod.sdPlugin\
     ├── action1/
     ├── action2/
     ├── ...
     ├── plugin/
     ├── static/
     └── manifest.json
     ```

4. **Restart Stream Controller**
   - Completely close Stream Controller
   - Reopen Stream Controller
   - The plugin should appear in the "Voicemod" category

### Method 2: Git Clone (Not yet supported)

1. **Clone the repository**
   ```bash
   git clone https://github.com/kaosFWD/Stream-Dock-Voicemod-Enhanced.git
   ```

2. **Install the plugin**
   - Copy the cloned folder to `%APPDATA%\Hotspot\StreamDock\Plugins\`
   - Restart Stream Controller

### Post-Installation

3. **Configure Voicemod**
   - Make sure Voicemod is installed and running
   - Configure your soundboards in Voicemod
   - Verify that soundboards are enabled (green checkmark in Voicemod)

4. **Verify installation**
   - In Stream Controller, you should see the "Voicemod" category
   - Drag a plugin action to your Stream Dock
   - If status shows "Connected - Running", installation was successful

## 🎮 Usage

### Soundboard Configuration
1. Add a "Soundboard Play" action to your Stream Dock
2. In settings, select the desired soundboard
3. Choose the specific audio to play
4. Settings are saved automatically

![Soundboard Setup](images/soundboard-setup.png)

### Offline Mode
When Voicemod is unavailable:
- Plugin automatically uses cached data
- Cache indicator appears showing cache usage
- Previously configured soundboards remain available

### Cache Management
- **Refresh**: Click "🔄 Refresh Soundboards" to manually update
- **Clear**: Click "🗑️ Clear Cache" to empty the cache
- **Automatic**: Cache updates automatically when Voicemod is online

## 🔧 Requirements

- **Operating System**: Windows 7+ or macOS 10.11+
- **Stream Controller**: Version 2.9 or higher
- **Voicemod**: Any recent version
- **Hardware**: Compatible Stream Dock (Soomfon or similar)

## 📂 Project Structure

```
Stream-Dock-Voicemod-Enhanced/
├── action1-11/          # Folders for each action
│   ├── index.html       # Property Inspector interface
│   └── index.js         # Property Inspector logic
├── plugin/              # Main plugin
│   ├── index.html       # Plugin HTML
│   └── index.js         # Main logic and cache
├── static/              # Static resources
│   ├── css/            # Styles
│   ├── img/            # Icons and images
│   └── *.js            # Shared scripts
├── *.json              # Localization files
└── manifest.json       # Plugin manifest
```

## 🐛 Troubleshooting

### Plugin doesn't appear in Stream Controller
1. **Check installation location**:
   - Verify folder is in `%APPDATA%\Hotspot\StreamDock\Plugins\`
   - Check that `manifest.json` is in the plugin's main folder
2. **Completely restart Stream Controller**
3. **Check logs**: Go to Stream Controller → Settings → Logging
4. **What I did personally**: if still isn't showing, first download the voicemod plugin from the Stream Controller plugin store, then in `%APPDATA%\Hotspot\StreamDock\Plugins\` folder, paste the whole content of the zip file and overwrite, restart Stream Controller.

### Soundboards don't appear
1. Verify Voicemod is running
2. Check that soundboards are enabled in Voicemod (green checkmark)
3. Try "🔄 Refresh Soundboards" button
4. If persists, try "🗑️ Clear Cache" and reload

### Sound doesn't play
1. Check that Voicemod is online (green status indicator)
2. Verify you've selected both soundboard and specific audio
3. Make sure Voicemod volume is not muted
4. Check logs in browser console (F12 in Stream Controller)

### Cache not working
1. Make sure you've configured soundboards at least once with Voicemod online
2. Verify plugin has write permissions for configuration files
3. Try clearing and recreating cache with the dedicated button

### Connection error
1. **Verify Voicemod is running**
2. **Check WebSocket port**: Voicemod uses port `59129`
   - Make sure it's not blocked by firewall
3. **Restart Voicemod** if necessary

## 🔄 Updates and Improvements

### Current Version (1.0.2+)
- ✅ Persistent cache system
- ✅ Enhanced user interface
- ✅ Persistent audio selection
- ✅ Robust error handling
- ✅ Detailed logging for debugging


## 🤝 Contributing

Contributions are welcome! To contribute:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

## 📜 License

This project is distributed under the MIT License. See `LICENSE` for more information.

## 🙏 Credits

- **Original Author**: HotSpot - Base Voicemod Stream Dock Plugin
- **Enhancements and Cache System**: [kaosFWD] - Persistent cache system and enhanced interface
- **Voicemod**: For the excellent voice modification software


---

**⭐ If this plugin is useful to you, leave a star on GitHub!**