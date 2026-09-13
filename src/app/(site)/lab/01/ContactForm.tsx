'use client';

import {useState} from 'react';

import styles from './page.module.css';

export default function ContactForm() {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className={styles.formDone} role="status">
        <p>Message sent.</p>
        <p>I&apos;ll reply within a day, usually sooner.</p>
      </div>
    );
  }

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
      <div className={styles.formRow}>
        <label htmlFor="name">Name</label>
        <input id="name" name="name" type="text" required autoComplete="name" />
      </div>
      <div className={styles.formRow}>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className={styles.formRow}>
        <label htmlFor="phone">Phone (optional)</label>
        <input id="phone" name="phone" type="tel" autoComplete="tel" />
      </div>
      <div className={styles.formRow}>
        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          name="message"
          rows={4}
          placeholder="e.g. Interested in the Bishan condo, need to sell my current flat first."
          required
        />
      </div>
      <button type="submit" className={styles.formSubmit}>
        Send message
      </button>
    </form>
  );
}
