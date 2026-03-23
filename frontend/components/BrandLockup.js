import Link from 'next/link';
import styles from '../styles/brand-ui.module.css';

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function BrandLogo({ size = 'sm', className = '' }) {
  const sizeClass = styles[`size${size[0].toUpperCase()}${size.slice(1)}`];

  return (
    <span className={cx(styles.logoFrame, sizeClass, className)}>
      <span className={styles.logoShell}>
        <img
          src="/bps_logo.png"
          alt=""
          aria-hidden="true"
          className={styles.logoImage}
        />
      </span>
    </span>
  );
}

export default function BrandLockup({
  href = '/',
  name = 'Blue Planet InfoSolutions',
  subtitle = 'AI Interview Room',
  showSubtitle = true,
  theme = 'dark',
  size = 'sm',
  logoOnly = false,
  className = '',
  clickable = true,
}) {
  const sizeClass = styles[`size${size[0].toUpperCase()}${size.slice(1)}`];
  const themeClass = theme === 'light' ? styles.themeLight : styles.themeDark;
  const classes = cx(
    styles.brandLink,
    sizeClass,
    themeClass,
    logoOnly && styles.logoOnly,
    !clickable && styles.staticBrand,
    className
  );

  const content = (
    <>
      <BrandLogo size={size} />
      <span className={styles.brandText}>
        <span className={styles.brandName}>{name}</span>
        {showSubtitle ? <span className={styles.brandSubtitle}>{subtitle}</span> : null}
      </span>
    </>
  );

  if (!clickable) {
    return <div className={classes}>{content}</div>;
  }

  return (
    <Link href={href} className={classes} aria-label="Go to landing page">
      {content}
    </Link>
  );
}
