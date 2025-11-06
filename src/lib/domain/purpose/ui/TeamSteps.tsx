"use client";

import React from 'react';
import Link from 'next/link';
import { Compass, Radar, TrendingUp } from 'lucide-react';
import styles from './team-steps.module.css';

type StepKey = 'purpose' | 'radar' | 'dashboard';

type Props = {
  teamId: string;
  companyId?: string;
  active: StepKey;
};

export default function TeamSteps({ teamId, companyId = '', active }: Props) {
  const q = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';

  const keys: StepKey[] = ['purpose', 'radar', 'dashboard'];

  const stepConfig = {
    purpose: { icon: Compass, title: 'Purpose', subtitle: 'Define & Align', color: '#9B51E0' },
    radar: { icon: Radar, title: 'Radar', subtitle: 'Detect, Assess & Respond', color: '#00cc88' },
    dashboard: { icon: TrendingUp, title: 'Strategy', subtitle: 'Plan & Execute', color: '#388cfa' }
  };

  const stepNode = (key: StepKey, href: string) => {
    const isActive = active === key;
    const config = stepConfig[key];
    const cardClass = isActive ? styles[`${key}Active`] : styles[`${key}Inactive`];

    return (
      <Link href={href} key={key} className={styles.stepLink}>
        <div className={`${styles.stepCard} ${cardClass}`}>
          <div className={styles.stepIcon}>
            <config.icon size={18} color={isActive ? 'white' : config.color} />
          </div>
          <div className={styles.stepContent}>
            <div className={styles.stepTitle}>{config.title}</div>
            <div className={styles.stepSubtitle}>{config.subtitle}</div>
          </div>
          {isActive && <div className={styles.activeIndicator}></div>}
        </div>
      </Link>
    );
  };

  const connectorNode = (leftKey: StepKey, rightKey: StepKey) => {
    const leftIndex = keys.indexOf(leftKey);
    const activeIndex = keys.indexOf(active);
    const filled = activeIndex > leftIndex;
    
    return (
      <div className={styles.flowArrow}>
        <div className={`${styles.arrowLine} ${filled ? styles.arrowLineFilled : ''}`}></div>
        <div className={`${styles.arrowHead} ${filled ? styles.arrowHeadFilled : ''}`}>→</div>
      </div>
    );
  };

  return (
    <div className={styles.flowContainer}>
      <div className={styles.flowHeader}>
        <h2 className={styles.flowTitle}>Team Workflow · Navigate through the strategic process</h2>
      </div>
      <div className={styles.stepsContainer}>
        {stepNode('purpose', `/team/${teamId}/purpose${q}`)}
        {connectorNode('purpose', 'radar')}
        {stepNode('radar', `/team/${teamId}/radar${q}`)}
        {connectorNode('radar', 'dashboard')}
        {stepNode('dashboard', `/team/${teamId}/dashboard${q}`)}
      </div>
    </div>
  );
}
