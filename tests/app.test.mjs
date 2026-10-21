import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import nextEnv from '@next/env';
import pg from 'pg';
import { chromium } from 'playwright';
import { hashPassword } from 'better-auth/crypto';

nextEnv.loadEnvConfig(process.cwd());
const base = process.env.BETTER_AUTH_URL?.replace(/\/+$/, '');
if (!base || !process.env.DATABASE_URL) throw new Error('Set BETTER_AUTH_URL and DATABASE_URL in .env.local.');
for (const address of [base, process.env.DATABASE_URL]) {
  if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(address).hostname)) {
    throw new Error('These tests are for a local app and local database only.');
  }
}

const database = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const marker = 'test-' + Date.now() + '-' + randomBytes(4).toString('hex');
const password = randomBytes(20).toString('hex');
const adminEmail = marker + '-admin@example.test';
const userEmail = marker + '-user@example.test';
const extraEmail = marker + '-extra@example.test';
let browser, admin, user, guest, extra, adminPage, userPage;
let adminId, userId, bookId, copyA, copyB, firstLoan, originalLoan;
let bookRequest, copyRequest, userRequest, borrowRequest, returnRequest;
let originalData;
const browserErrors = [];
let title = marker + ' Book';

// This ISBN belongs only to this test run.
const digits = '978' + String(Date.now()).slice(-9);
let sum = 0;
for (let index = 0; index < 12; index++) sum += Number(digits[index]) * (index % 2 === 0 ? 1 : 3);
const isbn = digits + ((10 - sum % 10) % 10);

async function snapshot() {
  const result = await database.query(`SELECT
    (SELECT md5(COALESCE(string_agg(row_to_json(u)::text, '' ORDER BY id), ''))
     FROM users u WHERE email NOT LIKE $1) AS users,
    (SELECT md5(COALESCE(string_agg(row_to_json(a)::text, '' ORDER BY id), ''))
     FROM auth_accounts a WHERE user_id NOT IN (SELECT id FROM users WHERE email LIKE $1)) AS accounts,
    (SELECT md5(COALESCE(string_agg(row_to_json(b)::text, '' ORDER BY id), ''))
     FROM books b WHERE LEFT(title, LENGTH($2)) <> $2) AS books,
    (SELECT md5(COALESCE(string_agg(row_to_json(c)::text, '' ORDER BY id), ''))
     FROM copies c WHERE book_id NOT IN (SELECT id FROM books WHERE LEFT(title, LENGTH($2)) = $2)) AS copies,
    (SELECT md5(COALESCE(string_agg(row_to_json(l)::text, '' ORDER BY id), ''))
     FROM loans l WHERE user_id NOT IN (SELECT id FROM users WHERE email LIKE $1)
       AND copy_id NOT IN (SELECT copies.id FROM copies JOIN books ON books.id=copies.book_id
                          WHERE LEFT(books.title, LENGTH($2)) = $2)) AS loans`,
  [marker + '%@example.test', marker]);
  return result.rows[0];
}

async function createTestAccount(name, email, role) {
  const hash = await hashPassword(password);
  const result = await database.query('INSERT INTO users(name,email,role) VALUES($1,$2,$3) RETURNING id', [name,email,role]);
  const id = result.rows[0].id;
  await database.query("INSERT INTO auth_accounts(user_id,account_id,provider_id,password_hash) VALUES($1,$2,'credential',$3)", [id,String(id),hash]);
  return id;
}

function captureAction(page) {
  return page.waitForRequest(request => request.method() === 'POST' && Boolean(request.headers()['next-action']));
}

async function replay(context, request) {
  const headers = { ...request.headers() };
  delete headers.cookie;
  delete headers['content-length'];
  delete headers.host;
  return context.request.post(request.url(), { headers, data: request.postDataBuffer(), maxRedirects: 0 });
}

async function login(page, email) {
  await page.goto(base + '/login');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(base + '/');
}

