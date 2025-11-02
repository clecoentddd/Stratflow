"use client";

import React from 'react';
import Link from 'next/link';
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

  const stepNode = (num: number, key: StepKey, title: string, href: string) => {
    const isActive = active === key;
    // per-step active/inactive classes (e.g. purposeActive, purposeInactive)
    const circleStateClass = isActive ? styles[`${key}Active`] : styles[`${key}Inactive`];
    const titleStateClass = isActive ? styles[`${key}ActiveTitle`] : '';

    return (
      <Link href={href} key={key} className={styles.link}>
        <div className={styles.step}>
          <div className={`${styles.circle} ${circleStateClass}`}>{num}</div>
          <div className={`${styles.title} ${titleStateClass}`}>{title}</div>
        </div>
      </Link>
    );
  };

  const connectorNode = (leftKey: StepKey, rightKey: StepKey) => {
    const leftIndex = keys.indexOf(leftKey);
    const activeIndex = keys.indexOf(active);
    const filled = activeIndex > leftIndex;
    // choose connector fill class based on leftKey when filled
    const connectorFillClass = filled ? styles[`connector${leftKey.charAt(0).toUpperCase() + leftKey.slice(1)}Filled`] : '';
    return <div className={`${styles.connector} ${connectorFillClass}`} />;
  };

  return (
    <div className={styles.container}>
      {stepNode(1, 'purpose', 'Purpose', `/team/${teamId}/purpose${q}`)}
      {connectorNode('purpose', 'radar')}
      {stepNode(2, 'radar', 'Detect, Assess & Respond', `/team/${teamId}/radar${q}`)}
      {connectorNode('radar', 'dashboard')}
      {stepNode(3, 'dashboard', 'Strategize', `/team/${teamId}/dashboard${q}`)}
    </div>
  );
}
