"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { Filter, LayoutGrid, List } from "lucide-react";
import { toast } from "sonner";

import { ReminderCard } from "@/components/reminders/reminder-card";
import { RemindersGridSkeleton, RemindersListSkeleton } from "@/components/skeletons";
import { RemindersFilters } from "@/components/reminders/reminders-filters";
import { RemindersInfiniteSentinel } from "@/components/reminders/reminders-infinite-sentinel";
import { RemindersListPagination } from "@/components/reminders/reminders-list-pagination";
import { RemindersTable } from "@/components/reminders/reminders-table";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePersistedState } from "@/hooks/use-persisted-state";
import { getRemindersPageAction } from "@/app/actions/reminders";
import type { ReminderListScope } from "@/lib/reminders/reminder-list-params";
import {
  getReminderListSearchTerm,
  REMINDERS_PAGE_SIZE_GRID,
  REMINDERS_PAGE_SIZE_LIST,
} from "@/lib/reminders/reminder-list-params";
import {
  invalidateRemindersQueries,
  remindersListQueryOptions,
  remindersQueryKeys,
  type RemindersQueryFilters,
} from "@/lib/reminders/reminders-query-keys";
import {
  DEFAULT_HISTORY_FILTERS,
  DEFAULT_REMINDERS_FILTERS,
  hasActiveHistoryFilters,
  hasActiveRemindersFilters,
  parseHistoryFilters,
  parseRemindersFilters,
  parseRemindersViewMode,
  HISTORY_FILTERS_STORAGE_KEY,
  HISTORY_VIEW_STORAGE_KEY,
  REMINDERS_FILTERS_STORAGE_KEY,
  REMINDERS_VIEW_STORAGE_KEY,
  serializeRemindersViewMode,
  type HistoryFiltersState,
  type RemindersFiltersState,
  type RemindersViewMode,
} from "@/lib/storage/reminders-preferences";
import { cn } from "@/lib/utils";

function RemindersViewToggle({
  view,
  onViewChange,
  className,
}: {
  view: RemindersViewMode;
  onViewChange: (mode: RemindersViewMode) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-1 rounded-lg border border-border/70 bg-zinc-100 p-0.5 dark:bg-muted/20",
        className,
      )}
    >
      <Button
        type="button"
        variant={view === "grid" ? "default" : "ghost"}
        size="sm"
        className="h-9 gap-1.5 px-2.5"
        onClick={() => onViewChange("grid")}
        aria-pressed={view === "grid"}
      >
        <LayoutGrid className="size-4" />
        <span className="hidden sm:inline">Grade</span>
      </Button>
      <Button
        type="button"
        variant={view === "list" ? "default" : "ghost"}
        size="sm"
        className="h-9 gap-1.5 px-2.5"
        onClick={() => onViewChange("list")}
        aria-pressed={view === "list"}
      >
        <List className="size-4" />
        <span className="hidden sm:inline">Lista</span>
      </Button>
    </div>
  );
}

