// LLM Prompt Templates for Journal Analysis

export const ANALYZE_ENTRY_PROMPT = `Analyze the following journal entry and provide:

1. A brief summary (1-2 sentences capturing the essence)
2. A mood score from 1-10 (1=very negative, 5=neutral, 10=very positive)
3. 2-4 key themes or topics mentioned

Journal Entry:
"\${entryContent}"

Respond in JSON format only, no additional text:
{
  "summary": "...",
  "mood": <number>,
  "themes": ["theme1", "theme2", ...]
}`;

export const WEEKLY_REFLECTION_PROMPT = `Based on the following journal entries from the past week, provide a warm, insightful weekly reflection.

Entries:
\${entriesJson}

Include in your reflection:
1. Overall mood trend (improving, stable, or declining)
2. Recurring themes you noticed
3. One positive observation about the person's week
4. One gentle, actionable suggestion for the coming week
5. An encouraging closing thought

Keep the tone warm, supportive, and personal. Write 3-4 paragraphs as if you're a caring friend who truly understands them.`;

export const MOOD_ANALYSIS_PROMPT = `Analyze the following mood data from journal entries:

\${moodDataJson}

Provide insights about:
1. Overall trend direction (improving, stable, declining)
2. Average mood score
3. A brief insight or observation

Respond in JSON format only:
{
  "trend": "improving" | "stable" | "declining",
  "averageMood": <number>,
  "insight": "A brief, encouraging observation about the mood patterns"
}`;

export const THEME_CATEGORIZATION_PROMPT = `Given these themes extracted from journal entries over time:
\${themesArray}

Group them into 3-5 broader categories and identify the most frequent themes.

Respond in JSON:
{
  "categories": {
    "category_name": ["theme1", "theme2"]
  },
  "topThemes": ["most_frequent", "second_most", ...]
}`;

export const DAILY_PROMPT_SUGGESTIONS = [
  "What made you smile today?",
  "What's one thing you learned today?",
  "How are you feeling right now, and why?",
  "What are you grateful for today?",
  "What challenged you today, and how did you handle it?",
  "What's something you're looking forward to?",
  "Describe a moment of peace you experienced today.",
  "What would you tell your past self from this morning?",
  "What's occupying your mind the most right now?",
  "How did you take care of yourself today?"
];