before(async function () {
  const response = await fetch(base + '/login');
  assert.equal(response.status, 200, 'Start the app before running npm run test:app.');
  originalData = await snapshot();
  // The tests use an installed Chrome, not a browser path from another computer.
  browser = await chromium.launch({ headless: true, channel: process.env.TEST_BROWSER_CHANNEL || 'chrome' });
  admin = await browser.newContext();
  user = await browser.newContext();
  guest = await browser.newContext();
  extra = await browser.newContext();
  for (const context of [admin,user,guest,extra]) {
    context.on('page', function (page) {
      page.on('pageerror', error => browserErrors.push(error.message));
    });
  }
  adminPage = await admin.newPage();
  userPage = await user.newPage();
  adminId = await createTestAccount(marker + ' Admin', adminEmail, 'admin');
  userId = await createTestAccount(marker + ' User', userEmail, 'user');
});

after(async function () {
  // Remove only records with this run's unique marker. Never reset tables or volumes.
  try {
    await database.query(`DELETE FROM loans WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)
      OR copy_id IN (SELECT copies.id FROM copies JOIN books ON books.id=copies.book_id
                     WHERE LEFT(books.title,LENGTH($2))=$2)`, [marker + '%@example.test',marker]);
    await database.query('DELETE FROM copies WHERE book_id IN (SELECT id FROM books WHERE LEFT(title,LENGTH($1))=$1)', [marker]);
    await database.query('DELETE FROM books WHERE LEFT(title,LENGTH($1))=$1', [marker]);
    await database.query('DELETE FROM users WHERE email LIKE $1', [marker + '%@example.test']);
  } finally {
    if (browser) await browser.close();
    await database.end();
  }
});

test('Both roles can sign in with the browser form', async function () {
  await login(adminPage, adminEmail);
  await login(userPage, userEmail);
  assert.ok((await userPage.locator('main').innerText()).includes('Datenbankverbindung erfolgreich'));
  assert.equal(await userPage.getByRole('link', { name: 'Administration', exact: true }).count(), 0);
});

test('Guests and normal users cannot open management pages', async function () {
  for (const route of ['/admin','/admin/books','/admin/books/new','/admin/users','/admin/users/new','/admin/loans','/admin/loans?view=overdue']) {
    const anonymous = await guest.request.get(base + route, { maxRedirects: 0 });
    assert.equal(anonymous.headers().location, '/login');
    const normal = await user.request.get(base + route, { maxRedirects: 0 });
    assert.equal(normal.headers().location, '/forbidden');
    assert.equal((await admin.request.get(base + route)).status(), 200);
  }
  for (const route of ['/','/books','/loans','/loans?view=history','/loans?view=overdue']) {
    assert.equal((await guest.request.get(base + route, { maxRedirects: 0 })).headers().location, '/login');
  }
});