type RemindersViewProps = {
  scope: ReminderListScope;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function RemindersView({
  scope,
  emptyTitle = "Nenhum lembrete encontrado",
  emptyDescription = "Ajuste os filtros ou crie um novo lembrete.",
}: RemindersViewProps) {
  const queryClient = useQueryClient();
  const isMdUp = useMediaQuery("(min-width: 768px)");
  const isHistory = scope === "history";

  const [view, setView] = usePersistedState<RemindersViewMode>(
    isHistory ? HISTORY_VIEW_STORAGE_KEY : REMINDERS_VIEW_STORAGE_KEY,
    "grid",
    {
      serialize: serializeRemindersViewMode,
      deserialize: parseRemindersViewMode,
    },
  );

  const [ongoingFilters, setOngoingFilters] =
    usePersistedState<RemindersFiltersState>(
      REMINDERS_FILTERS_STORAGE_KEY,
      DEFAULT_REMINDERS_FILTERS,
      { deserialize: parseRemindersFilters },
    );

  const [historyFilters, setHistoryFilters] =
    usePersistedState<HistoryFiltersState>(
      HISTORY_FILTERS_STORAGE_KEY,
      DEFAULT_HISTORY_FILTERS,
      { deserialize: parseHistoryFilters },
    );

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [listPage, setListPage] = useState(1);

  const search = isHistory ? historyFilters.search : ongoingFilters.search;
  const status = isHistory ? "todos" : ongoingFilters.status;
  const dateFrom = isHistory ? historyFilters.dateFrom : ongoingFilters.dateFrom;
  const dateTo = isHistory ? historyFilters.dateTo : ongoingFilters.dateTo;

  const debouncedSearch = useDebouncedValue(search, 500);
  const filtersActive = isHistory
    ? hasActiveHistoryFilters(historyFilters)
    : hasActiveRemindersFilters(ongoingFilters);

  const queryFilters: RemindersQueryFilters = useMemo(
    () => ({
      scope,
      search: getReminderListSearchTerm(search, debouncedSearch),
      status,
      dateFrom,
      dateTo,
    }),
    [scope, search, debouncedSearch, status, dateFrom, dateTo],
  );

  const showGrid = !isMdUp || view === "grid";
  const showList = isMdUp && view === "list";

  useEffect(() => {
    setListPage(1);
  }, [queryFilters]);

  const infiniteQuery = useInfiniteQuery({
    queryKey: remindersQueryKeys.infinite(queryFilters),
    queryFn: ({ pageParam }) =>
      getRemindersPageAction({
        ...queryFilters,
        offset: pageParam,
        limit: REMINDERS_PAGE_SIZE_GRID,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, p) => sum + p.items.length, 0);
      return loaded < lastPage.total ? loaded : undefined;
    },
    enabled: showGrid,
    ...remindersListQueryOptions,
  });

  const listQuery = useQuery({
    queryKey: remindersQueryKeys.listPage(queryFilters, listPage),
    queryFn: () =>
      getRemindersPageAction({
        ...queryFilters,
        offset: (listPage - 1) * REMINDERS_PAGE_SIZE_LIST,
        limit: REMINDERS_PAGE_SIZE_LIST,
      }),
    enabled: showList,
    ...remindersListQueryOptions,
  });

  const activeQuery = showList ? listQuery : infiniteQuery;
  const total = showList
    ? (listQuery.data?.total ?? 0)
    : (infiniteQuery.data?.pages[0]?.total ?? 0);

  const gridItems = useMemo(
    () => infiniteQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [infiniteQuery.data],
  );

  const listItems = listQuery.data?.items ?? [];

  useEffect(() => {
    if (activeQuery.isError) {
      toast.error(
        activeQuery.error instanceof Error
          ? activeQuery.error.message
          : "Erro ao carregar lembretes.",
      );
    }
  }, [activeQuery.isError, activeQuery.error]);

  const loadMore = useCallback(() => {
    if (
      infiniteQuery.hasNextPage &&
      !infiniteQuery.isFetchingNextPage &&
      !infiniteQuery.isFetching
    ) {
      void infiniteQuery.fetchNextPage();
    }
  }, [infiniteQuery]);

  const countLabel = (
    <>
      {showList
        ? listItems.length
        : gridItems.length}{" "}
      de {total} lembrete
      {total === 1 ? "" : "s"}
    </>
  );

  function updateSearch(value: string) {
    if (isHistory) {
      setHistoryFilters((prev) => ({ ...prev, search: value }));
    } else {
      setOngoingFilters((prev) => ({ ...prev, search: value }));
    }
  }

  function updateStatus(value: RemindersFiltersState["status"]) {
    setOngoingFilters((prev) => ({ ...prev, status: value }));
  }

  function updateDateFrom(value: string) {
    if (isHistory) {
      setHistoryFilters((prev) => ({ ...prev, dateFrom: value }));
    } else {
      setOngoingFilters((prev) => ({ ...prev, dateFrom: value }));
    }
  }

  function updateDateTo(value: string) {
    if (isHistory) {
      setHistoryFilters((prev) => ({ ...prev, dateTo: value }));
    } else {
      setOngoingFilters((prev) => ({ ...prev, dateTo: value }));
    }
  }

  async function clearFilters() {
    if (isHistory) {
      setHistoryFilters(DEFAULT_HISTORY_FILTERS);
    } else {
      setOngoingFilters(DEFAULT_REMINDERS_FILTERS);
    }
    setListPage(1);
    setFiltersOpen(false);
    await invalidateRemindersQueries(queryClient);
  }

  const filterFields = (
    <RemindersFilters
      search={search}
      onSearchChange={updateSearch}
      status={status}
      onStatusChange={updateStatus}
      dateFrom={dateFrom}
      onDateFromChange={updateDateFrom}
      dateTo={dateTo}
      onDateToChange={updateDateTo}
      showStatusFilter={!isHistory}
    />
  );

  const displayedItems = showList ? listItems : gridItems;

  const isLoadingData = showList
    ? listQuery.isPending ||
      (listQuery.isFetching && displayedItems.length === 0)
    : infiniteQuery.isPending ||
      (infiniteQuery.isFetching && displayedItems.length === 0);

  const isEmpty = !isLoadingData && displayedItems.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-border/70 bg-white p-3 sm:p-4 dark:bg-card/60">
        <div className="flex items-center justify-between gap-3 md:hidden">
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="relative shrink-0"
                  aria-label="Abrir filtros"
                />
              }
            >
              <Filter className="size-4" />
              {filtersActive ? (
                <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary" />
              ) : null}
            </SheetTrigger>
            <SheetContent
              side="left"
              className="!w-[98vw] !max-w-[98vw] gap-0 p-0 sm:!max-w-[98vw]"
            >
              <SheetHeader className="border-b border-border/70">
                <SheetTitle>Filtros</SheetTitle>
                <SheetDescription>
                  Refine a lista de lembretes exibidos.
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
                <RemindersFilters
                  layout="stacked"
                  search={search}
                  onSearchChange={updateSearch}
                  status={status}
                  onStatusChange={updateStatus}
                  dateFrom={dateFrom}
                  onDateFromChange={updateDateFrom}
                  dateTo={dateTo}
                  onDateToChange={updateDateTo}
                  showStatusFilter={!isHistory}
                />
                {filtersActive ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void clearFilters()}
                  >
                    Limpar filtros
                  </Button>
                ) : null}
              </div>
            </SheetContent>
          </Sheet>
          <p className="text-xs text-muted-foreground">{countLabel}</p>
        </div>

        <div className="hidden md:block">
          {filterFields}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">{countLabel}</p>
            {filtersActive ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => void clearFilters()}
              >
                Limpar filtros
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="hidden items-center justify-end md:flex">
        <RemindersViewToggle view={view} onViewChange={setView} />
      </div>

      {isLoadingData ? (
        <RemindersGridSkeleton count={6} />
      ) : isEmpty ? (
        <div className="rounded-lg border border-dashed border-border/80 bg-muted/10 px-6 py-12 text-center">
          <p className="text-sm font-medium text-foreground">{emptyTitle}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {emptyDescription}
          </p>
        </div>
      ) : (
        <>
          {showGrid ? (
            <div
              className={cn(
                "grid gap-4 sm:grid-cols-2 xl:grid-cols-3",
                showList && "md:hidden",
              )}
            >
              {gridItems.map((reminder) => (
                <ReminderCard key={reminder.id} reminder={reminder} />
              ))}
            </div>
          ) : null}

          {showList ? (
            <div className="hidden md:block">
              <RemindersTable reminders={listItems} />
              <RemindersListPagination
                page={listPage}
                pageSize={REMINDERS_PAGE_SIZE_LIST}
                total={total}
                onPageChange={setListPage}
              />
            </div>
          ) : null}

          {showGrid ? (
            <RemindersInfiniteSentinel
              hasMore={Boolean(infiniteQuery.hasNextPage)}
              isLoading={infiniteQuery.isFetchingNextPage}
              onVisible={loadMore}
            />
          ) : null}
        </>
      )}

      {activeQuery.isFetching && !isLoadingData && showList ? (
        <RemindersListSkeleton rows={3} />
      ) : null}
    </div>
  );
}
