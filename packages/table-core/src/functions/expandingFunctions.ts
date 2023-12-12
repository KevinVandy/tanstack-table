import { CoreRow } from '../core/row'
import { CoreTable } from '../core/table'
import { ExpandedState, ExpandedStateList } from '../features/Expanding'
import { RowData, Updater } from '../types'
import { getTableRow } from './coreTableFunctions'
import { getTablePrePaginationRowModel } from './paginationFunctions'

//row models
export function getTablePreExpandedRowModel<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ table }: { table: TTable }) {
  return table.getSortedRowModel()
}

export function getTableExpandedRowModel<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ table }: { table: TTable }) {
  if (!table._getExpandedRowModel && table.options.getExpandedRowModel) {
    table._getExpandedRowModel = table.options.getExpandedRowModel(table)
  }

  if (table.options.manualExpanding || !table._getExpandedRowModel) {
    return table.getPreExpandedRowModel()
  }

  return table._getExpandedRowModel()
}

//table functions
export function setTableExpandedState<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ table, updater }: { table: TTable; updater: Updater<ExpandedState> }) {
  return table.options.onExpandedChange?.(updater)
}

export function resetTableExpandedState<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ defaultState, table }: { defaultState?: boolean; table: TTable }) {
  setTableExpandedState({
    table,
    updater: defaultState ? true : table.initialState.expanded ?? {},
  })
}

export function toggleTableAllRowsExpanded<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ table, expanded }: { expanded?: boolean; table: TTable }) {
  if (expanded ?? !getIsAllRowsExpanded({ table })) {
    setTableExpandedState({ table, updater: true })
  } else {
    setTableExpandedState({ table, updater: {} })
  }
}

export function getTableCanSomeRowsExpand<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ table }: { table: TTable }) {
  return getTablePrePaginationRowModel({ table }).flatRows.some(row =>
    row.getCanExpand()
  )
}

export function getToggleAllRowsExpandedHandler<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ table }: { table: TTable }) {
  return (e: unknown) => {
    ;(e as any).persist?.()
    toggleTableAllRowsExpanded({ table })
  }
}

export function getIsSomeRowsExpanded<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ table }: { table: TTable }) {
  const expanded = table.getState().expanded
  return expanded === true || Object.values(expanded).some(Boolean)
}

export function getIsAllRowsExpanded<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ table }: { table: TTable }) {
  const expanded = table.getState().expanded

  // If expanded is true, save some cycles and return true
  if (typeof expanded === 'boolean') {
    return expanded === true
  }

  if (!Object.keys(expanded).length) {
    return false
  }

  // If any row is not expanded, return false
  if (table.getRowModel().flatRows.some(row => !row.getIsExpanded())) {
    return false
  }

  // They must all be expanded :shrug:
  return true
}

export function getTableExpandedDepth<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ table }: { table: TTable }) {
  let maxDepth = 0

  const rowIds =
    table.getState().expanded === true
      ? Object.keys(table.getRowModel().rowsById)
      : Object.keys(table.getState().expanded)

  rowIds.forEach(id => {
    const splitId = id.split('.')
    maxDepth = Math.max(maxDepth, splitId.length)
  })

  return maxDepth
}

//row functions
export function toggleRowExpanded<
  TData extends RowData,
  TRow extends CoreRow<TData> = CoreRow<TData>,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ row, table, expanded }: { row: TRow; table: TTable; expanded?: boolean }) {
  setTableExpandedState({
    table,
    updater: old => {
      const exists = old === true ? true : !!old?.[row.id]

      let oldExpanded: ExpandedStateList = {}

      if (old === true) {
        Object.keys(table.getRowModel().rowsById).forEach(rowId => {
          oldExpanded[rowId] = true
        })
      } else {
        oldExpanded = old
      }

      expanded = expanded ?? !exists

      if (!exists && expanded) {
        return {
          ...oldExpanded,
          [row.id]: true,
        }
      }

      if (exists && !expanded) {
        const { [row.id]: _, ...rest } = oldExpanded
        return rest
      }

      return old
    },
  })
}

export function getIsRowExpanded<
  TData extends RowData,
  TRow extends CoreRow<TData> = CoreRow<TData>,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ row, table }: { row: TRow; table: TTable }) {
  const expanded = table.getState().expanded

  return !!(
    table.options.getIsRowExpanded?.(row) ??
    (expanded === true || expanded?.[row.id])
  )
}

export function getRowCanExpand<
  TData extends RowData,
  TRow extends CoreRow<TData> = CoreRow<TData>,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ row, table }: { row: TRow; table: TTable }) {
  return (
    table.options.getRowCanExpand?.(row) ??
    ((table.options.enableExpanding ?? true) && !!row.subRows?.length)
  )
}

export function getIsAllRowParentsExpanded<
  TData extends RowData,
  TRow extends CoreRow<TData> = CoreRow<TData>,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ row, table }: { row: TRow; table: TTable }) {
  let isFullyExpanded = true
  let currentRow = row

  while (isFullyExpanded && currentRow.parentId) {
    currentRow = getTableRow({
      table,
      rowId: currentRow.parentId,
      searchAll: true,
    })
    isFullyExpanded = getIsRowExpanded({ row: currentRow, table })
  }

  return isFullyExpanded
}

export function getRowToggleExpandedHandler<
  TData extends RowData,
  TRow extends CoreRow<TData> = CoreRow<TData>,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ row, table }: { row: TRow; table: TTable }) {
  const canExpand = getRowCanExpand({ row, table })
  return () => {
    if (!canExpand) return
    toggleRowExpanded({ row, table })
  }
}
