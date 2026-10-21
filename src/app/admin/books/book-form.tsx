'use client';

import { useActionState } from 'react';
import { saveBook } from './actions';
import type { Book, FormState } from '@/lib/library-forms';

export default function BookForm({ book }: { book?: Book }) {
  const action = saveBook.bind(null, book?.id ?? null);
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, { error: '' });

  // After an error, keep the submitted text so it can be corrected.
  const values = state.values ?? {
    title: book?.title ?? '', author: book?.author ?? '', isbn: book?.isbn ?? '',
    publisher: book?.publisher ?? '', publication_year: String(book?.publication_year ?? ''),
    category: book?.category ?? '', description: book?.description ?? '',
  };

  return (
    <form action={formAction}>
      <p>Title and author are required. The other book fields are optional.</p>
      <p><label htmlFor="title">Title</label><br /><input id="title" name="title" required maxLength={300} defaultValue={values.title} /></p>
      <p><label htmlFor="author">Author</label><br /><input id="author" name="author" required maxLength={300} defaultValue={values.author} /></p>
      <p><label htmlFor="isbn">ISBN</label><br /><input id="isbn" name="isbn" maxLength={32} defaultValue={values.isbn} /></p>
      <p><label htmlFor="publisher">Publisher</label><br /><input id="publisher" name="publisher" maxLength={300} defaultValue={values.publisher} /></p>
      <p><label htmlFor="publication_year">Publication year</label><br /><input id="publication_year" name="publication_year" type="number" min={1} max={9999} step={1} defaultValue={values.publication_year} /></p>
      <p><label htmlFor="category">Category</label><br /><input id="category" name="category" maxLength={100} defaultValue={values.category} /></p>
      <p><label htmlFor="description">Description</label><br /><textarea id="description" name="description" maxLength={5000} rows={4} defaultValue={values.description} /></p>
      {state.error && <p role="alert">{state.error}</p>}
      <button disabled={pending}>{pending ? 'Saving...' : 'Save book'}</button>
    </form>
  );
}
