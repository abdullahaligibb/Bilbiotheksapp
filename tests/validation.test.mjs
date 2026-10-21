import test from 'node:test';
import assert from 'node:assert/strict';
import { validId, readText, validIsbn } from '../src/lib/library-forms.ts';
import { validEmail } from '../src/lib/user-forms.ts';

test('IDs accept positive database integers', function () {
  assert.equal(validId(1), true);
  assert.equal(validId(2147483647), true);
});

test('IDs reject zero, negative, fractional and non-number values', function () {
  for (const value of [0, -1, 1.5, 2147483648, NaN, Infinity, '1', null]) {
    assert.equal(validId(value), false);
  }
});

test('Text fields are trimmed', function () {
  const data = new FormData();
  data.set('title', '  A book  ');
  assert.equal(readText(data, 'title'), 'A book');
});

test('Missing text fields and files are not treated as text', function () {
  const data = new FormData();
  data.set('title', new File(['example'], 'example.txt'));
  assert.equal(readText(data, 'title'), '');
  assert.equal(readText(data, 'missing'), '');
});

test('Valid ISBN-10 and ISBN-13 check digits are accepted', function () {
  for (const isbn of ['0306406152', '080442957X', '9780306406157', '9791090636071']) {
    assert.equal(validIsbn(isbn), true, isbn);
  }
});

test('Wrong ISBN check digits and prefixes are rejected', function () {
  for (const isbn of ['0306406153', '9780306406158', '1234567890128']) {
    assert.equal(validIsbn(isbn), false, isbn);
  }
});

test('Incomplete or malformed ISBNs are rejected', function () {
  for (const isbn of ['', '123', 'abcdefghij', '978-0-306-40615-7', '080442957x']) {
    assert.equal(validIsbn(isbn), false, isbn);
  }
});

test('Common login-compatible email formats are accepted', function () {
  for (const email of ['name@example.test', 'name+tag@example.test', "o'connor@example.test", 'NAME@EXAMPLE.TEST', 'first.last@library.example.test']) {
    assert.equal(validEmail(email), true, email);
  }
});

test('Invalid dots in the email name are rejected', function () {
  for (const email of ['.name@example.test', 'name.@example.test', 'a..b@example.test']) {
    assert.equal(validEmail(email), false, email);
  }
});

test('Invalid email domains and missing parts are rejected', function () {
  for (const email of ['', '@example.test', 'name@', 'name@@example.test', 'name@-example.test', 'name@example..test', 'name@example.1', 'name name@example.test']) {
    assert.equal(validEmail(email), false, email);
  }
});

test('Email addresses longer than 254 characters are rejected', function () {
  assert.equal(validEmail('a'.repeat(250) + '@example.test'), false);
});
