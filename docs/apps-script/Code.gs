// LUX web app: waitlist email capture + Groq tarot reading proxy.
// Deploy: Extensions ▸ Apps Script, paste this, set Script Property GROQ_API_KEY,
// then Deploy ▸ New deployment ▸ Web app ▸ Execute as: Me ▸ Access: Anyone.

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);

    // NEW: tarot reading request → return JSON { reading }.
    if (body.type === 'reading') {
      checkRateLimit();
      return jsonOut({ reading: generateReading(body) });
    }

    // EXISTING waitlist behavior — unchanged.
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    if (body.email) sheet.appendRow([new Date(), body.email]);
    return ContentService.createTextOutput('ok');
  } catch (err) {
    return jsonOut({ error: String(err && err.message || err) });
  }
}

function generateReading(body) {
  var key = PropertiesService.getScriptProperties().getProperty('GROQ_API_KEY');
  if (!key) throw new Error('Missing GROQ_API_KEY');

  var cards = (body.cards || []).map(function (c) {
    return '- ' + c.position + ': ' + c.name + ' (' + c.orientation + ') — ' + c.meaning;
  }).join('\n');

  var system =
    'You are LUX, a tarot reader who is warm but clear and direct. Given a 3-card ' +
    'Past/Present/Future spread and the querent\'s question, write exactly 3 short ' +
    'paragraphs (2-3 sentences each), one per card in order (Past, then Present, then ' +
    'Future). In each paragraph: name the card, state plainly what it means in its position and ' +
    'orientation (upright/reversed), then connect that meaning concretely to the ' +
    'question in direct, everyday language — say what is actually going on and what it ' +
    'implies, not just mood or imagery. Then add a final short paragraph of 2-3 ' +
    'sentences with specific, practical guidance the querent can act on soon. Favor ' +
    'clarity over mystery: never be vague, cryptic, or purple. A little warmth and one ' +
    'vivid image are fine; fog is not. Plain text only, no headings or bullet points.';

  var user = 'Question: ' + (body.question || '(none given)') + '\n\nSpread:\n' + cards;

  var res = UrlFetchApp.fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + key },
    muteHttpExceptions: true,
    payload: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      temperature: 0.6,
      max_tokens: 800,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });

  if (res.getResponseCode() !== 200) {
    throw new Error('Groq ' + res.getResponseCode() + ': ' + res.getContentText());
  }
  var data = JSON.parse(res.getContentText());
  return data.choices[0].message.content.trim();
}

// Global throttle to protect the Groq free-tier quota (org-level: ~12k tokens/min,
// 100k tokens/day; a reading is ~1k tokens). Caps are GLOBAL, not per-user, because
// Apps Script doesn't expose the caller's IP. When a cap is hit, the reading request
// errors and the site falls back to its curated card meanings.
var RL_PER_MINUTE = 10;   // stays under ~12k tokens/min (~1.2k tokens/reading)
var RL_PER_DAY = 80;      // stays under 100k tokens/day (~1.2k tokens/reading)

function checkRateLimit() {
  var lock = LockService.getScriptLock();
  lock.waitLock(5000);                    // serialize the read-modify-write
  try {
    var cache = CacheService.getScriptCache();
    var minCount = Number(cache.get('rl_min') || 0);
    if (minCount >= RL_PER_MINUTE) throw new Error('rate_limited: too many readings this minute');
    cache.put('rl_min', String(minCount + 1), 60);   // fixed 60s window

    var props = PropertiesService.getScriptProperties();
    var today = Utilities.formatDate(new Date(), 'Etc/UTC', 'yyyy-MM-dd');
    var dayKey = 'rl_day_' + today;
    var dayCount = Number(props.getProperty(dayKey) || 0);
    if (dayCount >= RL_PER_DAY) throw new Error('rate_limited: daily reading limit reached');
    props.setProperty(dayKey, String(dayCount + 1));

    // Tidy up: drop yesterday's counter so properties don't accumulate.
    var yesterday = Utilities.formatDate(new Date(Date.now() - 86400000), 'Etc/UTC', 'yyyy-MM-dd');
    props.deleteProperty('rl_day_' + yesterday);
  } finally {
    lock.releaseLock();
  }
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
