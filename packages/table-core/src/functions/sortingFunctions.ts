import { CoreColumn } from '../core/column'
import { CoreTable } from '../core/table'
import { SortingState } from '../features/Sorting'
import { reSplitAlphaNumeric, sortingFns } from '../sortingFns'
import { CellData, RowData } from '../types'
import { isFunction } from '../utils'

//row models
export function getTablePreSortedRowModel<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ table }: { table: TTable }) {
  return table.getGroupedRowModel()
}

export function getTableSortedRowModel<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ table }: { table: TTable }) {
  if (!table._getSortedRowModel && table.options.getSortedRowModel) {
    table._getSortedRowModel = table.options.getSortedRowModel(table)
  }

  if (table.options.manualSorting || !table._getSortedRowModel) {
    return table.getPreSortedRowModel()
  }

  return table._getSortedRowModel()
}

//table functions
export function setTableSortingState<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ table, updater }: { table: TTable; updater: SortingState }) {
  return table.options.onSortingChange?.(updater)
}

export function resetTableSortingState<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ defaultState, table }: { defaultState?: boolean; table: TTable }) {
  setTableSortingState({
    table,
    updater: defaultState ? [] : table.initialState?.sorting ?? [],
  })
}

//column functions

export function getColumnAutoSortingFn<
  TData extends RowData,
  TValue extends CellData = CellData,
  TColumn extends CoreColumn<TData, TValue> = CoreColumn<TData, TValue>,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ column, table }: { column: TColumn; table: TTable }) {
  const firstRows = table.getFilteredRowModel().flatRows.slice(10)

  let isString = false

  for (const row of firstRows) {
    const value = row?.getValue(column.id)

    if (Object.prototype.toString.call(value) === '[object Date]') {
      return sortingFns.datetime
    }

    if (typeof value === 'string') {
      isString = true

      if (value.split(reSplitAlphaNumeric).length > 1) {
        return sortingFns.alphanumeric
      }
    }
  }

  if (isString) {
    return sortingFns.text
  }

  return sortingFns.basic
}

export function getColumnAutoSortDir<
  TData extends RowData,
  TValue extends CellData = CellData,
  TColumn extends CoreColumn<TData, TValue> = CoreColumn<TData, TValue>,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ column, table }: { column: TColumn; table: TTable }) {
  const firstRow = table.getFilteredRowModel().flatRows[0]

  const value = firstRow?.getValue(column.id)

  if (typeof value === 'string') {
    return 'asc'
  }

  return 'desc'
}

export function getColumnSortingFn<
  TData extends RowData,
  TValue extends CellData = CellData,
  TColumn extends CoreColumn<TData, TValue> = CoreColumn<TData, TValue>,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ column, table }: { column: TColumn; table: TTable }) {
  if (!column) {
    throw new Error()
  }

  return isFunction(column.columnDef.sortingFn)
    ? column.columnDef.sortingFn
    : column.columnDef.sortingFn === 'auto'
    ? getColumnAutoSortingFn({ column, table })
    : table.options.sortingFns?.[column.columnDef.sortingFn as string] ??
      sortingFns[column.columnDef.sortingFn as BuiltInSortingFn]
}

export function toggleColumnSorting<
  TData extends RowData,
  TValue extends CellData = CellData,
  TColumn extends CoreColumn<TData, TValue> = CoreColumn<TData, TValue>,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({
  column,
  desc,
  multi,
  table,
}: {
  column: TColumn
  desc?: boolean
  multi?: boolean
  table: TTable
}) {
  const nextSortingOrder = column.getNextSortingOrder()
  const hasManualValue = typeof desc !== 'undefined' && desc !== null

  setTableSortingState({
    table,
    updater: old => {
      // Find any existing sorting for this column
      const existingSorting = old?.find(d => d.id === column.id)
      const existingIndex = old?.findIndex(d => d.id === column.id)

      let newSorting: SortingState = []

      // What should we do with this sort action?
      let sortAction: 'add' | 'remove' | 'toggle' | 'replace'
      let nextDesc = hasManualValue ? desc : nextSortingOrder === 'desc'

      // Multi-mode
      if (old?.length && getColumnCanMultiSort({ column, table }) && multi) {
        if (existingSorting) {
          sortAction = 'toggle'
        } else {
          sortAction = 'add'
        }
      } else {
        // Normal mode
        if (old?.length && existingIndex !== old.length - 1) {
          sortAction = 'replace'
        } else if (existingSorting) {
          sortAction = 'toggle'
        } else {
          sortAction = 'replace'
        }
      }

      // Handle toggle states that will remove the sorting
      if (sortAction === 'toggle') {
        // If we are "actually" toggling (not a manual set value), should we remove the sorting?
        if (!hasManualValue) {
          // Is our intention to remove?
          if (!nextSortingOrder) {
            sortAction = 'remove'
          }
        }
      }

      if (sortAction === 'add') {
        newSorting = [
          ...old,
          {
            id: column.id,
            desc: nextDesc,
          },
        ]
        // Take latest n columns
        newSorting.splice(
          0,
          newSorting.length -
            (table.options.maxMultiSortColCount ?? Number.MAX_SAFE_INTEGER)
        )
      } else if (sortAction === 'toggle') {
        // This flips (or sets) the
        newSorting = old.map(d => {
          if (d.id === column.id) {
            return {
              ...d,
              desc: nextDesc,
            }
          }
          return d
        })
      } else if (sortAction === 'remove') {
        newSorting = old.filter(d => d.id !== column.id)
      } else {
        newSorting = [
          {
            id: column.id,
            desc: nextDesc,
          },
        ]
      }

      return newSorting
    },
  })
}