test('An admin can create and edit a book; invalid ISBNs are rejected', async function () {
  await adminPage.goto(base + '/admin/books/new');
  await adminPage.getByLabel('Title', { exact: true }).fill(title);
  await adminPage.getByLabel('Author', { exact: true }).fill("O'Connor");
  await adminPage.getByLabel('ISBN', { exact: true }).fill('123');
  const invalid = captureAction(adminPage);
  await adminPage.getByRole('button', { name: 'Save book', exact: true }).click();
  bookRequest = await invalid;
  await adminPage.locator('p[role=alert]').filter({ hasText: 'valid ISBN' }).waitFor();
  assert.equal(await adminPage.getByLabel('Title', { exact: true }).inputValue(), title);
  await adminPage.locator('form').evaluate(form => { form.noValidate = true; });
  await adminPage.getByLabel('ISBN', { exact: true }).evaluate(input => { input.maxLength = 1000; });
  await adminPage.getByLabel('ISBN', { exact: true }).fill(isbn + '-'.repeat(40));
  await adminPage.getByRole('button', { name: 'Save book', exact: true }).click();
  await adminPage.locator('p[role=alert]').filter({ hasText: 'at most 32' }).waitFor();
  await adminPage.getByLabel('ISBN', { exact: true }).fill(isbn);
  await adminPage.getByLabel('Publisher', { exact: true }).fill('Test publisher');
  await adminPage.getByLabel('Publication year', { exact: true }).fill('2020');
  await adminPage.getByLabel('Category', { exact: true }).fill('Test category');
  await adminPage.getByLabel('Description', { exact: true }).fill('Test description');
  await adminPage.getByRole('button', { name: 'Save book', exact: true }).click();
  await adminPage.waitForURL(/\/admin\/books\/\d+\?saved=book/);
  bookId = Number(new URL(adminPage.url()).pathname.split('/').pop());
  title = marker + ' Edited book';
  await adminPage.getByLabel('Title', { exact: true }).fill(title);
  await adminPage.getByRole('button', { name: 'Save book', exact: true }).click();
  await adminPage.getByRole('heading', { name: 'Edit book: ' + title, exact: true }).waitFor();
  const book = (await database.query('SELECT * FROM books WHERE id=$1', [bookId])).rows[0];
  assert.equal(book.title, title);
  assert.equal(book.isbn, isbn);
  assert.equal(book.publication_year, 2020);
  await adminPage.goto(base + '/admin/books/new');
  await adminPage.getByLabel('Title', { exact: true }).fill(marker + ' Duplicate');
  await adminPage.getByLabel('Author', { exact: true }).fill('Test author');
  await adminPage.getByLabel('ISBN', { exact: true }).fill(isbn);
  await adminPage.getByRole('button', { name: 'Save book', exact: true }).click();
  await adminPage.locator('p[role=alert]').filter({ hasText: 'already belongs' }).waitFor();
  await adminPage.goto(base + '/admin/books/' + bookId);
});

test('An admin can add and edit individual copies', async function () {
  let form = adminPage.locator('form').last();
  await form.getByLabel('Inventory number').fill(marker + '-A');
  await form.getByLabel('Location').fill('Shelf A');
  const captured = captureAction(adminPage);
  await form.getByRole('button', { name: 'Add copy', exact: true }).click();
  copyRequest = await captured;
  await adminPage.getByRole('heading', { name: 'Copy: ' + marker + '-A', exact: true }).waitFor();
  const section = adminPage.locator('section').first();
  await section.getByLabel('Location').fill('Shelf A2');
  const savedCopy = adminPage.waitForResponse(response => response.request().method() === 'POST' && Boolean(response.request().headers()['next-action']));
  await section.getByRole('button', { name: 'Save copy', exact: true }).click();
  await savedCopy;
  await adminPage.reload();
  form = adminPage.locator('form').last();
  await form.getByLabel('Inventory number').fill(marker + '-B');
  await form.getByLabel('Location').fill('Shelf B');
  await form.getByRole('button', { name: 'Add copy', exact: true }).click();
  await adminPage.getByRole('heading', { name: 'Copy: ' + marker + '-B', exact: true }).waitFor();
  const result = await database.query('SELECT * FROM copies WHERE book_id=$1 ORDER BY inventory_number', [bookId]);
  assert.equal(result.rows.length, 2);
  assert.equal(result.rows[0].location, 'Shelf A2');
  copyA = result.rows[0].id;
  copyB = result.rows[1].id;
  form = adminPage.locator('form').last();
  await form.getByLabel('Inventory number').fill(marker + '-A');
  await form.getByLabel('Location').fill('Duplicate location');
  await form.getByRole('button', { name: 'Add copy', exact: true }).click();
  await form.locator('p[role=alert]').filter({ hasText: 'already in use' }).waitFor();
  assert.equal((await database.query('SELECT COUNT(*)::integer AS count FROM copies WHERE book_id=$1', [bookId])).rows[0].count, 2);
});

