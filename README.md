# 🎙️ AI Voice Journal — `cf_ai_voice_journal`

An AI-powered daily journaling application built on Cloudflare. Speak or type your thoughts, and the AI summarizes entries, tracks mood over time, and provides weekly reflections.

![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange)
![Workers AI](https://img.shields.io/badge/Workers-AI-blue)
![Durable Objects](https://img.shields.io/badge/Durable-Objects-green)

## ✨ Features

- **Voice Input**: Speak your journal entries using browser speech recognition
- **Text Input**: Type entries if you prefer
- **AI Summarization**: Each entry is summarized and analyzed by Llama 3.3
- **Mood Tracking**: Automatic sentiment analysis tracks your emotional patterns
- **Weekly Reflections**: AI-generated weekly digests highlight themes and growth
- **Persistent Memory**: All entries stored securely using Durable Objects
- **Beautiful UI**: Clean, calming interface for daily reflection

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Pages UI      │────▶│  Worker API     │────▶│  Workers AI     │
│  (Voice/Chat)   │     │  (Hono Router)  │     │  (Llama 3.3)    │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │ Durable Object  │
                        │ (Journal State) │
                        └─────────────────┘
```

### Components

| Component | Technology | Purpose |
|-----------|------------|---------|
| **LLM** | Workers AI (Llama 3.3) | Summarization, sentiment analysis, reflections |
| **Coordination** | Cloudflare Workers + Hono | API routing and orchestration |
| **State** | Durable Objects | Persistent journal entries and mood data |
| **Interface** | Cloudflare Pages | Voice/text chat interface |

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Cloudflare account](https://dash.cloudflare.com/sign-up)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/cf_ai_voice_journal.git
   cd cf_ai_voice_journal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Login to Cloudflare**
   ```bash
   npx wrangler login
   ```

4. **Deploy the Worker**
   ```bash
   npm run deploy
   ```

5. **Deploy the Frontend**
   ```bash
   npm run deploy:pages
   ```

### Local Development

1. **Run the Worker locally**
   ```bash
   npm run dev
   ```

2. **In another terminal, serve the frontend**
   ```bash
   npm run dev:pages
   ```

3. **Open** `http://localhost:8788` in your browser

## 📖 Usage

### Daily Journaling

1. **Open the app** in your browser
2. **Click the microphone** 🎤 to speak, or type in the text box
3. **Submit your entry** — the AI will:
   - Summarize your thoughts
   - Analyze your mood (1-10 scale)
   - Extract key themes
4. **View your history** in the entries panel

### Voice Commands

The app uses the Web Speech API for voice input:
- Click the microphone to start recording
- Speak naturally about your day
- Click again to stop and submit

### Weekly Reflections

Click **"Generate Weekly Reflection"** to get an AI-powered summary of your week, including:
- Overall mood trends
- Recurring themes
- Personalized insights
- Growth observations

## 🔧 Configuration

### Environment Variables

Create a `.dev.vars` file for local development:

```env
# No secrets needed - Workers AI is auto-configured
```

### wrangler.toml

The project is pre-configured with:
- Workers AI binding
- Durable Object bindings
- Static assets serving

## 📁 Project Structure

```
cf_ai_voice_journal/
├── README.md              # This file
├── PROMPTS.md             # AI prompts documentation
├── package.json           # Dependencies
├── wrangler.toml          # Cloudflare configuration
├── tsconfig.json          # TypeScript config
├── src/
│   ├── index.ts           # Main Worker entry point
│   ├── journal.ts         # Durable Object for state
│   └── prompts.ts         # LLM prompt templates
└── public/
    ├── index.html         # Frontend HTML
    ├── styles.css         # Styling
    └── app.js             # Frontend JavaScript
```

## 🧪 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/entry` | Submit a new journal entry |
| `GET` | `/api/entries` | Get all journal entries |
| `GET` | `/api/mood-history` | Get mood data over time |
| `POST` | `/api/weekly-reflection` | Generate weekly AI reflection |
| `DELETE` | `/api/entries/:id` | Delete a specific entry |

### Example: Submit Entry

```bash
curl -X POST https://your-worker.workers.dev/api/entry \
  -H "Content-Type: application/json" \
  -d '{"content": "Today was a great day! I finished my project and felt accomplished."}'
```

### Response

```json
{
  "id": "entry_1699900000000",
  "content": "Today was a great day! I finished my project and felt accomplished.",
  "summary": "Productive day with a sense of achievement from completing a project.",
  "mood": 8,
  "themes": ["productivity", "accomplishment", "satisfaction"],
  "timestamp": "2024-11-13T12:00:00.000Z"
}
```

## 🎨 Screenshots

### Main Interface
- Clean, calming journal interface
- Voice and text input options
- Real-time mood indicator

### Weekly Reflection
- AI-generated insights
- Mood trend visualization
- Theme analysis

## 🔒 Privacy

- All data is stored in your own Cloudflare Durable Object
- No data is shared with third parties
- Voice processing happens locally in your browser
- Only transcribed text is sent to the API

## 🛠️ Tech Stack

- **Runtime**: Cloudflare Workers
- **AI**: Workers AI (Llama 3.3 70B)
- **State**: Durable Objects
- **Frontend**: Vanilla JS + Web Speech API
- **Routing**: Hono
- **Language**: TypeScript

## 📄 License

MIT License — feel free to use this project as a starting point!

## 🤝 Contributing

Contributions are welcome! Please open an issue or PR.

## 📬 Contact

Built for the Cloudflare AI Application Assignment.

---

**Happy Journaling! 📝✨**
