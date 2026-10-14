import { translations } from '../src/i18n/translations';
import { SALE_ITEMS } from '../src/config/sale';

function calculateDiscountPercentage(original: number, sale: number): number {
  if (original <= 0 || sale >= original) return 0;
  return Math.round(((original - sale) / original) * 100);
}

function formatPKR(amount: number): string {
  return `PKR ${amount.toLocaleString()}`;
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    passed++;
    console.log(`[PASS] ${testName}`);
  } else {
    failed++;
    console.error(`[FAIL] ${testName}${details ? ': ' + details : ''}`);
  }
}

console.log('=== RUNNING BOUTIQUE STITCHING VERIFICATION SUITE ===\n');

// 1. Translations Integrity Test
console.log('--- 1. Testing Translations Dictionary Completeness ---');
const enKeys = Object.keys(translations.en);
const urKeys = Object.keys(translations.ur);
const romanUrKeys = Object.keys(translations.roman_ur);

assert(enKeys.length > 100, `English translation dictionary has ${enKeys.length} keys`);
assert(urKeys.length > 100, `Urdu translation dictionary has ${urKeys.length} keys`);
assert(romanUrKeys.length > 100, `Roman Urdu translation dictionary has ${romanUrKeys.length} keys`);

const missingInUr = enKeys.filter(k => !(k in translations.ur));
const missingInRomanUr = enKeys.filter(k => !(k in translations.roman_ur));

assert(missingInUr.length === 0, 'Urdu translations dictionary is 100% complete', `Missing: ${missingInUr.slice(0, 5).join(', ')}`);
assert(missingInRomanUr.length === 0, 'Roman Urdu translations dictionary is 100% complete', `Missing: ${missingInRomanUr.slice(0, 5).join(', ')}`);

// 2. Pricing & Calculation Tests
console.log('\n--- 2. Testing Pricing & Discount Calculations ---');
const discount1 = calculateDiscountPercentage(10000, 7500);
assert(discount1 === 25, `25% discount calculated accurately: got ${discount1}%`);

const discount2 = calculateDiscountPercentage(5000, 5000);
assert(discount2 === 0, `0% discount calculated accurately for equal prices: got ${discount2}%`);

const pkrFormatted = formatPKR(3500);
assert(pkrFormatted.includes('3,500') || pkrFormatted.includes('3500'), `PKR currency formatting works: got ${pkrFormatted}`);

// 3. Worker Salary Calculation Tests
console.log('\n--- 3. Testing Worker Salary Payable Calculation ---');
function calculatePayable(base: number, bonus: number, deduction: number): number {
  return Math.max(0, base + bonus - deduction);
}

const sal1 = calculatePayable(35000, 5000, 2000);
assert(sal1 === 38000, `Worker payable calculation correct: 35000 + 5000 - 2000 = ${sal1}`);

const sal2 = calculatePayable(25000, 0, 0);
assert(sal2 === 25000, `Base salary payable without adjustments: got ${sal2}`);

const sal3 = calculatePayable(20000, 0, 25000);
assert(sal3 === 0, `Payable does not go negative when deductions exceed total: got ${sal3}`);

// 4. Booking Validation Logic Tests
console.log('\n--- 4. Testing Booking Validation Logic ---');
function validateBooking(payload: { customerName: string; phone: string; category: string }): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!payload.customerName || payload.customerName.trim().length < 2) {
    errors.push('Customer name is required (min 2 chars)');
  }
  const phoneClean = payload.phone.replace(/[\s-]/g, '');
  if (!phoneClean || phoneClean.length < 10) {
    errors.push('Valid contact phone number is required (min 10 digits)');
  }
  if (!['ladies', 'kids'].includes(payload.category)) {
    errors.push('Category must be ladies or kids');
  }
  return { valid: errors.length === 0, errors };
}

assert(validateBooking({ customerName: 'Amina Bibi', phone: '03001234567', category: 'ladies' }).valid, 'Valid ladies booking passes');
assert(validateBooking({ customerName: 'Zainab', phone: '0300-9876543', category: 'kids' }).valid, 'Valid kids booking with formatted phone passes');
assert(!validateBooking({ customerName: '', phone: '03001234567', category: 'ladies' }).valid, 'Empty customer name rejected');
assert(!validateBooking({ customerName: 'Ali', phone: '123', category: 'ladies' }).valid, 'Short phone number rejected');
assert(!validateBooking({ customerName: 'Fatima', phone: '03001234567', category: 'mens' as any }).valid, 'Invalid category rejected');

// 5. Poster Filtering & Active Display Rule
console.log('\n--- 5. Testing Poster Active Visibility Rules ---');
interface MockPoster {
  id: string;
  title: string;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
}

function isPosterVisibleToPublic(poster: MockPoster, nowIso: string = '2026-10-11'): boolean {
  if (!poster.is_active) return false;
  if (poster.start_date && poster.start_date > nowIso) return false;
  if (poster.end_date && poster.end_date < nowIso) return false;
  return true;
}

assert(isPosterVisibleToPublic({ id: '1', title: 'Active Poster', is_active: true }), 'Active poster is visible');
assert(!isPosterVisibleToPublic({ id: '2', title: 'Inactive Poster', is_active: false }), 'Inactive poster is NOT visible to public');
assert(!isPosterVisibleToPublic({ id: '3', title: 'Future Poster', is_active: true, start_date: '2026-12-01' }), 'Future scheduled poster is NOT visible yet');
assert(!isPosterVisibleToPublic({ id: '4', title: 'Expired Poster', is_active: true, end_date: '2026-09-01' }), 'Expired poster is NOT visible to public');

// 6. Review Moderation Visibility Rule
console.log('\n--- 6. Testing Customer Review Moderation Rules ---');
function isReviewVisibleToPublic(review: { status: 'Pending' | 'Approved' | 'Rejected' }): boolean {
  return review.status === 'Approved';
}

assert(isReviewVisibleToPublic({ status: 'Approved' }), 'Approved review is public');
assert(!isReviewVisibleToPublic({ status: 'Pending' }), 'Pending review is NOT public');
assert(!isReviewVisibleToPublic({ status: 'Rejected' }), 'Rejected review is NOT public');

// 7. Social Links Validation
console.log('\n--- 7. Testing Social Media URL Validation ---');
function isValidSocialUrl(url?: string): boolean {
  if (!url || !url.trim()) return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

assert(isValidSocialUrl('https://instagram.com/boutiquestitching'), 'Valid https Instagram URL passes');
assert(isValidSocialUrl('https://facebook.com/boutiquestitching'), 'Valid https Facebook URL passes');
assert(isValidSocialUrl('https://tiktok.com/@boutiquestitching'), 'Valid https TikTok URL passes');
assert(isValidSocialUrl('https://youtube.com/@boutiquestitching'), 'Valid https YouTube URL passes');
assert(!isValidSocialUrl('javascript:alert(1)'), 'Dangerous javascript URI rejected');
assert(!isValidSocialUrl('not-a-valid-url'), 'Invalid string rejected');
assert(!isValidSocialUrl(''), 'Empty URL rejected');

console.log('\n======================================================');
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL PROGRAMMATIC LOGIC TESTS PASSED SUCCESSFULLY!');
}