test('Title, author and formatted ISBN search find the saved book', async function () {
  for (const term of [title.toUpperCase(), "O'CONNOR", isbn.slice(0,3) + '-' + isbn.slice(3)]) {
    await userPage.goto(base + '/books?q=' + encodeURIComponent(term));
    const row = userPage.getByRole('row').filter({ hasText: title });
    assert.equal(await row.count(), 1);
    assert.ok((await row.innerText()).includes('2 of 2'));
  }
  await userPage.getByRole('link', { name: title, exact: true }).click();
  await userPage.getByRole('heading', { name: title, exact: true }).waitFor();
  assert.equal(await userPage.getByRole('button', { name: 'Borrow for 30 days', exact: true }).count(), 2);
});

test('User management rejects invalid email and preserves password hashes on edit', async function () {
  await adminPage.goto(base + '/admin/users/new');
  await adminPage.locator('form').evaluate(form => { form.noValidate = true; });
  await adminPage.getByLabel('Name', { exact: true }).fill(marker + ' Extra');
  await adminPage.getByLabel('Email', { exact: true }).fill(marker + '..extra@example.test');
  await adminPage.getByLabel('Initial password (12 to 128 characters)').fill(password);
  const invalid = captureAction(adminPage);
  await adminPage.getByRole('button', { name: 'Create user', exact: true }).click();
  userRequest = await invalid;
  await adminPage.locator('p[role=alert]').filter({ hasText: 'valid email' }).waitFor();
  assert.equal(await adminPage.getByLabel('Initial password (12 to 128 characters)').inputValue(), '');
  await adminPage.getByLabel('Email', { exact: true }).fill(extraEmail);
  await adminPage.getByLabel('Initial password (12 to 128 characters)').fill(password);
  await adminPage.getByRole('button', { name: 'Create user', exact: true }).click();
  await adminPage.waitForURL(/\/admin\/users\/\d+\?saved=yes/);
  const id = Number(new URL(adminPage.url()).pathname.split('/').pop());
  const oldHash = (await database.query('SELECT password_hash FROM auth_accounts WHERE user_id=$1', [id])).rows[0].password_hash;
  await adminPage.getByLabel('Name', { exact: true }).fill(marker + ' Extra edited');
  await adminPage.getByRole('button', { name: 'Save user', exact: true }).click();
  await adminPage.getByRole('heading', { name: 'Edit user: ' + marker + ' Extra edited', exact: true }).waitFor();
  assert.equal((await database.query('SELECT password_hash FROM auth_accounts WHERE user_id=$1', [id])).rows[0].password_hash, oldHash);
  const page = await extra.newPage();
  await login(page, extraEmail);
  const response = await extra.request.post(base + '/api/auth/update-user', { headers: { Origin: base }, data: { role: 'admin', name: '   ' } });
  assert.equal(response.status(), 404);
  assert.equal((await database.query('SELECT role FROM users WHERE id=$1', [id])).rows[0].role, 'user');
  await adminPage.getByLabel('Role', { exact: true }).selectOption('admin');
  let saved = adminPage.waitForResponse(response => response.request().method() === 'POST' && Boolean(response.request().headers()['next-action']));
  await adminPage.getByRole('button', { name: 'Save user', exact: true }).click();
  await saved;
  assert.equal((await extra.request.get(base + '/admin', { maxRedirects: 0 })).headers().location, '/login');
  await login(page, extraEmail);
  assert.equal((await extra.request.get(base + '/admin')).status(), 200);
  await adminPage.reload();
  await adminPage.getByLabel('Role', { exact: true }).selectOption('user');
  saved = adminPage.waitForResponse(response => response.request().method() === 'POST' && Boolean(response.request().headers()['next-action']));
  await adminPage.getByRole('button', { name: 'Save user', exact: true }).click();
  await saved;
  assert.equal((await extra.request.get(base + '/admin', { maxRedirects: 0 })).headers().location, '/login');
  await login(page, extraEmail);
  assert.equal((await extra.request.get(base + '/admin', { maxRedirects: 0 })).headers().location, '/forbidden');
  await adminPage.goto(base + '/admin/users/' + adminId);
  await adminPage.locator('input[name=role]').evaluate(input => { input.value = 'user'; });
  await adminPage.getByRole('button', { name: 'Save user', exact: true }).click();
  await adminPage.locator('p[role=alert]').filter({ hasText: 'cannot remove your own' }).waitFor();
  assert.equal((await database.query('SELECT role FROM users WHERE id=$1', [adminId])).rows[0].role, 'admin');
});

