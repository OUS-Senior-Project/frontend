interface CohortTabsProps {
  cohorts: string[];
  selectedCohort: string | undefined;
  onSelect: (cohort: string) => void;
}

export function CohortTabs({
  cohorts,
  selectedCohort,
  onSelect,
}: CohortTabsProps) {
  if (cohorts.length === 0) {
    return null;
  }

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
