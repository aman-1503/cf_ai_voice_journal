import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { WEEKLY_REFLECTION_PROMPT, MOOD_ANALYSIS_PROMPT } from './prompts';

// Types
interface Env {
  AI: Ai;
  JOURNAL: DurableObjectNamespace;
}

interface JournalEntry {
  id: string;
  content: string;
  summary: string;
  mood: number;
  themes: string[];
  timestamp: string;
}

interface AnalysisResult {
  summary: string;
  mood: number;
  themes: string[];
}

// Initialize Hono app
const app = new Hono<{ Bindings: Env }>();

// Enable CORS
app.use('/*', cors());

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', service: 'cf_ai_voice_journal' });
});

// Submit a new journal entry
app.post('/api/entry', async (c) => {
  try {
    const { content } = await c.req.json<{ content: string }>();
    
    if (!content || content.trim().length === 0) {
      return c.json({ error: 'Content is required' }, 400);
    }

    // Analyze the entry using Workers AI
    const analysis = await analyzeEntry(c.env.AI, content);
    
    // Create entry object
    const entry: JournalEntry = {
      id: `entry_${Date.now()}`,
      content: content.trim(),
      summary: analysis.summary,
      mood: analysis.mood,
      themes: analysis.themes,
      timestamp: new Date().toISOString()
    };

    // Store in Durable Object
    const journalId = c.env.JOURNAL.idFromName('default-journal');
    const journal = c.env.JOURNAL.get(journalId);
    
    await journal.fetch(new Request('http://internal/add-entry', {
      method: 'POST',
      body: JSON.stringify(entry)
    }));

    return c.json(entry, 201);
  } catch (error) {
    console.error('Error creating entry:', error);
    return c.json({ error: 'Failed to create entry' }, 500);
  }
});

// Get all journal entries
app.get('/api/entries', async (c) => {
  try {
    const journalId = c.env.JOURNAL.idFromName('default-journal');
    const journal = c.env.JOURNAL.get(journalId);
    
    const response = await journal.fetch(new Request('http://internal/get-entries'));
    const entries = await response.json();
    
    return c.json(entries);
  } catch (error) {
    console.error('Error fetching entries:', error);
    return c.json({ error: 'Failed to fetch entries' }, 500);
  }
});

// Get mood history
app.get('/api/mood-history', async (c) => {
  try {
    const journalId = c.env.JOURNAL.idFromName('default-journal');
    const journal = c.env.JOURNAL.get(journalId);
    
    const response = await journal.fetch(new Request('http://internal/get-mood-history'));
    const moodHistory = await response.json();
    
    return c.json(moodHistory);
  } catch (error) {
    console.error('Error fetching mood history:', error);
    return c.json({ error: 'Failed to fetch mood history' }, 500);
  }
});

// Generate weekly reflection
app.post('/api/weekly-reflection', async (c) => {
  try {
    const journalId = c.env.JOURNAL.idFromName('default-journal');
    const journal = c.env.JOURNAL.get(journalId);
    
    // Get entries from the past week
    const response = await journal.fetch(new Request('http://internal/get-weekly-entries'));
    const entries: JournalEntry[] = await response.json();
    
    if (entries.length === 0) {
      return c.json({ 
        reflection: "You haven't made any journal entries this week yet. Start journaling to receive personalized weekly reflections!" 
      });
    }

    // Generate reflection using AI
    const reflection = await generateWeeklyReflection(c.env.AI, entries);
    
    return c.json({ reflection, entriesAnalyzed: entries.length });
  } catch (error) {
    console.error('Error generating reflection:', error);
    return c.json({ error: 'Failed to generate reflection' }, 500);
  }
});

// Delete an entry
app.delete('/api/entries/:id', async (c) => {
  try {
    const entryId = c.req.param('id');
    
    const journalId = c.env.JOURNAL.idFromName('default-journal');
    const journal = c.env.JOURNAL.get(journalId);
    
    await journal.fetch(new Request('http://internal/delete-entry', {
      method: 'POST',
      body: JSON.stringify({ id: entryId })
    }));
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting entry:', error);
    return c.json({ error: 'Failed to delete entry' }, 500);
  }
});

// Clear all entries
app.delete('/api/entries', async (c) => {
  try {
    const journalId = c.env.JOURNAL.idFromName('default-journal');
    const journal = c.env.JOURNAL.get(journalId);
    
    await journal.fetch(new Request('http://internal/clear-all', {
      method: 'POST'
    }));
    
    return c.json({ success: true, message: 'All entries cleared' });
  } catch (error) {
    console.error('Error clearing entries:', error);
    return c.json({ error: 'Failed to clear entries' }, 500);
  }
});

// Analyze mood trends
app.get('/api/mood-analysis', async (c) => {
  try {
    const journalId = c.env.JOURNAL.idFromName('default-journal');
    const journal = c.env.JOURNAL.get(journalId);
    
    const response = await journal.fetch(new Request('http://internal/get-mood-history'));
    const moodHistory = await response.json();
    
    if (moodHistory.length < 3) {
      return c.json({ 
        insight: "Keep journaling! You need at least 3 entries for mood analysis." 
      });
    }

    const analysis = await analyzeMoodTrends(c.env.AI, moodHistory);
    
    return c.json(analysis);
  } catch (error) {
    console.error('Error analyzing mood:', error);
    return c.json({ error: 'Failed to analyze mood' }, 500);
  }
});