test('Direct management actions also enforce user roles', async function () {
  for (const request of [bookRequest, copyRequest, userRequest]) {
    assert.ok((await replay(user, request)).headers()['x-action-redirect']?.includes('/forbidden'));
    assert.ok((await replay(guest, request)).headers()['x-action-redirect']?.includes('/login'));
  }
});

test('Borrowing saves the session user and a 30-day deadline', async function () {
  await userPage.goto(base + '/books/' + bookId);
  const captured = captureAction(userPage);
  await userPage.getByRole('row').filter({ hasText: marker + '-A' }).getByRole('button', { name: 'Borrow for 30 days', exact: true }).click();
  borrowRequest = await captured;
  await userPage.waitForURL(base + '/loans?borrowed=yes');
  originalLoan = (await database.query('SELECT * FROM loans WHERE copy_id=$1 AND returned_at IS NULL', [copyA])).rows[0];
  firstLoan = originalLoan.id;
  assert.equal(originalLoan.user_id, userId);
  assert.equal(originalLoan.due_at.getTime() - originalLoan.borrowed_at.getTime(), 30 * 86400000);
  assert.ok(Math.abs(Date.now() - originalLoan.borrowed_at.getTime()) < 60000);
  assert.ok((await (await replay(user, borrowRequest)).text()).includes('already on loan'));
  assert.ok((await replay(guest, borrowRequest)).headers()['x-action-redirect']?.includes('/login'));
  const response = await admin.request.get(base + '/loans?user_id=' + userId);
  assert.ok(!(await response.text()).includes(marker + '-A'));
});

test('Only an admin can return a loan and its history is retained', async function () {
  await adminPage.goto(base + '/admin/loans');
  const captured = captureAction(adminPage);
  await adminPage.getByRole('row').filter({ hasText: marker + '-A' }).getByRole('button', { name: 'Record return', exact: true }).click();
  returnRequest = await captured;
  await adminPage.waitForURL(base + '/admin/loans?returned=yes');
  const returned = (await database.query('SELECT * FROM loans WHERE id=$1', [firstLoan])).rows[0];
  assert.ok(returned.returned_at instanceof Date);
  assert.equal(returned.borrowed_at.toISOString(), originalLoan.borrowed_at.toISOString());
  assert.equal(returned.due_at.toISOString(), originalLoan.due_at.toISOString());
  assert.ok((await replay(user, returnRequest)).headers()['x-action-redirect']?.includes('/forbidden'));
  assert.ok((await replay(guest, returnRequest)).headers()['x-action-redirect']?.includes('/login'));
  assert.ok((await (await replay(admin, returnRequest)).text()).includes('already been returned'));
  assert.equal((await database.query('SELECT returned_at FROM loans WHERE id=$1', [firstLoan])).rows[0].returned_at.toISOString(), returned.returned_at.toISOString());
});

test('Two simultaneous borrowers cannot get the same copy', async function () {
  const lock = await database.connect();
  let requests;
  try {
    await lock.query('BEGIN');
    await lock.query('SELECT id FROM copies WHERE id=$1 FOR UPDATE', [copyA]);
    requests = [replay(user, borrowRequest), replay(admin, borrowRequest)];
    await new Promise(resolve => setTimeout(resolve, 250));
    await lock.query('COMMIT');
  } finally {
    await lock.query('ROLLBACK');
    lock.release();
  }
  const results = await Promise.all(requests);
  assert.equal(results.filter(response => response.headers()['x-action-redirect']?.includes('/loans?borrowed=yes')).length, 1);
  const bodies = await Promise.all(results.map(response => response.text()));
  assert.equal(bodies.filter(body => body.includes('already on loan')).length, 1);
  assert.equal((await database.query('SELECT COUNT(*)::integer AS count FROM loans WHERE copy_id=$1 AND returned_at IS NULL', [copyA])).rows[0].count, 1);
  await replay(admin, returnRequest);
  assert.equal((await database.query('SELECT COUNT(*)::integer AS count FROM loans WHERE copy_id=$1 AND returned_at IS NULL', [copyA])).rows[0].count, 1);
});

