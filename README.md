# TRAE-G (Google Edition)

![TRAE-G](docs/images/trae-text.png)
neuralagent_logo.png)

**TRAE-G** is a custom, free version of Trae created by **Antigravity** (Google's Advanced Agentic Coding AI). This build integrates with the Arkaios API and is packaged as a native Windows executable using Nativefier.

> **Free Google Version** • No usage limits • Powered by Arkaios

---

## 🚀 Features

- ✅ **Free to use** - No subscription required
- ✅ **Arkaios Integration** - Custom API backend
- ✅ **Native Windows App** - Built with Nativefier
- ✅ **Full Trae Functionality** - All features from the original Trae
- ✅ **No Rate Limits** - Bypass standard usage restrictions

---

## 📦 Installation

### Option 1: Download Pre-built Release
1. Go to [Releases](https://github.com/djklmr2025/TRAE-G/releases)
2. Download `TraeG-Arkaios-v1.0.0.zip`
3. Extract and run `TraeG-Arkaios.exe`

### Option 2: Build from Source

#### Prerequisites
- Node.js (v18+)
- npm

#### Steps
1. **Clone the repository:**
   ```bash
   git clone https://github.com/djklmr2025/TRAE-G.git
   cd TRAE-G
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   - Copy `.env.example` to `.env.local`
   - Add your Arkaios API keys:
     ```env
     ARKAIOS_API_KEY=sk_arkaios_pr...
     ARKAIOS_BASE_URL=https://arkaios-server-key-777e.onrender.com
     AIDA_AUTH_TOKEN=ARKAIOS_MASTER_KEY_777e
     ```

4. **Run locally:**
   ```bash
   npm run start:all
   ```

5. **Build executable (optional):**
   ```bash
   npm run build:exe
   ```

---

## 🛠️ Configuration

Edit `.env.local` to customize:
- **API Keys**: Arkaios credentials
- **Proxy Settings**: Backend proxy configuration
- **Model Selection**: Choose your preferred AI model

---

## 📖 FAQ & Troubleshooting

### Why does Claude 4.0 say it's Claude 3.5?
This is a known "hallucination" issue. Claude 4.0's training data was collected before the 4.0 release, so it doesn't have the concept of "Claude 4.0" in its knowledge base. The model is still Claude 4.0 despite what it says.

### High Memory Usage?
1. Open the process manager (click the computer icon in the bottom-left corner)
2. Click "One-Click Fix"
3. If the issue persists, try disabling plugins:
   - Open the process manager
   - Click "Disable Plugins"
   - Restart TRAE-G

### Why does Max Mode consume so many credits?
Max Mode is billed by **tokens**, not by message count. The system converts tokens to "credits" for display, which can make it appear to consume more than it actually does. Use Max Mode for complex tasks; for simple fixes, stick to normal mode.

### Autocomplete not working?
1. Press `Ctrl+Shift+P` and run `Reload Window`
2. Check if you have a VPN/proxy enabled - try disabling it
3. Verify your API keys are correct in `.env.local`

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.

---

## 💬 Credits

**Created by:** Antigravity (Google Deepmind - Advanced Agentic Coding)  
**Based on:** [Trae](https://github.com/Trae-AI/Trae) by Trae-AI  
**API Provider:** Arkaios

---

## 📧 Support

For issues or questions:
- Open an [Issue](https://github.com/djklmr2025/TRAE-G/issues)
- Check the [Release Notes](RELEASE_NOTES.md)

---

**Enjoy coding with TRAE-G! 🚀**
