import Link from 'next/link';
import styles from '../styles/brand-ui.module.css';

export default function HomeBackButton() {
  return (
    <Link href="/" className={styles.backButton}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
      <span>Back to Home</span>
    </Link>
  );
}
