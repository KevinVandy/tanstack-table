import { CoreTable } from '../core/table'
import {
  PaginationState,
  defaultPageIndex,
  defaultPageSize,
  getDefaultPaginationState,
} from '../features/Pagination'
import { RowData, Updater } from '../types'
import { functionalUpdate } from '../utils'

//row models
export function getTablePrePaginationRowModel<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ table }: { table: TTable }) {
  return table.getExpandedRowModel()
}

export function getTablePaginationRowModel<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ table }: { table: TTable }) {
  if (!table._getPaginationRowModel && table.options.getPaginationRowModel) {
    table._getPaginationRowModel = table.options.getPaginationRowModel(table)
  }

  if (table.options.manualPagination || !table._getPaginationRowModel) {
    return table.getPrePaginationRowModel()
  }

  return table._getPaginationRowModel()
}

//table functions
export function setTablePaginationState<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ table, updater }: { table: TTable; updater: Updater<PaginationState> }) {
  const safeUpdater: Updater<PaginationState> = old => {
    let newState = functionalUpdate(updater, old)

    return newState
  }

  return table.options.onPaginationChange?.(safeUpdater)
}

export function resetTablePaginationState<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ defaultState, table }: { defaultState?: boolean; table: TTable }) {
  setTablePaginationState({
    table,
    updater: defaultState
      ? getDefaultPaginationState()
      : table.initialState.pagination ?? getDefaultPaginationState(),
  })
}

export function setTablePageIndex<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ table, updater }: { table: TTable; updater: Updater<number> }) {
  setTablePaginationState({
    table,
    updater: old => {
      let pageIndex = functionalUpdate(updater, old.pageIndex)

      const maxPageIndex =
        typeof table.options.pageCount === 'undefined' ||
        table.options.pageCount === -1
          ? Number.MAX_SAFE_INTEGER
          : table.options.pageCount - 1

      pageIndex = Math.max(0, Math.min(pageIndex, maxPageIndex))

      return {
        ...old,
        pageIndex,
      }
    },
  })
}

export function setTablePageSize<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ table, updater }: { table: TTable; updater: Updater<number> }) {
  setTablePaginationState({
    table,
    updater: old => {
      const pageSize = Math.max(1, functionalUpdate(updater, old.pageSize))
      const topRowIndex = old.pageSize * old.pageIndex!
      const pageIndex = Math.floor(topRowIndex / pageSize)

      return {
        ...old,
        pageIndex,
        pageSize,
      }
    },
  })
}

export function resetTablePageIndex<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ defaultState, table }: { defaultState?: boolean; table: TTable }) {
  setTablePageIndex({
    table,
    updater: defaultState
      ? () => defaultPageIndex
      : table.initialState?.pagination?.pageIndex ?? defaultPageIndex,
  })
}

export function resetTablePageSize<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ defaultState, table }: { defaultState?: boolean; table: TTable }) {
  setTablePageSize({
    table,
    updater: defaultState
      ? defaultPageSize
      : table.initialState?.pagination?.pageSize ?? defaultPageSize,
  })
}

export function setTablePageCount<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ table, updater }: { table: TTable; updater: Updater<number> }) {
  setTablePaginationState({
    table,
    updater: old => {
      let newPageCount = functionalUpdate(
        updater,
        table.options.pageCount ?? -1
      )

      if (typeof newPageCount === 'number') {
        newPageCount = Math.max(-1, newPageCount)
      }

      return {
        ...old,
        pageCount: newPageCount,
      }
    },
  })
}

export function getTablePageCount<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ table }: { table: TTable }) {
  return (
    table.options.pageCount ??
    Math.ceil(
      table.getPrePaginationRowModel().rows.length /
        table.getState().pagination.pageSize
    )
  )
}

export function getTablePageOptions<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ table, pageCount }: { table: TTable; pageCount?: number }) {
  let pageOptions: number[] = []
  if (pageCount && pageCount > 0) {
    pageOptions = [...new Array(pageCount)].fill(null).map((_, i) => i)
  }
  return pageOptions
}

export function getTableCanPreviousPage<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ table }: { table: TTable }) {
  return table.getState().pagination.pageIndex > 0
}

export function getTableCanNextPage<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ table }: { table: TTable }) {
  const { pageIndex } = table.getState().pagination

  const pageCount = getTablePageCount({ table })

  if (pageCount === -1) {
    return true
  }

  if (pageCount === 0) {
    return false
  }

  return pageIndex < pageCount - 1
}

export function goTablePreviousPage<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ table }: { table: TTable }) {
  setTablePageIndex({
    table,
    updater: old => old - 1,
  })
}

export function goTableNextPage<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ table }: { table: TTable }) {
  setTablePageIndex({
    table,
    updater: old => old + 1,
  })
}

export function goTableFirstPage<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ table }: { table: TTable }) {
  setTablePageIndex({
    table,
    updater: () => 0,
  })
}

export function goTableLastPage<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ table }: { table: TTable }) {
  setTablePageIndex({
    table,
    updater: () => getTablePageCount({ table }) - 1,
  })
}
