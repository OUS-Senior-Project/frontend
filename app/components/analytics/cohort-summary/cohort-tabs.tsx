import { cohorts } from '@/fixtures/analytics';

interface CohortTabsProps {
  selectedCohort: string;
  onSelect: (cohort: string) => void;
}

export function CohortTabs({ selectedCohort, onSelect }: CohortTabsProps) {
  return (
    <div
      className="mt-3 flex gap-1 rounded-lg bg-secondary p-1"
      role="tablist"
      aria-label="Select FTIC cohort"
    >
      {cohorts.map((cohort) => (
        <button
          key={cohort}
          role="tab"
          aria-selected={selectedCohort === cohort}
          onClick={() => onSelect(cohort)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            selectedCohort === cohort
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {cohort}
        </button>
      ))}
    </div>
  );
}