test('Overdue views and personal history update after a return', async function () {
  await userPage.goto(base + '/books/' + bookId);
  await userPage.getByRole('row').filter({ hasText: marker + '-B' }).getByRole('button', { name: 'Borrow for 30 days', exact: true }).click();
  await userPage.waitForURL(base + '/loans?borrowed=yes');
  // Change only this test loan to simulate a passed deadline without waiting 30 days.
  await database.query("UPDATE loans SET borrowed_at=now()-interval '40 days', due_at=now()-interval '10 days' WHERE copy_id=$1 AND returned_at IS NULL", [copyB]);
  await userPage.goto(base + '/loans?view=overdue');
  assert.equal(await userPage.getByRole('row').filter({ hasText: marker + '-B' }).count(), 1);
  await adminPage.goto(base + '/admin/loans?view=overdue');
  await adminPage.getByRole('row').filter({ hasText: marker + '-B' }).getByRole('button', { name: 'Record return', exact: true }).click();
  await adminPage.waitForURL(base + '/admin/loans?returned=yes');
  await userPage.goto(base + '/loans?view=overdue');
  assert.equal(await userPage.getByRole('row').filter({ hasText: marker + '-B' }).count(), 0);
  await userPage.goto(base + '/loans?view=history&user_id=' + adminId);
  const row = userPage.getByRole('row').filter({ hasText: marker + '-B' });
  assert.equal(await row.getByRole('cell', { name: 'Returned', exact: true }).count(), 1);
  assert.equal(await row.locator('time').count(), 3);
});

test('Database rules reject duplicate active loans and invalid dates', async function () {
  await assert.rejects(database.query("INSERT INTO loans(user_id,copy_id,due_at) VALUES($1,$2,now()+interval '30 days')", [userId,copyA]), error => error.code === '23505');
  await assert.rejects(database.query("INSERT INTO loans(user_id,copy_id,due_at) VALUES($1,$2,now()-interval '1 day')", [userId,copyB]), error => error.code === '23514');
  await assert.rejects(database.query("INSERT INTO loans(user_id,copy_id,due_at) VALUES($1,0,now()+interval '30 days')", [userId]), error => error.code === '23503');
});

test('Invalid sessions and logout block access; existing data remains unchanged', async function () {
  const cookies = await user.cookies();
  const changedCookie = cookies.map(cookie => cookie.name + '=' + cookie.value + (cookie.name.endsWith('session_token') ? 'x' : '')).join('; ');
  const invalidSession = await user.request.get(base + '/api/auth/get-session', { headers: { Cookie: changedCookie } });
  assert.equal(await invalidSession.json(), null);
  // Expire only the session of this run's new test user.
  await database.query("UPDATE auth_sessions SET expires_at=now()-interval '1 minute' WHERE user_id=$1", [userId]);
  assert.equal((await user.request.get(base + '/loans', { maxRedirects: 0 })).headers().location, '/login');
  for (const context of [admin,user,extra]) {
    const oldCookie = (await context.cookies()).map(cookie => cookie.name + '=' + cookie.value).join('; ');
    assert.equal((await context.request.post(base + '/api/auth/sign-out', { headers: { Origin: base }, data: {} })).status(), 200);
    assert.equal((await context.request.get(base + '/loans', { headers: { Cookie: oldCookie }, maxRedirects: 0 })).headers().location, '/login');
  }
  assert.deepEqual(await snapshot(), originalData);
  assert.deepEqual(browserErrors, []);
});
