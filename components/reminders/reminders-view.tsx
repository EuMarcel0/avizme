"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { Filter, LayoutGrid, List, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { ReminderCard } from "@/components/reminders/reminder-card";
import { RemindersGridSkeleton } from "@/components/skeletons";
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
import { fetchRemindersPage } from "@/lib/reminders/fetch-reminders-page";
import {
  getReminderListSearchTerm,
  REMINDERS_PAGE_SIZE_GRID,
  REMINDERS_PAGE_SIZE_LIST,
} from "@/lib/reminders/reminder-list-params";
import {
  invalidateRemindersQueries,
  remindersQueryKeys,
  type RemindersQueryFilters,
} from "@/lib/reminders/reminders-query-keys";
import {
  DEFAULT_REMINDERS_FILTERS,
  hasActiveRemindersFilters,
  parseRemindersFilters,
  parseRemindersViewMode,
  REMINDERS_FILTERS_STORAGE_KEY,
  REMINDERS_VIEW_STORAGE_KEY,
  serializeRemindersViewMode,
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
        "flex shrink-0 items-center gap-1 rounded-lg border border-border/70 bg-muted/20 p-0.5",
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

export function RemindersView() {
  const queryClient = useQueryClient();
  const isMdUp = useMediaQuery("(min-width: 768px)");

  const [view, setView] = usePersistedState<RemindersViewMode>(
    REMINDERS_VIEW_STORAGE_KEY,
    "grid",
    {
      serialize: serializeRemindersViewMode,
      deserialize: parseRemindersViewMode,
    },
  );

  const [filters, setFilters] = usePersistedState<RemindersFiltersState>(
    REMINDERS_FILTERS_STORAGE_KEY,
    DEFAULT_REMINDERS_FILTERS,
    { deserialize: parseRemindersFilters },
  );

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [listPage, setListPage] = useState(1);

  const { search, status, dateFrom, dateTo } = filters;
  const debouncedSearch = useDebouncedValue(search, 500);
  const filtersActive = hasActiveRemindersFilters(filters);

  const queryFilters: RemindersQueryFilters = useMemo(
    () => ({
      search: getReminderListSearchTerm(search, debouncedSearch),
      status,
      dateFrom,
      dateTo,
    }),
    [search, debouncedSearch, status, dateFrom, dateTo],
  );

  const showGrid = !isMdUp || view === "grid";
  const showList = isMdUp && view === "list";

  useEffect(() => {
    setListPage(1);
  }, [queryFilters]);

  const infiniteQuery = useInfiniteQuery({
    queryKey: remindersQueryKeys.infinite(queryFilters),
    queryFn: ({ pageParam }) =>
      fetchRemindersPage({
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
  });

  const listQuery = useQuery({
    queryKey: remindersQueryKeys.listPage(queryFilters, listPage),
    queryFn: () =>
      fetchRemindersPage({
        ...queryFilters,
        offset: (listPage - 1) * REMINDERS_PAGE_SIZE_LIST,
        limit: REMINDERS_PAGE_SIZE_LIST,
      }),
    enabled: showList,
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

  function updateFilters(patch: Partial<RemindersFiltersState>) {
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  async function clearFilters() {
    setFilters(DEFAULT_REMINDERS_FILTERS);
    setListPage(1);
    setFiltersOpen(false);
    await invalidateRemindersQueries(queryClient);
  }

  const filterFields = (
    <RemindersFilters
      search={search}
      onSearchChange={(value) => updateFilters({ search: value })}
      status={status}
      onStatusChange={(value) => updateFilters({ status: value })}
      dateFrom={dateFrom}
      onDateFromChange={(value) => updateFilters({ dateFrom: value })}
      dateTo={dateTo}
      onDateToChange={(value) => updateFilters({ dateTo: value })}
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
      <div className="rounded-lg border border-border/70 bg-card/60 p-3 sm:p-4">
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
                  onSearchChange={(value) => updateFilters({ search: value })}
                  status={status}
                  onStatusChange={(value) => updateFilters({ status: value })}
                  dateFrom={dateFrom}
                  onDateFromChange={(value) =>
                    updateFilters({ dateFrom: value })
                  }
                  dateTo={dateTo}
                  onDateToChange={(value) => updateFilters({ dateTo: value })}
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
        <RemindersGridSkeleton />
      ) : isEmpty ? (
        <div className="rounded-lg border border-dashed border-border/80 bg-muted/10 px-6 py-12 text-center">
          <p className="text-sm font-medium text-foreground">
            Nenhum lembrete encontrado
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Ajuste os filtros ou crie um novo lembrete.
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
        <div className="flex justify-center py-2">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : null}
    </div>
  );
}
