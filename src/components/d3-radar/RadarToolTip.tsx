import React from 'react';
import styles from './radar-styles.module.css';
import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { radarTooltipCopy, radarTooltipLabels } from '@/lib/radar/viewModel';

const RadarTooltip = ({ tooltipData, onEditClick }: { tooltipData: any, onEditClick: (item: any) => void}) => {
  if (!tooltipData?.item) return null;

  const { item } = tooltipData;
  const { name, raw, type, zoom_in } = item;
  const { category, impact, risk, distance } = raw;

  return (
    <div 
      className={styles.tooltip}
    >
      <div className={styles.row}>
        <span className={styles.label}>{radarTooltipLabels.title}</span>
        <span className={styles.value}>{name}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>{radarTooltipLabels.type}</span>
        <span className={styles.value}>{type}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>{radarTooltipLabels.category}</span>
        <span className={styles.value}>{category}</span>
      </div>
       <div className={styles.row}>
        <span className={styles.label}>{radarTooltipLabels.distance}</span>
        <span className={styles.value}>{distance}</span>
      </div>
       <div className={styles.row}>
        <span className={styles.label}>{radarTooltipLabels.impact}</span>
        <span className={styles.value}>{impact}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>{radarTooltipLabels.risk}</span>
        <span className={styles.value}>{risk}</span>
      </div>

      {zoom_in ? (
        <div className={styles.row}>
          <span className={styles.label}>{radarTooltipLabels.zoom}</span>
          <Link href={zoom_in.id} 
             className={styles.link}>
            {zoom_in.name}
          </Link>
        </div>
      ) : (
        <div className={`${styles.row} ${styles.mutedText}`}>{radarTooltipCopy.zoomMissing}</div>
      )}

    <button 
    className={styles.editButton} 
    onClick={() => onEditClick(item)}
    title="Edit"
    >
    <Pencil size={16} />
    </button>
    </div>
  );
};

export default RadarTooltip;
