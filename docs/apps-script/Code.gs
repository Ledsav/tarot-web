// LUX web app: waitlist email capture + Groq tarot reading proxy.
// Deploy: Extensions ▸ Apps Script, paste this, set Script Property GROQ_API_KEY,
// then Deploy ▸ New deployment ▸ Web app ▸ Execute as: Me ▸ Access: Anyone.

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);

    // NEW: tarot reading request → return JSON { reading }.
    if (body.type === 'reading') {
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
    'You are LUX, a mystical tarot reader. Voice: evocative, atmospheric, warm but ' +
    'never cheesy. Given a 3-card Past/Present/Future spread, write a cohesive reading ' +
    'of 2-3 short paragraphs. Weave each card\'s position and orientation into a single ' +
    'narrative that speaks to the querent\'s question. Do not list the cards mechanically. ' +
    'End with a single grounded line of guidance. Plain text only.';

  var user = 'Question: ' + (body.question || '(none given)') + '\n\nSpread:\n' + cards;

  var res = UrlFetchApp.fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + key },
    muteHttpExceptions: true,
    payload: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.9,
      max_tokens: 500,
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

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
