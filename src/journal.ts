// Journal Durable Object for persistent state management

interface JournalEntry {
  id: string;
  content: string;
  summary: string;
  mood: number;
  themes: string[];
  timestamp: string;
}

interface JournalState {
  entries: JournalEntry[];
}

export class JournalDurableObject implements DurableObject {
  private state: DurableObjectState;
  private entries: JournalEntry[] = [];
  private initialized: boolean = false;

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
  }

  private async initialize() {
    if (this.initialized) return;
    
    const stored = await this.state.storage.get<JournalEntry[]>('entries');
    this.entries = stored || [];
    this.initialized = true;
  }

  private async saveEntries() {
    await this.state.storage.put('entries', this.entries);
  }

  async fetch(request: Request): Promise<Response> {
    await this.initialize();
    
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      switch (path) {
        case '/add-entry':
          return this.handleAddEntry(request);
        
        case '/get-entries':
          return this.handleGetEntries();
        
        case '/get-mood-history':
          return this.handleGetMoodHistory();
        
        case '/get-weekly-entries':
          return this.handleGetWeeklyEntries();
        
        case '/delete-entry':
          return this.handleDeleteEntry(request);
        
        case '/get-themes':
          return this.handleGetThemes();
        
        case '/clear-all':
          return this.handleClearAll();
        
        default:
          return new Response('Not Found', { status: 404 });
      }
    } catch (error) {
      console.error('Durable Object error:', error);
      return new Response(JSON.stringify({ error: 'Internal error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleAddEntry(request: Request): Promise<Response> {
    const entry: JournalEntry = await request.json();
    
    // Add entry to the beginning (most recent first)
    this.entries.unshift(entry);
    
    // Keep only last 365 entries (1 year of daily entries)
    if (this.entries.length > 365) {
      this.entries = this.entries.slice(0, 365);
    }
    
    await this.saveEntries();
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async handleGetEntries(): Promise<Response> {
    return new Response(JSON.stringify(this.entries), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async handleGetMoodHistory(): Promise<Response> {
    const moodHistory = this.entries.map(entry => ({
      date: entry.timestamp,
      mood: entry.mood,
      id: entry.id
    }));
    
    return new Response(JSON.stringify(moodHistory), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async handleGetWeeklyEntries(): Promise<Response> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyEntries = this.entries.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate >= oneWeekAgo;
    });
    
    return new Response(JSON.stringify(weeklyEntries), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async handleDeleteEntry(request: Request): Promise<Response> {
    const { id } = await request.json<{ id: string }>();
    
    const initialLength = this.entries.length;
    this.entries = this.entries.filter(entry => entry.id !== id);
    
    if (this.entries.length < initialLength) {
      await this.saveEntries();
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ success: false, error: 'Entry not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async handleGetThemes(): Promise<Response> {
    // Aggregate all themes with counts
    const themeCounts: Record<string, number> = {};
    
    for (const entry of this.entries) {
      for (const theme of entry.themes) {
        const normalizedTheme = theme.toLowerCase().trim();
        themeCounts[normalizedTheme] = (themeCounts[normalizedTheme] || 0) + 1;
      }
    }
    
    // Sort by frequency
    const sortedThemes = Object.entries(themeCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([theme, count]) => ({ theme, count }));
    
    return new Response(JSON.stringify(sortedThemes), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async handleClearAll(): Promise<Response> {
    this.entries = [];
    await this.saveEntries();
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
