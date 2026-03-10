// AI Voice Journal - Frontend Application

// Daily prompt suggestions
const PROMPTS = [
  "What made you smile today?",
  "What's one thing you learned today?",
  "How are you feeling right now, and why?",
  "What are you grateful for today?",
  "What challenged you today, and how did you handle it?",
  "What's something you're looking forward to?",
  "Describe a moment of peace you experienced today.",
  "What would you tell your past self from this morning?",
  "What's occupying your mind the most right now?",
  "How did you take care of yourself today?",
  "What conversation stuck with you today?",
  "What made today different from yesterday?",
  "What's one small win you had today?",
  "How did you grow today, even in a small way?",
  "What do you need to let go of?"
];

// State
let isRecording = false;
let recognition = null;

// DOM Elements
const journalInput = document.getElementById('journalInput');
const voiceBtn = document.getElementById('voiceBtn');
const voiceStatus = document.getElementById('voiceStatus');
const voiceIndicator = document.getElementById('voiceIndicator');
const submitBtn = document.getElementById('submitBtn');
const promptText = document.getElementById('promptText');
const refreshPrompt = document.getElementById('refreshPrompt');
const analysisSection = document.getElementById('analysisSection');
const analysisSummary = document.getElementById('analysisSummary');
const analysisMood = document.getElementById('analysisMood');
const moodFill = document.getElementById('moodFill');
const analysisThemes = document.getElementById('analysisThemes');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');
const historyBtn = document.getElementById('historyBtn');
const historySection = document.getElementById('historySection');
const closeHistory = document.getElementById('closeHistory');
const entriesList = document.getElementById('entriesList');
const reflectionBtn = document.getElementById('reflectionBtn');
const reflectionSection = document.getElementById('reflectionSection');
const closeReflection = document.getElementById('closeReflection');
const reflectionContent = document.getElementById('reflectionContent');
const moodBtn = document.getElementById('moodBtn');
const moodSection = document.getElementById('moodSection');
const closeMood = document.getElementById('closeMood');
const moodChart = document.getElementById('moodChart');
const moodInsight = document.getElementById('moodInsight');
const clearBtn = document.getElementById('clearBtn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initVoiceRecognition();
  setRandomPrompt();
  setupEventListeners();
});

// Set random prompt
function setRandomPrompt() {
  const randomIndex = Math.floor(Math.random() * PROMPTS.length);
  promptText.textContent = PROMPTS[randomIndex];
}

// Initialize Web Speech API
function initVoiceRecognition() {
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      journalInput.value = transcript;
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      stopRecording();
      if (event.error === 'not-allowed') {
        alert('Microphone access denied. Please allow microphone access to use voice input.');
      }
    };

    recognition.onend = () => {
      if (isRecording) {
        // Restart if still recording (continuous mode)
        recognition.start();
      }
    };
  } else {
    voiceBtn.style.display = 'none';
    console.warn('Speech recognition not supported');
  }
}

// Setup event listeners
function setupEventListeners() {
  // Voice button
  voiceBtn.addEventListener('click', toggleRecording);

  // Submit button
  submitBtn.addEventListener('click', submitEntry);

  // Refresh prompt
  refreshPrompt.addEventListener('click', () => {
    setRandomPrompt();
    refreshPrompt.style.transform = 'rotate(360deg)';
    setTimeout(() => refreshPrompt.style.transform = '', 300);
  });

  // History
  historyBtn.addEventListener('click', showHistory);
  closeHistory.addEventListener('click', () => historySection.style.display = 'none');

  // Reflection
  reflectionBtn.addEventListener('click', generateReflection);
  closeReflection.addEventListener('click', () => reflectionSection.style.display = 'none');

  // Mood
  moodBtn.addEventListener('click', showMoodTrends);
  closeMood.addEventListener('click', () => moodSection.style.display = 'none');

  // Clear all
  clearBtn.addEventListener('click', clearAllEntries);

  // Enter to submit (with shift for newline)
  journalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitEntry();
    }
  });
}

// Toggle voice recording
function toggleRecording() {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
}

function startRecording() {
  if (!recognition) return;
  
  isRecording = true;
  voiceBtn.classList.add('recording');
  voiceStatus.textContent = 'Listening...';
  voiceIndicator.classList.add('active');
  
  try {
    recognition.start();
  } catch (e) {
    // Already started
  }
}

function stopRecording() {
  isRecording = false;
  voiceBtn.classList.remove('recording');
  voiceStatus.textContent = 'Click to speak';
  voiceIndicator.classList.remove('active');
  
  if (recognition) {
    recognition.stop();
  }
}