export function getColumnFirstSortDir<
  TData extends RowData,
  TValue extends CellData = CellData,
  TColumn extends CoreColumn<TData, TValue> = CoreColumn<TData, TValue>,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ column, table }: { column: TColumn; table: TTable }) {
  const sortDescFirst =
    column.columnDef.sortDescFirst ??
    table.options.sortDescFirst ??
    getColumnAutoSortDir({ column, table }) === 'desc'
  return sortDescFirst ? 'desc' : 'asc'
}

export function getColumnNextSortingOrder<
  TData extends RowData,
  TValue extends CellData = CellData,
  TColumn extends CoreColumn<TData, TValue> = CoreColumn<TData, TValue>,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({
  column,
  multi,
  table,
}: {
  column: TColumn
  multi?: boolean
  table: TTable
}) {
  const firstSortDirection = getColumnFirstSortDir({ column, table })
  const isSorted = getColumnIsSorted({ column, table })

  if (!isSorted) {
    return firstSortDirection
  }

  if (
    isSorted !== firstSortDirection &&
    (table.options.enableSortingRemoval ?? true) && // If enableSortRemove, enable in general
    (multi ? table.options.enableMultiRemove ?? true : true) // If multi, don't allow if enableMultiRemove))
  ) {
    return false
  }
  return isSorted === 'desc' ? 'asc' : 'desc'
}

export function getColumnCanSort<
  TData extends RowData,
  TValue extends CellData = CellData,
  TColumn extends CoreColumn<TData, TValue> = CoreColumn<TData, TValue>,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ column, table }: { column: TColumn; table: TTable }) {
  return (
    (column.columnDef.enableSorting ?? true) &&
    (table.options.enableSorting ?? true) &&
    !!column.accessorFn
  )
}

export function getColumnCanMultiSort<
  TData extends RowData,
  TValue extends CellData = CellData,
  TColumn extends CoreColumn<TData, TValue> = CoreColumn<TData, TValue>,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ column, table }: { column: TColumn; table: TTable }) {
  return (
    column.columnDef.enableMultiSort ??
    table.options.enableMultiSort ??
    !!column.accessorFn
  )
}

export function getColumnIsSorted<
  TData extends RowData,
  TValue extends CellData = CellData,
  TColumn extends CoreColumn<TData, TValue> = CoreColumn<TData, TValue>,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ column, table }: { column: TColumn; table: TTable }) {
  const columnSort = table.getState().sorting?.find(d => d.id === column.id)
  return !columnSort ? false : columnSort.desc ? 'desc' : 'asc'
}

export function getColumnSortIndex<
  TData extends RowData,
  TValue extends CellData = CellData,
  TColumn extends CoreColumn<TData, TValue> = CoreColumn<TData, TValue>,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ column, table }: { column: TColumn; table: TTable }) {
  table.getState().sorting?.findIndex(d => d.id === column.id) ?? -1
}

export function clearColumnSorting<
  TData extends RowData,
  TValue extends CellData = CellData,
  TColumn extends CoreColumn<TData, TValue> = CoreColumn<TData, TValue>,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ column, table }: { column: TColumn; table: TTable }) {
  //clear sorting for just 1 column
  setTableSortingState({
    table,
    updater: old => (old?.length ? old.filter(d => d.id !== column.id) : []),
  })
}

export function getColumnToggleSortingHandler<
  TData extends RowData,
  TValue extends CellData = CellData,
  TColumn extends CoreColumn<TData, TValue> = CoreColumn<TData, TValue>,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ column, table }: { column: TColumn; table: TTable }) {
  // const canSort = column.getCanSort()
  const canSort = getColumnCanSort({ column, table })

  return (e: unknown) => {
    if (!canSort) return
    ;(e as any).persist?.()
    toggleColumnSorting({
      table,
      column,
      desc: undefined,
      multi: getColumnCanMultiSort({
        column,
        table,
      })
        ? table.options.isMultiSortEvent?.(e)
        : false,
    })
  }
}
