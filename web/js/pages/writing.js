// pages/writing.js — Writing prompts with copy-to-clipboard

export async function renderWriting(curriculum) {
  const container = document.getElementById('app-content');
  if (!container) return;

  const prompts = [
    { id: 'w1', prompt: 'Prezintă-te: cum te cheamă, de unde ești, ce faci, ce îți place.', promptEn: 'Introduce yourself: name, origin, occupation, hobbies.', words: 80 },
    { id: 'w2', prompt: 'Descrie-ți familia: câți membri are, cum îi cheamă, ce fac ei.', promptEn: 'Describe your family: members, names, occupations.', words: 100 },
    { id: 'w3', prompt: 'Ce ai mâncat azi? Descrie un fel de mâncare românesc.', promptEn: 'What did you eat today? Describe a Romanian dish.', words: 80 },
    { id: 'w4', prompt: 'Descrie-ți rutina zilnică de luni până vineri.', promptEn: 'Describe your daily routine from Monday to Friday.', words: 120 },
    { id: 'w5', prompt: 'Unde ai fost în vacanță? Ce ai făcut acolo?', promptEn: 'Where did you go on holiday? What did you do there?', words: 120 },
    { id: 'w6', prompt: 'Care sunt planurile tale pentru weekendul viitor?', promptEn: 'What are your plans for next weekend?', words: 80 },
    { id: 'w7', prompt: 'Scrie o scrisoare informală unui prieten în care îi povestești cum îți merge.', promptEn: 'Write an informal letter to a friend about how you\'re doing.', words: 150 },
    { id: 'w8', prompt: 'Compară două orașe: unde ai vrea să locuiești și de ce?', promptEn: 'Compare two cities: where would you like to live and why?', words: 150 },
    { id: 'w9', prompt: 'Dacă ai putea călători oriunde, unde ai merge și de ce?', promptEn: 'If you could travel anywhere, where would you go and why?', words: 120 },
    { id: 'w10', prompt: 'Descrie o tradiție românească pe care o cunoști.', promptEn: 'Describe a Romanian tradition that you know.', words: 150 },
  ];

  container.innerHTML = `
    <div class="writing-page">
      <div class="writing-header">
        <a href="#/" class="back-link">← Dashboard</a>
        <h1>✍️ Writing Practice / Exerciții de Scriere</h1>
      </div>

      <div class="writing-prompt-selector">
        <label for="prompt-select">Alege un subiect / Choose a topic:</label>
        <select id="prompt-select">
          ${prompts.map(p => `<option value="${p.id}">${p.promptEn}</option>`).join('')}
        </select>
      </div>

      <div class="writing-area">
        <div class="prompt-display">
          <h3>Subject / Subiect:</h3>
          <p class="prompt-ro">${prompts[0].prompt}</p>
          <p class="prompt-en"><em>${prompts[0].promptEn}</em></p>
          <p class="prompt-words">Target: ~${prompts[0].words} words / Minimum: ${Math.round(prompts[0].words * 0.7)} words</p>
        </div>

        <textarea id="writing-textarea" rows="10" placeholder="Scrie aici... / Write here..."></textarea>

        <div class="writing-tools">
          <span class="word-count">Words: <strong id="word-count">0</strong></span>
          <button class="btn btn-secondary" id="btn-copy-writing">📋 Copy for AI Feedback</button>
          <button class="btn btn-primary" id="btn-clear-writing">🗑️ Clear</button>
        </div>
      </div>

      <div class="writing-instructions">
        <h3>How to get feedback / Cum primești feedback:</h3>
        <ol>
          <li>Write your text in the textarea above</li>
          <li>Click "Copy for AI Feedback" to copy your text</li>
          <li>Paste it into Claude, ChatGPT, or any AI tool with this prompt:</li>
        </ol>
        <div class="feedback-prompt-box">
          <p><strong>Copy this prompt along with your text:</strong></p>
          <div class="prompt-template" id="feedback-template">Correct my Romanian writing. Check grammar, vocabulary, spelling, and diacritics. Give feedback in both English and Romanian. Suggest improvements. Here is my text:

[PASTE YOUR TEXT HERE]</div>
          <button class="btn btn-sm" id="btn-copy-template">📋 Copy Prompt</button>
        </div>
      </div>
    </div>
  `;

  const textarea = document.getElementById('writing-textarea');
  const wordCountEl = document.getElementById('word-count');
  const select = document.getElementById('prompt-select');
  const promptRoEl = document.querySelector('.prompt-ro');
  const promptEnEl = document.querySelector('.prompt-en');
  const promptWordsEl = document.querySelector('.prompt-words');

  function updateWordCount() {
    const text = textarea.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    wordCountEl.textContent = words;
  }

  textarea.addEventListener('input', updateWordCount);

  select.addEventListener('change', () => {
    const p = prompts.find(p => p.id === select.value);
    if (p) {
      promptRoEl.textContent = p.prompt;
      promptEnEl.textContent = p.promptEn;
      promptWordsEl.textContent = `Target: ~${p.words} words / Minimum: ${Math.round(p.words * 0.7)} words`;
    }
  });

  document.getElementById('btn-copy-writing').addEventListener('click', () => {
    const p = prompts.find(p => p.id === select.value);
    const text = textarea.value.trim();
    const fullText = `Prompt: ${p.prompt}\n\nMy text:\n${text}`;
    navigator.clipboard.writeText(fullText).then(() => {
      const btn = document.getElementById('btn-copy-writing');
      btn.textContent = '✅ Copied!';
      setTimeout(() => { btn.textContent = '📋 Copy for AI Feedback'; }, 2000);
    });
  });

  document.getElementById('btn-copy-template').addEventListener('click', () => {
    const template = document.getElementById('feedback-template').textContent;
    navigator.clipboard.writeText(template).then(() => {
      const btn = document.getElementById('btn-copy-template');
      btn.textContent = '✅ Copied!';
      setTimeout(() => { btn.textContent = '📋 Copy Prompt'; }, 2000);
    });
  });

  document.getElementById('btn-clear-writing').addEventListener('click', () => {
    textarea.value = '';
    updateWordCount();
  });
}
