import { useEffect, useState } from 'react';
import styles from '../styles/landing-showcase.module.css';

const slides = [
  {
    src: '/partner-smartcookie.png',
    alt: 'Smart Cookie - Student-Teacher Reward Program by Protsahan Bharti.',
    badge: 'Partner Spotlight',
    title: 'Smart Cookie – Student-Teacher Rewards.',
    subtitle: 'Encouraging students and teachers with Just in Time Rewards.',
    link: 'https://smartcookie.in/',
  },
  {
    src: '/partner-startupworld.png',
    alt: 'StartupWorld – Technology education and startup incubation platform.',
    badge: 'Partner Spotlight',
    title: 'StartupWorld – Technology & Innovation.',
    subtitle: 'Bridging the gap between academia and industry with tech education.',
    link: 'https://startupworld.in/',
  },
];

const TRANSITION_MS = 800;
const HOLD_MS = 4000;

function preloadSlide(src) {
  return new Promise((resolve) => {
    const image = new window.Image();
    image.onload = resolve;
    image.onerror = resolve;
    image.src = src;
  });
}

export default function LandingVisualCarousel() {
  const [isReady, setIsReady] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [nextSlide, setNextSlide] = useState(null);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all(slides.map((slide) => preloadSlide(slide.src))).then(() => {
      if (!cancelled) setIsReady(true);
    });
    return () => { cancelled = true; };
  }, []);

  const goToSlide = (targetIndex) => {
    if (!isReady || animating || targetIndex === currentSlide) return;
    setNextSlide(targetIndex);
    setAnimating(true);
  };

  // When animating starts, after transition duration, commit the slide change
  useEffect(() => {
    if (!animating || nextSlide === null) return;
    const timer = setTimeout(() => {
      setCurrentSlide(nextSlide);
      setNextSlide(null);
      setAnimating(false);
    }, TRANSITION_MS);
    return () => clearTimeout(timer);
  }, [animating, nextSlide]);

  // Auto-advance
  useEffect(() => {
    if (!isReady || animating) return;
    const timer = setTimeout(() => {
      goToSlide((currentSlide + 1) % slides.length);
    }, HOLD_MS);
    return () => clearTimeout(timer);
  }, [isReady, animating, currentSlide]);

  const displaySlide = slides[animating && nextSlide !== null ? nextSlide : currentSlide];

  const renderSlideImage = (slide, isCurrent) => {
    const img = (
      <img
        className={styles.slideImage}
        src={slide.src}
        alt={isCurrent ? slide.alt : ''}
        draggable="false"
        loading="eager"
        decoding="async"
      />
    );

    if (slide.link) {
      return (
        <a
          href={slide.link}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.slideLink}
          aria-label={`Visit ${slide.alt}`}
        >
          {img}
          <span className={styles.slideLinkOverlay}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Visit Website
          </span>
        </a>
      );
    }

    return img;
  };

  return (
    <div className={styles.showcase} aria-label="Animated interview platform previews">
      <div className={styles.surface}>
        <div className={styles.surfaceGlow} aria-hidden="true" />
        <div className={styles.surfaceHeader} aria-hidden="true">
          <div className={styles.chromeDots}>
            <span className={`${styles.chromeDot} ${styles.chromeRed}`} />
            <span className={`${styles.chromeDot} ${styles.chromeAmber}`} />
            <span className={`${styles.chromeDot} ${styles.chromeGreen}`} />
          </div>
          <div className={styles.surfaceMeta}>
            <span className={styles.surfacePill}>Live Preview</span>
            <span className={styles.surfacePillMuted}>AI Interview Workspace</span>
          </div>
        </div>

        <div className={styles.crossfadeStack}>
          {slides.map((slide, index) => {
            let slideClass = styles.crossfadeHidden;
            let isCurrent = false;

            if (animating) {
              if (index === currentSlide) slideClass = styles.crossfadeOut;
              else if (index === nextSlide) {
                slideClass = styles.crossfadeIn;
                isCurrent = true;
              }
            } else {
              if (index === currentSlide) {
                slideClass = styles.crossfadeVisible;
                isCurrent = true;
              }
            }

            return (
              <div
                key={slide.src}
                className={`${styles.crossfadeSlide} ${slideClass}`}
                aria-hidden={!isCurrent}
              >
                {renderSlideImage(slide, isCurrent)}
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.captionBar}>
        <div className={styles.captionCopy}>
          <span className={styles.captionBadge}>{displaySlide.badge}</span>
          <h3 className={styles.captionTitle}>{displaySlide.title}</h3>
          <p className={styles.captionSubtitle}>{displaySlide.subtitle}</p>
        </div>
        <div className={styles.dots} aria-label="Slide indicators">
          {slides.map((slide, index) => (
            <button
              key={slide.src}
              type="button"
              className={index === currentSlide ? styles.dotActive : styles.dot}
              onClick={() => goToSlide(index)}
              aria-label={`Show slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
