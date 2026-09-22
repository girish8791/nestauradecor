/**
 * Call-back form backend: Google Apps Script bound to the leads Google Sheet.
 * Each request from the website's footer form adds a row to the "Leads" tab
 * and emails the details to NOTIFY. Setup steps are in README.md ("Call-back form").
 */

// Who gets the new-enquiry email. Several addresses: separate them with commas.
// Left empty, it goes to the Google account that deployed this script.
const NOTIFY = 'approvedavi@gmail.com'

const SHEET = 'Leads'
const COLUMNS = ['Received', 'Name', 'Phone', 'Location', 'Type of space', 'Budget', 'Message', 'Page']
const FIELDS = ['name', 'phone', 'location', 'spaceType', 'budget', 'message', 'page']

function doPost(e) {
  const data = (e && e.parameter) || {}
  // Bots fill the hidden "website" field; people never see it.
  if (data.website) return reply({ ok: true })
  if (!clean(data.name) || !clean(data.phone)) return reply({ ok: false, error: 'missing' })

  const lock = LockService.getScriptLock()
  lock.waitLock(10000)
  try {
    sheet().appendRow([new Date()].concat(FIELDS.map(field => cell(data[field]))))
  } finally {
    lock.releaseLock()
  }

  const lines = FIELDS.slice(0, 6).map((field, i) => COLUMNS[i + 1] + ': ' + (clean(data[field]) || '-'))
  const digits = clean(data.phone).replace(/\D/g, '')
  const whatsapp = digits ? 'https://wa.me/' + (digits.length === 10 ? '91' + digits : digits) : ''
  MailApp.sendEmail({
    to: NOTIFY || Session.getEffectiveUser().getEmail(),
    subject: 'New call-back request: ' + clean(data.name) + (clean(data.location) ? ', ' + clean(data.location) : ''),
    body: lines.join('\n') + (whatsapp ? '\n\nWhatsApp: ' + whatsapp : '') + '\n\nAll enquiries: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl(),
  })
  return reply({ ok: true })
}

// Run once from the editor: grants the email permission and sends a test email.
function testEmail() {
  MailApp.sendEmail(NOTIFY || Session.getEffectiveUser().getEmail(), 'Nest Aura Decor: form emails are working', 'New call-back requests from the website will arrive like this.')
}

function sheet() {
  const book = SpreadsheetApp.getActiveSpreadsheet()
  let tab = book.getSheetByName(SHEET)
  if (!tab) {
    tab = book.insertSheet(SHEET)
    tab.appendRow(COLUMNS)
    tab.setFrozenRows(1)
    tab.getRange(1, 1, 1, COLUMNS.length).setFontWeight('bold')
  }
  return tab
}

function clean(value) {
  return String(value || '').trim().slice(0, 2000)
}

// A leading = + - or @ would make Sheets treat the text as a formula.
function cell(value) {
  const text = clean(value)
  return /^[=+\-@]/.test(text) ? "'" + text : text
}

function reply(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON)
}
