/**
 * Call-back form backend: Google Apps Script bound to the leads Google Sheet.
 * Each request from the website's footer form adds a row to the "Leads" tab
 * and emails the details to NOTIFY. Setup steps are in README.md ("Call-back form").
 *
 * Junk is handled in three ways: obvious bots and unreal numbers are refused,
 * repeat sends of the same request are ignored, and anything merely suspicious
 * is saved with a note in the "Check" column so no real enquiry is lost.
 */

// Who gets the new-enquiry email. Several addresses: separate them with commas.
// Left empty, it goes to the Google account that deployed this script.
const NOTIFY = 'approvedavi@gmail.com'

const SHEET = 'Leads'
const COLUMNS = ['Received', 'Name', 'Phone', 'Location', 'Type of space', 'Budget', 'Message', 'Page', 'Check']
const FIELDS = ['name', 'phone', 'location', 'spaceType', 'budget', 'message', 'page']

function doPost(e) {
  const data = (e && e.parameter) || {}
  // Bots fill the hidden "website" field; people never see it.
  if (data.website) return reply({ ok: true })

  const name = clean(data.name)
  const phone = normalisePhone(data.phone)
  if (name.length < 2 || phoneProblem(phone)) return reply({ ok: false, error: 'invalid' })

  const lock = LockService.getScriptLock()
  lock.waitLock(10000)
  try {
    const cache = CacheService.getScriptCache()
    // The same number twice within ten minutes is one enquiry, not two.
    if (cache.get(phone)) return reply({ ok: true })
    // A flood is someone attacking the form, not a rush of customers: stop
    // writing after 40 in an hour, so the sheet and the inbox stay usable.
    const hour = Number(cache.get('count') || 0) + 1
    if (hour > 40) return reply({ ok: true })
    cache.put('count', String(hour), 3600)
    cache.put(phone, '1', 600)
    sheet().appendRow([new Date()].concat(FIELDS.map(field => cell(data[field]))).concat([checks(data).join(', ')]))
  } finally {
    lock.releaseLock()
  }

  const lines = FIELDS.slice(0, 6).map((field, i) => COLUMNS[i + 1] + ': ' + (clean(data[field]) || '-'))
  const flags = checks(data)
  MailApp.sendEmail({
    to: NOTIFY || Session.getEffectiveUser().getEmail(),
    subject: (flags.length ? 'Check this call-back request: ' : 'New call-back request: ') + oneLine(name) + (clean(data.location) ? ', ' + oneLine(data.location) : ''),
    body: lines.join('\n') + '\n\nWhatsApp: https://wa.me/91' + phone
      + (flags.length ? '\n\nWorth a look before you call: ' + flags.join(', ') + '.' : '')
      + '\n\nAll enquiries: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl(),
  })
  return reply({ ok: true })
}

// Reasons to look twice at a request. None of these refuse it on their own.
function checks(data) {
  const flags = []
  const seconds = Number(data.seconds)
  if (seconds && seconds < 8) flags.push('filled in ' + seconds + 's')
  if (/https?:\/\/|www\.|\[url|<a /i.test(clean(data.message))) flags.push('link in the message')
  if (/(.)\1{7}/.test(clean(data.message))) flags.push('repeated characters')
  return flags
}

function normalisePhone(value) {
  const digits = clean(value).replace(/\D/g, '')
  if (digits.length === 13 && digits.indexOf('091') === 0) return digits.slice(3)
  if (digits.length === 12 && digits.indexOf('91') === 0) return digits.slice(2)
  if (digits.length === 11 && digits.indexOf('0') === 0) return digits.slice(1)
  return digits
}

// Must be a real Indian mobile: ten digits, starting 6-9, not 9999999999 or 9876543210.
function phoneProblem(digits) {
  if (!/^[6-9]\d{9}$/.test(digits)) return 'shape'
  if (/(\d)\1{5}/.test(digits)) return 'repeated'
  const step = Number(digits[1]) - Number(digits[0])
  if (step === 1 || step === -1) {
    let run = true
    for (let i = 1; i < digits.length; i++) if (Number(digits[i]) - Number(digits[i - 1]) !== step) run = false
    if (run) return 'sequence'
  }
  return ''
}

function sheet() {
  const book = SpreadsheetApp.getActiveSpreadsheet()
  let tab = book.getSheetByName(SHEET)
  if (!tab) {
    tab = book.insertSheet(SHEET)
    tab.appendRow(COLUMNS)
    tab.setFrozenRows(1)
  }
  // widen the header if this script added columns since the tab was made
  if (tab.getLastColumn() < COLUMNS.length) tab.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS])
  tab.getRange(1, 1, 1, COLUMNS.length).setFontWeight('bold')
  return tab
}

function clean(value) {
  return String(value || '').trim().slice(0, 2000)
}

// for the email subject: one line only, so a name can't add mail headers
function oneLine(value) {
  return clean(value).replace(/[\r\n]+/g, ' ').slice(0, 120)
}

// A leading = + - or @ would make Sheets treat the text as a formula.
function cell(value) {
  const text = clean(value)
  return /^[=+\-@]/.test(text) ? "'" + text : text
}

function reply(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON)
}

// Run once from the editor: grants the email permission and sends a test email.
function testEmail() {
  MailApp.sendEmail(NOTIFY || Session.getEffectiveUser().getEmail(), 'Nest Aura Decor: form emails are working', 'New call-back requests from the website will arrive like this.')
}
