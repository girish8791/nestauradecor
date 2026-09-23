/* Indian mobile numbers, checked the same way here and in the form backend
   (scripts/lead-form.gs). Keep the two in step. */

// "+91 98765 43210", "098765 43210" and "9876543210" all give "9876543210".
export function normalisePhone(value: string) {
  const digits = String(value).replace(/\D/g, '')
  if (digits.length === 13 && digits.startsWith('091')) return digits.slice(3)
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1)
  return digits
}

// 1234567890 and 9876543210: every digit one step from the one before it.
function isRun(digits: string) {
  const step = Number(digits[1]) - Number(digits[0])
  if (step !== 1 && step !== -1) return false
  return [...digits].every((digit, i) => i === 0 || Number(digit) - Number(digits[i - 1]) === step)
}

/** The reason the number can't be a real mobile, or null when it looks fine. */
export function phoneProblem(value: string) {
  const digits = normalisePhone(value)
  if (digits.length < 10) return 'Enter your 10-digit mobile number.'
  if (digits.length > 10) return 'That is too long for a mobile number. Enter 10 digits.'
  if (!/^[6-9]/.test(digits)) return 'An Indian mobile number starts with 6, 7, 8 or 9.'
  if (/(\d)\1{5}/.test(digits) || isRun(digits)) return 'Please enter a real number we can call you on.'
  return null
}
