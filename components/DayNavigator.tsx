import React from 'react';

interface DayNavigatorProps {
  dayName: string;
  dayNameAr?: string;
  onPrev: () => void;
  onNext: () => void;
  onDayNameClick: () => void;
  isRtl?: boolean;
  currentDayIndex: number;
  totalDays: number;
}

const arrowStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: '50%',
  border: '1px solid var(--hza-border)',
  background: 'transparent',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: 'var(--hza-muted)',
  fontSize: 20,
  lineHeight: 1,
  flexShrink: 0,
};

export const DayNavigator: React.FC<DayNavigatorProps> = ({
  dayName,
  dayNameAr,
  onPrev,
  onNext,
  onDayNameClick,
  isRtl = false,
  currentDayIndex,
  totalDays,
}) => {
  const leftHandler = isRtl ? onNext : onPrev;
  const rightHandler = isRtl ? onPrev : onNext;

  return (
    <div style={{ background: 'var(--hza-card)', borderBottom: '1px solid var(--hza-border)', padding: '14px 16px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button onClick={leftHandler} style={arrowStyle} aria-label="Previous Day">
          {isRtl ? '›' : '‹'}
        </button>

        <button
          onClick={onDayNameClick}
          style={{ textAlign: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 12px', borderRadius: 8 }}
        >
          <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, fontSize: 18, color: 'var(--hza-text)', lineHeight: 1.2 }}>
            {dayName}
          </div>
          {dayNameAr && (
            <div style={{ fontFamily: "'Amiri', serif", fontSize: 14, color: 'var(--hza-gold)', direction: 'rtl', lineHeight: 1.6 }}>
              {dayNameAr}
            </div>
          )}
        </button>

        <button onClick={rightHandler} style={arrowStyle} aria-label="Next Day">
          {isRtl ? '‹' : '›'}
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
        {Array.from({ length: totalDays }, (_, i) => (
          <div
            key={i}
            style={{
              height: 6,
              width: i === currentDayIndex ? 14 : 6,
              borderRadius: i === currentDayIndex ? 3 : '50%',
              background: i === currentDayIndex ? 'var(--hza-green)' : 'var(--hza-border)',
              transition: 'all 0.2s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
};
