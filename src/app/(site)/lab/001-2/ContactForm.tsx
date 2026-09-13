'use client';

import {useState} from 'react';

import styles from './page.module.css';

export default function ContactForm() {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className={styles.formDone} role="status">
        <p>Thanks — that&apos;s through.</p>
        <p>Ivy usually replies within a few hours on weekdays.</p>
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
      <div className={styles.formGrid}>
        <div className={styles.formRow}>
          <label htmlFor="name">Name</label>
          <input id="name" name="name" type="text" required autoComplete="name" />
        </div>
        <div className={styles.formRow}>
          <label htmlFor="phone">Phone / WhatsApp</label>
          <input id="phone" name="phone" type="tel" required autoComplete="tel" />
        </div>
      </div>
      <div className={styles.formRow}>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className={styles.formRow}>
        <label htmlFor="intent">What are you trying to do?</label>
        <select id="intent" name="intent" defaultValue="">
          <option value="" disabled>
            Choose one
          </option>
          <option value="buy-first">Buy my first home</option>
          <option value="upgrade">Upgrade or move house</option>
          <option value="invest">Invest in a second property</option>
          <option value="explore">Just exploring, no timeline yet</option>
        </select>
      </div>
      <div className={styles.formRow}>
        <label htmlFor="message">Anything specific?</label>
        <textarea
          id="message"
          name="message"
          rows={4}
          placeholder="e.g. Looking near Queenstown, need 3 bedrooms, budget around $1.3m."
        />
      </div>
      <button type="submit" className={styles.formSubmit}>
        Get in touch
      </button>
      <p className={styles.formNote}>No spam, no auto-dialler. Ivy reads these herself.</p>
    </form>
  );
}
