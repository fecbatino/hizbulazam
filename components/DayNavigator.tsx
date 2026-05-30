
import React from 'react';

interface DayNavigatorProps {
  dayName: string;
  onPrev: () => void;
  onNext: () => void;
  onDayNameClick: () => void;
  isRtl?: boolean;
}

const ArrowIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ${className ?? ''}`}>
    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
  </svg>
);

const ChevronDownIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ${className ?? ''}`}>
        <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
    </svg>
);

export const DayNavigator: React.FC<DayNavigatorProps> = ({ dayName, onPrev, onNext, onDayNameClick, isRtl = false }) => {
  const leftHandler = isRtl ? onNext : onPrev;
  const rightHandler = isRtl ? onPrev : onNext;

  return (
    <div className="flex items-center justify-between w-full p-4">
      <button onClick={leftHandler} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-200 text-slate-500 dark:text-slate-400">
        <span className="sr-only">Previous Day</span>
        <ArrowIcon className={isRtl ? 'transform rotate-180' : undefined} />
      </button>
      <button onClick={onDayNameClick} className="flex items-center gap-1 px-4 py-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-200">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-wide">{dayName}</h2>
        <ChevronDownIcon className="text-slate-500 dark:text-slate-400" />
      </button>
      <button onClick={rightHandler} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-200 text-slate-500 dark:text-slate-400">
        <span className="sr-only">Next Day</span>
        <ArrowIcon className={isRtl ? undefined : 'transform rotate-180'} />
      </button>
    </div>
  );
};