// AI Helper Functions
async function analyzeEntry(ai: Ai, content: string): Promise<AnalysisResult> {
  // Build a clear prompt directly
  const userPrompt = `Analyze this journal entry and respond with ONLY valid JSON, no other text:

Journal Entry: "${content}"

Required JSON format:
{"summary": "1-2 sentence summary", "mood": <number 1-10>, "themes": ["theme1", "theme2"]}

Rules:
- mood: 1=very negative, 5=neutral, 10=very positive
- themes: 2-4 relevant topics
- summary: brief, captures the essence

JSON response:`;

  try {
    const response = await ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        { 
          role: 'system', 
          content: 'You are a JSON-only response bot. Output valid JSON with no markdown, no explanation, no extra text.' 
        },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 256,
      temperature: 0.2
    });

    const text = (response as any).response || '';
    console.log('AI Response:', text); // Debug logging
    
    // Try to extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        summary: parsed.summary || content.slice(0, 100) + '...',
        mood: Math.min(10, Math.max(1, Number(parsed.mood) || 5)),
        themes: Array.isArray(parsed.themes) ? parsed.themes : ['reflection']
      };
    }
    
    throw new Error('No valid JSON found');
  } catch (e) {
    console.error('AI Analysis Error:', e);
    
    // Smart fallback: basic sentiment analysis
    const lowerContent = content.toLowerCase();
    const positiveWords = ['amazing', 'great', 'happy', 'love', 'wonderful', 'fantastic', 'excited', 'proud', 'grateful', 'blessed', 'awesome', 'beautiful', 'joy', 'celebrate', 'success', 'accomplished'];
    const negativeWords = ['sad', 'angry', 'frustrated', 'stressed', 'anxious', 'worried', 'terrible', 'awful', 'bad', 'rough', 'overwhelmed', 'exhausted', 'tired', 'difficult', 'struggle', 'upset', 'disappointed'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveWords.forEach(word => {
      if (lowerContent.includes(word)) positiveCount++;
    });
    negativeWords.forEach(word => {
      if (lowerContent.includes(word)) negativeCount++;
    });
    
    // Calculate mood based on word analysis
    let mood = 5; // neutral default
    if (positiveCount > negativeCount) {
      mood = Math.min(10, 6 + positiveCount);
    } else if (negativeCount > positiveCount) {
      mood = Math.max(1, 4 - negativeCount);
    }
    
    // Extract basic themes from content
    const themeKeywords: Record<string, string[]> = {
      'work': ['work', 'job', 'meeting', 'project', 'deadline', 'boss', 'colleague', 'office'],
      'health': ['exercise', 'gym', 'run', 'walk', 'sleep', 'tired', 'energy', 'health'],
      'relationships': ['friend', 'family', 'partner', 'love', 'conversation', 'together'],
      'growth': ['learn', 'goal', 'improve', 'skill', 'progress', 'future'],
      'stress': ['stress', 'anxious', 'worried', 'overwhelmed', 'pressure'],
      'gratitude': ['grateful', 'thankful', 'blessed', 'appreciate'],
      'achievement': ['accomplished', 'finished', 'completed', 'success', 'proud'],
      'relaxation': ['relax', 'rest', 'peaceful', 'calm', 'weekend']
    };
    
    const detectedThemes: string[] = [];
    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      if (keywords.some(kw => lowerContent.includes(kw))) {
        detectedThemes.push(theme);
      }
    }
    
    return {
      summary: content.slice(0, 150).trim() + (content.length > 150 ? '...' : ''),
      mood: mood,
      themes: detectedThemes.length > 0 ? detectedThemes.slice(0, 4) : ['reflection']
    };
  }
}

async function generateWeeklyReflection(ai: Ai, entries: JournalEntry[]): Promise<string> {
  const entriesSummary = entries.map(e => ({
    date: e.timestamp,
    summary: e.summary,
    mood: e.mood,
    themes: e.themes
  }));
  
  const prompt = WEEKLY_REFLECTION_PROMPT.replace('${entriesJson}', JSON.stringify(entriesSummary, null, 2));
  
  const response = await ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
    messages: [
      { 
        role: 'system', 
        content: 'You are a thoughtful journaling coach. Provide warm, supportive reflections.' 
      },
      { role: 'user', content: prompt }
    ],
    max_tokens: 1024,
    temperature: 0.7
  });

  return (response as any).response || 'Unable to generate reflection at this time.';
}

async function analyzeMoodTrends(ai: Ai, moodData: any[]): Promise<any> {
  const prompt = MOOD_ANALYSIS_PROMPT.replace('${moodDataJson}', JSON.stringify(moodData, null, 2));
  
  const response = await ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
    messages: [
      { 
        role: 'system', 
        content: 'You are a mood analytics assistant. Respond with valid JSON only.' 
      },
      { role: 'user', content: prompt }
    ],
    max_tokens: 512,
    temperature: 0.3
  });

  try {
    const text = (response as any).response || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON found');
  } catch (e) {
    const avgMood = moodData.reduce((sum, m) => sum + m.mood, 0) / moodData.length;
    return {
      trend: 'stable',
      averageMood: Math.round(avgMood * 10) / 10,
      insight: 'Continue journaling to unlock deeper insights.'
    };
  }
}

// Export the Durable Object class
export { JournalDurableObject } from './journal';

// Export default handler
export default app;
