import { CoreTable } from '../core/table'
import {
  PaginationState,
  getDefaultPaginationState,
} from '../features/Pagination'
import { RowData, Updater } from '../types'
import { functionalUpdate } from '../utils'

export function setTablePagination<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ table, updater }: { table: TTable; updater: Updater<PaginationState> }) {
  const safeUpdater: Updater<PaginationState> = old => {
    let newState = functionalUpdate(updater, old)

    return newState
  }

  return table.options.onPaginationChange?.(safeUpdater)
}

export function resetTablePagination<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ defaultState, table }: { defaultState?: boolean; table: TTable }) {
  setTablePagination({
    table,
    updater: defaultState
      ? getDefaultPaginationState()
      : table.initialState.pagination ?? getDefaultPaginationState(),
  })
}
