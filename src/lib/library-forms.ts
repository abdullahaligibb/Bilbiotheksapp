export type Book = {
  id: number;
  title: string;
  author: string;
  isbn: string | null;
  publisher: string | null;
  publication_year: number | null;
  category: string | null;
  description: string | null;
};

export type Copy = {
  id: number;
  book_id: number;
  inventory_number: string;
  location: string;
};

export type FormState = {
  error: string;
  values?: Record<string, string>;
};

// Read text only. A form field could also contain a file.
export function readText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

export function validId(id: number) {
  return Number.isInteger(id) && id > 0 && id <= 2147483647;
}

// ISBN-10 and ISBN-13 have a check digit to detect typing mistakes.
export function validIsbn(isbn: string) {
  if (/^\d{13}$/.test(isbn)) {
    if (!isbn.startsWith('978') && !isbn.startsWith('979')) return false;
    let total = 0;
    for (let index = 0; index < 13; index++) {
      const weight = index % 2 === 0 ? 1 : 3;
      total += Number(isbn[index]) * weight;
    }
    return total % 10 === 0;
  }

  if (/^\d{9}[\dX]$/.test(isbn)) {
    let total = 0;
    for (let index = 0; index < 10; index++) {
      const digit = isbn[index] === 'X' ? 10 : Number(isbn[index]);
      total += digit * (10 - index);
    }
    return total % 11 === 0;
  }

  return false;
}
