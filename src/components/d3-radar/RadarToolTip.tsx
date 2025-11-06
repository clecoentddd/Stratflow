import React from 'react';
import styles from './radar-styles.module.css';
import { Pencil } from 'lucide-react';
import Link from 'next/link';

const RadarTooltip = ({ tooltipData, onEditClick }: { tooltipData: any, onEditClick: (item: any) => void}) => {
  if (!tooltipData?.item) return null;

  const { item } = tooltipData;
  const { name, raw, type, zoom_in } = item;
  const { category, impact, tolerance, distance } = raw;

  return (
    <div 
      className={styles.tooltip}
    >
      <div className={styles.row}>
        <span className={styles.label}>Title:</span>
        <span className={styles.value}>{name}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>Type:</span>
        <span className={styles.value}>{type}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>Category:</span>
        <span className={styles.value}>{category}</span>
      </div>
       <div className={styles.row}>
        <span className={styles.label}>Distance:</span>
        <span className={styles.value}>{distance}</span>
      </div>
       <div className={styles.row}>
        <span className={styles.label}>Impact:</span>
        <span className={styles.value}>{impact}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>Tolerance:</span>
        <span className={styles.value}>{tolerance}</span>
      </div>

      {zoom_in ? (
        <div className={styles.row}>
          <span className={styles.label}>Zoom to radar:</span>
          <Link href={zoom_in.id} 
             className={styles.link}>
            {zoom_in.name}
          </Link>
        </div>
      ) : (
        <div className={`${styles.row} ${styles.mutedText}`}>Zoom In Not Selected</div>
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
