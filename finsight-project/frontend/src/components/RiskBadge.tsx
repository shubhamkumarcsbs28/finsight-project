import React from 'react';
import { Severity } from '../types';

interface RiskBadgeProps {
  score: number;
  severity?: Severity;
  reason?: string;
  showScore?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  score,
  severity,
  reason,
  showScore = true,
}) => {
  let computedSeverity: Severity = severity || 'LOW';
  if (!severity) {
    if (score >= 60) computedSeverity = 'HIGH';
    else if (score >= 30) computedSeverity = 'MEDIUM';
    else computedSeverity = 'LOW';
  }

  let badgeClass = 'badge-low';
  let dotColor = '#34d399';

  if (computedSeverity === 'HIGH') {
    badgeClass = 'badge-high';
    dotColor = '#f87171';
  } else if (computedSeverity === 'MEDIUM') {
    badgeClass = 'badge-medium';
    dotColor = '#fbbf24';
  }

  return (
    <div className={`badge ${badgeClass}`} title={reason || `Risk Score: ${score}/100`}>
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: dotColor,
        }}
      />
      <span>{computedSeverity}</span>
      {showScore && <span className="opacity-75 font-mono">({score})</span>}
    </div>
  );
};
