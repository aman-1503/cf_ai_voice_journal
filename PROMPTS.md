# AI Prompts Used in Development

This document contains all AI prompts used during the development of `cf_ai_voice_journal`.

## 🤖 Development Prompts

### Initial Project Brainstorming

**Prompt to Claude:**
```
I need to build an AI-powered application on Cloudflare for a job assignment. Requirements:
- LLM (recommend using Llama 3.3 on Workers AI)
- Workflow / coordination (recommend using Workflows, Workers or Durable Objects)
- User input via chat or voice (recommend using Pages or Realtime)
- Memory or state

Can you brainstorm project ideas?
```

**Follow-up:**
```
Voice-Powered Daily Journal — cf_ai_voice_journal
Speak or type your thoughts daily. The AI summarizes entries, tracks mood over time, and provides weekly reflections.
* LLM: Sentiment analysis, summarization, reflection prompts
* State: Journal entries, mood trends, themes
* Workflow: Daily entry → analyze → weekly digest generation
* Interface: Voice or chat via Realtime/Pages

Can you build this and give me as per Cloudflare?
```

---

## 📝 Application LLM Prompts

These are the prompts used within the application itself (in `src/prompts.ts`):

### 1. Journal Entry Analysis Prompt

**Purpose:** Analyze a user's journal entry for summary, mood, and themes.

```
You are an empathetic AI journal assistant. Analyze the following journal entry and provide:

1. A brief summary (1-2 sentences)
2. A mood score from 1-10 (1=very negative, 5=neutral, 10=very positive)
3. 2-4 key themes or topics mentioned

Journal Entry:
"${entryContent}"

Respond in JSON format only:
{
  "summary": "...",
  "mood": <number>,
  "themes": ["theme1", "theme2", ...]
}
```

**Design Rationale:**
- Structured JSON output for easy parsing
- Mood scale 1-10 allows for nuanced tracking
- Theme extraction enables pattern recognition over time
- Empathetic framing encourages thoughtful analysis

---

### 2. Weekly Reflection Prompt

**Purpose:** Generate a personalized weekly reflection based on all entries.

```
You are a thoughtful journaling coach. Based on the following journal entries from the past week, provide a warm, insightful weekly reflection.

Entries:
${entriesJson}

Include in your reflection:
1. Overall mood trend (improving, stable, declining)
2. Recurring themes you noticed
3. One positive observation
4. One gentle suggestion for the coming week
5. An encouraging closing thought

Keep the tone warm, supportive, and personal. Write 3-4 paragraphs.
```

**Design Rationale:**
- Personal, coach-like tone for emotional connection
- Structured sections ensure comprehensive reflection
- Positive framing promotes mental wellness
- Actionable suggestion adds practical value

---

### 3. Mood Trend Analysis Prompt

**Purpose:** Analyze mood patterns over time.

```
Analyze the following mood data from journal entries:

${moodDataJson}

Provide insights about:
1. Overall trend direction
2. Any patterns (day of week, time patterns)
3. Notable highs and lows

Respond in JSON:
{
  "trend": "improving" | "stable" | "declining",
  "averageMood": <number>,
  "insight": "..."
}
```

**Design Rationale:**
- Quantitative analysis for data-driven insights
- Pattern recognition helps users understand themselves
- Concise JSON format for easy integration

---

### 4. Theme Categorization Prompt

**Purpose:** Categorize and consolidate themes across entries.

```
Given these themes extracted from journal entries over time:
${themesArray}

Group them into 3-5 broader categories and identify the most frequent themes.

Respond in JSON:
{
  "categories": {
    "category_name": ["theme1", "theme2"]
  },
  "topThemes": ["most_frequent", "second_most", ...]
}
```

**Design Rationale:**
- Consolidation prevents theme fragmentation
- Categories help users see bigger patterns
- Frequency ranking highlights what matters most

---

## 🔧 Prompt Engineering Decisions

### Why JSON Output?
- Reliable parsing in JavaScript
- Structured data for UI rendering
- Consistent format across responses

### Why Specific Temperature Settings?
- **Entry Analysis (temp=0.3):** Lower temperature for consistent, reliable analysis
- **Weekly Reflection (temp=0.7):** Higher temperature for creative, varied writing

### Why System Role Framing?
- "Empathetic journal assistant" creates supportive tone
- "Journaling coach" adds expertise and authority
- Role-based prompting improves response quality

---

## 📚 Cloudflare Workers AI Notes

### Model Selection
- **Primary:** `@cf/meta/llama-3.3-70b-instruct-fp8-fast`
- **Fallback:** `@cf/meta/llama-3.1-8b-instruct` (faster, less nuanced)

### Token Limits
- Max input: ~4000 tokens for weekly reflection
- Max output: 1024 tokens default

### API Pattern
```typescript
const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ],
  max_tokens: 1024,
  temperature: 0.5
});
```

---

## 🔄 Prompt Iteration History

### v1 → v2: Entry Analysis
- **v1:** Asked for freeform text response
- **Problem:** Inconsistent parsing
- **v2:** Added explicit JSON format requirement
- **Result:** 100% parsing success

### v1 → v2: Weekly Reflection
- **v1:** Generic "summarize these entries"
- **Problem:** Cold, impersonal tone
- **v2:** Added "journaling coach" role + warm tone instruction
- **Result:** More engaging, personal reflections

---

*Last updated: 2024*
