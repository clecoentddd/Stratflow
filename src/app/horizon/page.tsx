import { getFringeOfTheHorizonProjection } from '@/lib/domain/fringe-of-the-horizon/projection';
import styles from './horizon.module.css';

type SearchParams = { sort?: 'level-asc' | 'level-desc' };

export default async function HorizonPage({ searchParams }: { searchParams?: SearchParams }) {
  const sort = searchParams?.sort;
  let items = await getFringeOfTheHorizonProjection(20);

  if (sort === 'level-asc') {
    items = items.slice().sort((a, b) => a.teamLevel - b.teamLevel || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } else if (sort === 'level-desc') {
    items = items.slice().sort((a, b) => b.teamLevel - a.teamLevel || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>Fringe of the Horizon</h1>
      <p className={styles.subtitle}>Last 20 created radar items</p>

      <div className={styles.controls}>
        <span>Sort by level:</span>
        <a className={styles.select} href="/horizon?sort=level-desc">High → Low</a>
        <a className={styles.select} href="/horizon?sort=level-asc">Low → High</a>
        <a className={styles.select} href="/horizon">Created (Newest)</a>
      </div>

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
        )})}
      </section>
    </main>
  );
}