// Submit journal entry
async function submitEntry() {
  const content = journalInput.value.trim();
  
  if (!content) {
    journalInput.focus();
    return;
  }

  // Stop recording if active
  if (isRecording) {
    stopRecording();
  }

  showLoading('Analyzing your thoughts...');

  try {
    const response = await fetch('/api/entry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });

    if (!response.ok) {
      throw new Error('Failed to save entry');
    }

    const entry = await response.json();
    
    // Show analysis
    displayAnalysis(entry);
    
    // Clear input
    journalInput.value = '';
    
    // Show success feedback
    submitBtn.innerHTML = '<span>✓ Saved!</span>';
    setTimeout(() => {
      submitBtn.innerHTML = '<span>Save Entry</span><span class="submit-icon">→</span>';
    }, 2000);

  } catch (error) {
    console.error('Error:', error);
    alert('Failed to save entry. Please try again.');
  } finally {
    hideLoading();
  }
}

// Display analysis results
function displayAnalysis(entry) {
  analysisSummary.textContent = entry.summary;
  analysisMood.textContent = entry.mood;
  moodFill.style.width = `${entry.mood * 10}%`;
  
  analysisThemes.innerHTML = entry.themes
    .map(theme => `<span class="theme-tag">${theme}</span>`)
    .join('');
  
  analysisSection.style.display = 'block';
  analysisSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Show history
async function showHistory() {
  showLoading('Loading entries...');
  
  try {
    const response = await fetch('/api/entries');
    const entries = await response.json();
    
    if (entries.length === 0) {
      entriesList.innerHTML = `
        <div class="empty-state">
          <span>📝</span>
          <p>No entries yet. Start journaling to see your history!</p>
        </div>
      `;
    } else {
      entriesList.innerHTML = entries.map(entry => `
        <div class="entry-card" data-id="${entry.id}">
          <div class="entry-header">
            <span class="entry-date">${formatDate(entry.timestamp)}</span>
            <span class="entry-mood">Mood: ${entry.mood}/10</span>
          </div>
          <p class="entry-summary">${entry.summary}</p>
          <div class="entry-themes">
            ${entry.themes.map(t => `<span class="entry-theme">${t}</span>`).join('')}
          </div>
        </div>
      `).join('');
    }
    
    // Hide other sections
    reflectionSection.style.display = 'none';
    moodSection.style.display = 'none';
    
    historySection.style.display = 'block';
    historySection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to load entries.');
  } finally {
    hideLoading();
  }
}

// Generate weekly reflection
async function generateReflection() {
  showLoading('Generating your weekly reflection...');
  
  try {
    const response = await fetch('/api/weekly-reflection', {
      method: 'POST'
    });
    
    const data = await response.json();
    
    // Format reflection with paragraphs
    reflectionContent.innerHTML = data.reflection
      .split('\n')
      .filter(p => p.trim())
      .map(p => `<p>${p}</p>`)
      .join('');
    
    if (data.entriesAnalyzed) {
      reflectionContent.innerHTML += `
        <p class="entries-count" style="font-size: 0.85rem; color: var(--text-muted); margin-top: 20px;">
          Based on ${data.entriesAnalyzed} journal ${data.entriesAnalyzed === 1 ? 'entry' : 'entries'} this week.
        </p>
      `;
    }
    
    // Hide other sections
    historySection.style.display = 'none';
    moodSection.style.display = 'none';
    
    reflectionSection.style.display = 'block';
    reflectionSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to generate reflection.');
  } finally {
    hideLoading();
  }
}

// Show mood trends
async function showMoodTrends() {
  showLoading('Analyzing mood patterns...');
  
  try {
    const [historyResponse, analysisResponse] = await Promise.all([
      fetch('/api/mood-history'),
      fetch('/api/mood-analysis')
    ]);
    
    const moodHistory = await historyResponse.json();
    const analysis = await analysisResponse.json();
    
    if (moodHistory.length === 0) {
      moodChart.innerHTML = `
        <div class="empty-state" style="width: 100%;">
          <span>📊</span>
          <p>Start journaling to see your mood trends!</p>
        </div>
      `;
      moodInsight.innerHTML = '';
    } else {
      // Render chart (last 14 entries)
      const recentMoods = moodHistory.slice(0, 14).reverse();
      const maxHeight = 150;
      
      moodChart.innerHTML = recentMoods.map((m, i) => {
        const height = (m.mood / 10) * maxHeight;
        const date = new Date(m.date);
        const label = `${date.getMonth() + 1}/${date.getDate()}`;
        
        return `
          <div class="mood-bar-item" style="height: ${height}px;" title="Mood: ${m.mood}/10">
            <span class="mood-bar-label">${label}</span>
          </div>
        `;
      }).join('');
      
      // Show insight
      if (analysis.insight) {
        const trendEmoji = {
          'improving': '📈',
          'stable': '➡️',
          'declining': '📉'
        }[analysis.trend] || '📊';
        
        moodInsight.innerHTML = `
          <strong>${trendEmoji} ${analysis.trend?.charAt(0).toUpperCase() + analysis.trend?.slice(1) || 'Analysis'}</strong>
          <br>
          Average mood: ${analysis.averageMood?.toFixed(1) || 'N/A'}/10
          <br><br>
          ${analysis.insight}
        `;
      }
    }
    
    // Hide other sections
    historySection.style.display = 'none';
    reflectionSection.style.display = 'none';
    
    moodSection.style.display = 'block';
    moodSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to load mood trends.');
  } finally {
    hideLoading();
  }
}

// Clear all entries
async function clearAllEntries() {
  if (!confirm('Are you sure you want to delete ALL journal entries? This cannot be undone.')) {
    return;
  }

  showLoading('Clearing all entries...');

  try {
    const response = await fetch('/api/entries', {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to clear entries');
    }

    // Hide all sections
    historySection.style.display = 'none';
    reflectionSection.style.display = 'none';
    moodSection.style.display = 'none';
    analysisSection.style.display = 'none';

    alert('✅ All entries cleared! You can now add fresh entries.');

  } catch (error) {
    console.error('Error:', error);
    alert('Failed to clear entries.');
  } finally {
    hideLoading();
  }
}

// Utility functions
function formatDate(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now - date;
  
  // Today
  if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
    return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }
  
  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.getDate() === yesterday.getDate()) {
    return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }
  
  // Within a week
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return date.toLocaleDateString('en-US', { weekday: 'long', hour: 'numeric', minute: '2-digit' });
  }
  
  // Older
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function showLoading(text = 'Loading...') {
  loadingText.textContent = text;
  loadingOverlay.style.display = 'flex';
}

function hideLoading() {
  loadingOverlay.style.display = 'none';
}
