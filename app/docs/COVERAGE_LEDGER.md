# Coverage Ledger

This ledger tracks every runtime source file and its test coverage mapping.

| Path | Area | Tests | Branches/States | Exclusion/Notes |
| --- | --- | --- | --- | --- |
| components/analytics/cohort-summary-table.tsx | analytics | test/components/analytics/cohort-summary-table.test.tsx | cohort tabs, sort asc/desc across columns | |
| components/analytics/date-picker-button.tsx | analytics | test/components/analytics/date-picker-button.test.tsx | onSelect ignores undefined and accepts date | |
| components/analytics/analytics-breakdown-modal.tsx | analytics | test/components/analytics/header-stat-card.test.tsx | modal open, metrics list render | |
| components/analytics/analytics-trend-chart.tsx | analytics | test/components/analytics/charts.test.tsx | forecastData absent vs present (ref line + legend) | |
| components/analytics/forecast-section.tsx | analytics | test/components/analytics/charts.test.tsx | projected growth computed vs zero, insight variants, forecast cards | |
| components/analytics/header.tsx | analytics | test/components/analytics/header-stat-card.test.tsx | static render | |
| components/analytics/major-analytics-charts.tsx | analytics | test/components/analytics/charts.test.tsx | all four analytics chart variants | |
| components/analytics/major-breakdown-chart.tsx | analytics | test/components/analytics/charts.test.tsx | render with major data | |
| components/analytics/migration-sankey.tsx | analytics | test/components/analytics/migration.test.tsx | filter by semester vs all, empty state | |
| components/analytics/migration-table.tsx | analytics | test/components/analytics/migration.test.tsx | selected semester label vs all | |
| components/analytics/school-breakdown-chart.tsx | analytics | test/components/analytics/charts.test.tsx | render with school data | |
| components/analytics/semester-dropdown.tsx | analytics | test/components/analytics/semester-dropdown.test.tsx | maps all to undefined, forwards semester | |
| components/analytics/stat-card.tsx | analytics | test/components/analytics/header-stat-card.test.tsx | change positive/negative/zero/undefined, click/key handlers | |
| components/analytics/student-type-chart.tsx | analytics | test/components/analytics/charts.test.tsx | render with type data | |
| components/theme-provider.tsx | providers | test/components/theme-provider.test.tsx | renders children | |
| components/ui/accordion.tsx | ui | test/components/ui/primitives.test.tsx | trigger/content render | |
| components/ui/alert-dialog.tsx | ui | test/components/ui/primitives.test.tsx | portal/overlay, actions, content | |
| components/ui/alert.tsx | ui | test/components/ui/primitives.test.tsx | title/description | |
| components/ui/aspect-ratio.tsx | ui | test/components/ui/primitives.test.tsx | ratio render | |
| components/ui/avatar.tsx | ui | test/components/ui/primitives.test.tsx | image + fallback | |
| components/ui/badge.tsx | ui | test/components/ui/variants.test.tsx | variants + asChild | |
| components/ui/breadcrumb.tsx | ui | test/components/ui/variants.test.tsx | asChild link, separators, ellipsis | |
| components/ui/button-group.tsx | ui | test/components/ui/variants.test.tsx | orientation variants, asChild | |
| components/ui/button.tsx | ui | test/components/ui/variants.test.tsx | asChild vs default | |
| components/ui/calendar.tsx | ui | test/components/ui/calendar.test.tsx | caption layouts, day focus on modifier | |
| components/ui/card.tsx | ui | test/components/ui/primitives.test.tsx | header/title/description/action, content/footer | |
| components/ui/carousel.tsx | ui | test/components/ui/carousel.test.tsx | missing provider, orientation branches, keyboard nav, api undefined | |
| components/ui/chart.tsx | ui | test/components/ui/chart.test.tsx | style with/without colors, tooltip/legend branches, payload guard | |
| components/ui/checkbox.tsx | ui | test/components/ui/primitives.test.tsx | checked render | |
| components/ui/collapsible.tsx | ui | test/components/ui/primitives.test.tsx | open state render | |
| components/ui/command.tsx | ui | test/components/ui/primitives.test.tsx | dialog open, empty/list/group branches | |
| components/ui/context-menu.tsx | ui | test/components/ui/menus.test.tsx | portal, items, sub, checked/radio | |
| components/ui/dialog.tsx | ui | test/components/ui/dialog.test.tsx | close button shown/hidden, portal/overlay | |
| components/ui/drawer.tsx | ui | test/components/ui/primitives.test.tsx | portal/overlay, content | |
| components/ui/dropdown-menu.tsx | ui | test/components/ui/menus.test.tsx | destructive/inset, sub, portal/group | |
| components/ui/empty.tsx | ui | test/components/ui/primitives.test.tsx | media variants, header/content | |
| components/ui/field.tsx | ui | test/components/ui/form-field.test.tsx | orientation variants, legend variants, errors, separator | |
| components/ui/form.tsx | ui | test/components/ui/form-field.test.tsx | error/no error, FormMessage null, hook guards | |
| components/ui/hover-card.tsx | ui | test/components/ui/primitives.test.tsx | open content | |
| components/ui/input-group.tsx | ui | test/components/ui/variants.test.tsx | addon focus vs button, input/textarea slots | |
| components/ui/input-otp.tsx | ui | test/components/ui/input-otp.test.tsx | slot active/inactive, caret, separator | |
| components/ui/input.tsx | ui | test/components/ui/primitives.test.tsx | render | |
| components/ui/item.tsx | ui | test/components/ui/variants.test.tsx | asChild, media variants, header/footer, separator | |
| components/ui/kbd.tsx | ui | test/components/ui/primitives.test.tsx | single + group render | |
| components/ui/label.tsx | ui | test/components/ui/primitives.test.tsx | render | |
| components/ui/menubar.tsx | ui | test/components/ui/menus.test.tsx | portal, sub, checkbox/radio | |
| components/ui/navigation-menu.tsx | ui | test/components/ui/menus.test.tsx | viewport true/false, trigger style | |
| components/ui/pagination.tsx | ui | test/components/ui/variants.test.tsx | active/inactive links, prev/next/ellipsis | |
| components/ui/popover.tsx | ui | test/components/ui/primitives.test.tsx | anchor/content | |
| components/ui/progress.tsx | ui | test/components/ui/primitives.test.tsx | value set vs undefined | |
| components/ui/radio-group.tsx | ui | test/components/ui/primitives.test.tsx | default value | |
| components/ui/resizable.tsx | ui | test/components/ui/resizable.test.tsx | handle with/without grip | |
| components/ui/scroll-area.tsx | ui | test/components/ui/primitives.test.tsx | horizontal scrollbar | |
| components/ui/select.tsx | ui | test/components/ui/variants.test.tsx | popper vs item-aligned, scroll buttons, group/label | |
| components/ui/separator.tsx | ui | test/components/ui/primitives.test.tsx | render | |
| components/ui/sheet.tsx | ui | test/components/ui/primitives.test.tsx | side default/top/bottom, close | |
| components/ui/sidebar.tsx | ui | test/components/ui/sidebar.test.tsx | mobile/desktop, controlled/uncontrolled, side right, collapsible variants | |
| components/ui/skeleton.tsx | ui | test/components/ui/primitives.test.tsx | render | |
| components/ui/slider.tsx | ui | test/components/ui/primitives.test.tsx | default/controlled/multi-range | |
| components/ui/sonner.tsx | ui | test/components/ui/toaster.test.tsx | theme undefined vs light | |
| components/ui/spinner.tsx | ui | test/components/ui/primitives.test.tsx | render | |
| components/ui/switch.tsx | ui | test/components/ui/primitives.test.tsx | checked render | |
| components/ui/table.tsx | ui | test/components/ui/primitives.test.tsx | header/body/footer/caption | |
| components/ui/tabs.tsx | ui | test/components/ui/primitives.test.tsx | list/trigger/content | |
| components/ui/textarea.tsx | ui | test/components/ui/primitives.test.tsx | render | |
| components/ui/toast.tsx | ui | test/components/ui/primitives.test.tsx | open toast, action/close | |
| components/ui/toaster.tsx | ui | test/components/ui/toaster.test.tsx | title/description vs empty toast, dismiss | |
| components/ui/toggle-group.tsx | ui | test/components/ui/primitives.test.tsx | type single group + item | |
| components/ui/toggle.tsx | ui | test/components/ui/primitives.test.tsx | pressed state | |
| components/ui/tooltip.tsx | ui | test/components/ui/primitives.test.tsx | provider/trigger/content | |
| components/ui/use-mobile.tsx | ui | test/hooks/use-mobile.test.tsx | matchMedia listeners, resize updates | |
| components/ui/use-toast.ts | ui | test/hooks/use-toast.test.tsx | add/update/dismiss/remove, queue, reducer | |
| hooks/use-mobile.ts | hooks | test/hooks/use-mobile.test.tsx | matchMedia change + cleanup | |
| hooks/use-toast.ts | hooks | test/hooks/use-toast.test.tsx | add/update/dismiss/remove, queue, reducer | |
| lib/analytics-data.ts | lib | test/lib/analytics-data.test.ts | deterministic generation, filters, snapshot fallback, forecast | |
| lib/utils.ts | lib | test/lib/utils.test.ts | cn merges/filters + tailwind merge | |
| src/app/layout.tsx | layout | test/pages/layout.test.tsx | renders children + metadata | |
| src/app/page.tsx | page | test/pages/page.test.tsx | upload state, modal open, growth empty, top major fallback | |
