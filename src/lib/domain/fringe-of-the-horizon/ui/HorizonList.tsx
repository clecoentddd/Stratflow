import React from 'react';
import styles from './HorizonList.module.css';
import type { FringeItem } from '@/lib/domain/fringe-of-the-horizon/projection';

export default function HorizonList({ items }: { items: FringeItem[] }) {
  return (
    <main className={styles.container}>
      <h1 className={styles.title}>Fringe of the Horizon</h1>
      <p className={styles.subtitle}>Last {items.length} created radar items</p>

      <section className={styles.cards}>
        {items.map((i) => {
          const shadeIdx = Math.min(5, Math.max(0, i.teamLevel));
          const shadeClass = (styles as Record<string, string>)[`levelShade${shadeIdx}`] || '';
          return (
            <article key={i.id} className={`${styles.card} ${shadeClass}`}>
              <header className={styles.cardHeader}>
                <div>
                  <div className={styles.cardTitle}>{i.name}</div>
                  <div className={styles.cardMeta}>{i.teamName}</div>
                </div>
                <div className={styles.metaRow}>
                  <span className={`${styles.badge} ${styles.levelBadge}`}>Level {i.teamLevel}</span>
                  <span className={`${styles.badge} ${styles.categoryBadge}`}>{i.category}</span>
                </div>
              </header>

              <p className={`${styles.detect} ${styles.detectClamp}`}>{i.detect || '-'}</p>

              <details className={styles.details}>
                <summary className={styles.expandBtn}>
                  <svg className={styles.summaryIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                  <span className={styles.srOnly}>Details</span>
                </summary>
                <div className={styles.detailBlock}>
                  <div className={styles.detailLabel}>Created</div>
                  <div>{new Date(i.created_at).toLocaleString()}</div>
                </div>
                <div className={styles.detailBlock}>
                  <div className={styles.detailLabel}>Detect</div>
                  <div>{i.detect || '-'}</div>
                </div>
                <div className={styles.detailBlock}>
                  <div className={styles.detailLabel}>Assess</div>
                  <div>{i.assess || '-'}</div>
                </div>
                <div className={styles.detailBlock}>
                  <div className={styles.detailLabel}>Respond</div>
                  <div>{i.respond || '-'}</div>
                </div>
                <div className={styles.cardBadges}>
                  <span className={`${styles.badge} ${i.type === 'Opportunity' ? styles.typeOpportunity : styles.typeThreat}`}>{i.type}</span>
                  <span className={`${styles.badge} ${styles.pill}`}>{i.distance}</span>
                  <span className={`${styles.badge} ${styles.pill}`}>{i.impact}</span>
                  <span className={`${styles.badge} ${styles.pill}`}>{i.tolerance}</span>
                </div>
              </details>
            </article>
          );
        })}
      </section>
    </main>
  );
}
