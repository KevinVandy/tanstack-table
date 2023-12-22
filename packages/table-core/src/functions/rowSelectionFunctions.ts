import { CoreRow } from '../core/row'
import { CoreTable } from '../core/table'
import { RowSelectionState } from '../features/RowSelection'
import { RowData, RowModel, Updater } from '../types'
import { getTableCoreRowModel, getTableRow } from './coreTableFunctions'
import { getTablePaginationRowModel } from './paginationFunctions'

//row models
export function getTablePreSelectedRowModel<TData extends RowData>({
  table,
}: {
  table: CoreTable<TData>
}) {
  return getTableCoreRowModel({ table })
}

export function getTableSelectedRowModel<TData extends RowData>({
  table,
}: {
  table: CoreTable<TData>
}) {
  const { rowSelection } = table.getState()
  if (!Object.keys(rowSelection).length) {
    return {
      rows: [],
      flatRows: [],
      rowsById: {},
    }
  }

  return selectRowsFn({ rowModel, table })
}

export function getTableFilteredSelectedRowModel<TData extends RowData>({
  table,
}: {
  table: CoreTable<TData>
}) {
  //need memo?
  const { rowSelection } = table.getState()
  const rowModel = table.getFilteredRowModel()

  if (!Object.keys(rowSelection).length) {
    return {
      rows: [],
      flatRows: [],
      rowsById: {},
    }
  }

  return selectRowsFn({ table, rowModel })
}

export function getTableGroupedSelectedRowModel<TData extends RowData>({
  table,
}: {
  table: CoreTable<TData>
}) {
  const { rowSelection } = table.getState()
  const rowModel = table.getGroupedRowModel()

  if (!Object.keys(rowSelection).length) {
    return {
      rows: [],
      flatRows: [],
      rowsById: {},
    }
  }

  return selectRowsFn({ table, rowModel })
}

export function mutateRowIsSelected<TData extends RowData>({
  selectedRowIds,
  id,
  value,
  includeChildren,
  table,
}: {
  selectedRowIds: Record<string, boolean>
  id: string
  value: boolean
  includeChildren: boolean
  table: CoreTable<TData>
}) {
  // const row = table.getRow(id)
  const row = getTableRow({ table, rowId: id })

  // const isGrouped = row.getIsGrouped()

  // if ( // TODO: enforce grouping row selection rules
  //   !isGrouped ||
  //   (isGrouped && table.options.enableGroupingRowSelection)
  // ) {
  if (value) {
    if (!row.getCanMultiSelect()) {
      Object.keys(selectedRowIds).forEach(key => delete selectedRowIds[key])
    }
    if (row.getCanSelect()) {
      selectedRowIds[id] = true
    }
  } else {
    delete selectedRowIds[id]
  }
  // }

  if (includeChildren && row.subRows?.length && row.getCanSelectSubRows()) {
    row.subRows.forEach(row =>
      mutateRowIsSelecte({
        selectedRowIds,
        id: row.id,
        value,
        includeChildren,
        table,
      })
    )
  }
}

export function selectRowsFn<TData extends RowData>({
  rowModel,
  table,
}: {
  rowModel: RowModel<TData>
  table: CoreTable<TData>
}): RowModel<TData> {
  const rowSelection = table.getState().rowSelection

  const newSelectedFlatRows: CoreRow<TData>[] = []
  const newSelectedRowsById: Record<string, CoreRow<TData>> = {}

  // Filters top level and nested rows
  const recurseRows = (rows: CoreRow<TData>[], depth = 0): CoreRow<TData>[] => {
    return rows
      .map(row => {
        const isSelected = isRowSelected({ row, rowSelection })

        if (isSelected) {
          newSelectedFlatRows.push(row)
          newSelectedRowsById[row.id] = row
        }

        if (row.subRows?.length) {
          row = {
            ...row,
            subRows: recurseRows(row.subRows, depth + 1),
          }
        }

        if (isSelected) {
          return row
        }
      })
      .filter(Boolean) as Row<TData>[]
  }

  return {
    rows: recurseRows(rowModel.rows),
    flatRows: newSelectedFlatRows,
    rowsById: newSelectedRowsById,
  }
}

export function isRowSelected<TData extends RowData>({
  row,
  rowSelection,
}: {
  row: CoreRow<TData>
  rowSelection: RowSelectionState
}): boolean {
  return rowSelection[row.id] ?? false
}

export function isSubRowSelected<TData extends RowData>({
  row,
  rowSelection,
  table,
}: {
  row: CoreRow<TData>
  rowSelection: RowSelectionState
  table: CoreTable<TData>
}): boolean | 'some' | 'all' {
  if (!row.subRows?.length) return false

  let allChildrenSelected = true
  let someSelected = false

  row.subRows.forEach(subRow => {
    // Bail out early if we know both of these
    if (someSelected && !allChildrenSelected) {
      return
    }

    if (subRow.getCanSelect()) {
      if (isRowSelected({ row: subRow, rowSelection })) {
        someSelected = true
      } else {
        allChildrenSelected = false
      }
    }

    // Check row selection of nested subrows
    if (subRow.subRows && subRow.subRows.length) {
      const subRowChildrenSelected = isSubRowSelected({
        row: subRow,
        rowSelection,
        table,
      })
      if (subRowChildrenSelected === 'all') {
        someSelected = true
      } else if (subRowChildrenSelected === 'some') {
        someSelected = true
        allChildrenSelected = false
      } else {
        allChildrenSelected = false
      }
    }
  })

  return allChildrenSelected ? 'all' : someSelected ? 'some' : false
}

//table functions
export function setRowSelectionState<TData extends RowData>({
  updater,
  table,
}: {
  updater: Updater<RowSelectionState>
  table: CoreTable<TData>
}) {
  table.options.onRowSelectionChange?.(updater)
}

export function resetRowSelectionState<TData extends RowData>({
  defaultState,
  table,
}: {
  defaultState?: boolean
  table: CoreTable<TData>
}) {
  setRowSelectionState({
    updater: defaultState ? {} : table.initialState.rowSelection ?? {},
    table,
  })
}

export function toggleTableAllRowsSelected<TData extends RowData>({
  table,
  value,
}: {
  table: CoreTable<TData>
  value?: boolean
}) {
  setRowSelectionState(
    {
      updater: old => {
        value =
          typeof value !== 'undefined' ? value : !table.getIsAllRowsSelected()

        const rowSelection = { ...old }

        const preGroupedFlatRows = table.getPreGroupedRowModel().flatRows

        // We don't use `mutateRowIsSelected` here for performance reasons.
        // All of the rows are flat already, so it wouldn't be worth it
        if (value) {
          preGroupedFlatRows.forEach(row => {
            if (!row.getCanSelect()) {
              return
            }
            rowSelection[row.id] = true
          })
        } else {
          preGroupedFlatRows.forEach(row => {
            delete rowSelection[row.id]
          })
        }

        return rowSelection
      },
    },
    table
  )
}

export function toggleTableAllPageRowsSelected<TData extends RowData>({
  table,
  value,
}: {
  table: CoreTable<TData>
  value?: boolean
}) {
  setRowSelectionState(
    {
      updater: old => {
        const resolvedValue =
          typeof value !== 'undefined'
            ? value
            : getTableIsAllPageRowsSelected({ table })

        const rowSelection: RowSelectionState = { ...old }

        table.getRowModel().rows.forEach(row => {
          mutateRowIsSelected(rowSelection, row.id, resolvedValue, true, table)
        })

        return rowSelection
      },
    },
    table
  )
}

export function getTableIsAllRowsSelected<TData extends RowData>({
  table,
}: {
  table: CoreTable<TData>
}) {
  const preGroupedFlatRows = table.getFilteredRowModel().flatRows
  const { rowSelection } = table.getState()

  let isAllRowsSelected = Boolean(
    preGroupedFlatRows.length && Object.keys(rowSelection).length
  )

  if (isAllRowsSelected) {
    if (
      preGroupedFlatRows.some(
        row => row.getCanSelect() && !rowSelection[row.id]
      )
    ) {
      isAllRowsSelected = false
    }
  }

  return isAllRowsSelected
}

export function getTableIsAllPageRowsSelected<TData extends RowData>({
  table,
}: {
  table: CoreTable<TData>
}) {
  const paginationFlatRows = table
  getTablePaginationRowModel({ table }).flatRows.filter(row =>
    row.getCanSelect()
  )
  const { rowSelection } = table.getState()

  let isAllPageRowsSelected = !!paginationFlatRows.length

  if (
    isAllPageRowsSelected &&
    paginationFlatRows.some(row => !rowSelection[row.id])
  ) {
    isAllPageRowsSelected = false
  }

  return isAllPageRowsSelected
}

export function getTableIsSomeRowsSelected<TData extends RowData>({
  table,
}: {
  table: CoreTable<TData>
}) {
  const totalSelected = Object.keys(table.getState().rowSelection ?? {}).length
  return (
    totalSelected > 0 &&
    totalSelected < table.getFilteredRowModel().flatRows.length
  )
}

export function getTableIsSomePageRowsSelected<TData extends RowData>({
  table,
}: {
  table: CoreTable<TData>
}) {
  const paginationFlatRows = getTablePaginationRowModel({ table }).flatRows
  return getTableIsAllPageRowsSelected({ table })
    ? false
    : paginationFlatRows
        .filter(row => row.getCanSelect())
        .some(d => d.getIsSelected() || d.getIsSomeSelected())
}

export function getTableToggleAllRowsSelectedHandler<TData extends RowData>({
  table,
}: {
  table: CoreTable<TData>
}) {
  return (e: unknown) => {
    toggleTableAllRowsSelected({
      table,
      value: ((e as MouseEvent).target as HTMLInputElement).checked,
    })
  }
}

export function getTableToggleAllPageRowsSelectedHandler<
  TData extends RowData,
>({ table }: { table: CoreTable<TData> }) {
  return (e: unknown) => {
    toggleTableAllPageRowsSelected({
      table,
      value: ((e as MouseEvent).target as HTMLInputElement).checked,
    })
  }
}

//row functions
export function toggleRowSelected<TData extends RowData>({
  row,
  table,
  selectChildren,
  value,
}: {
  row: CoreRow<TData>
  table: CoreTable<TData>
  selectChildren?: boolean
  value?: boolean
}) {
  const isSelected = getRowIsSelected({ row, table })

  setRowSelectionState({
    table,
    updater: old => {
      value = typeof value !== 'undefined' ? value : !isSelected

      if (getRowCanSelect({ row, table }) && isSelected === value) {
        return old
      }

      const selectedRowIds = { ...old }

      mutateRowIsSelected(
        selectedRowIds,
        row.id,
        value,
        selectChildren ?? true,
        table
      )

      return selectedRowIds
    },
  })
}

export function getRowIsSelected<TData extends RowData>({
  row,
  table,
}: {
  row: CoreRow<TData>
  table: CoreTable<TData>
}) {
  const { rowSelection } = table.getState()
  return isRowSelected({ row, rowSelection })
}

export function getRowIsSomeSelected<TData extends RowData>({
  row,
  table,
}: {
  row: CoreRow<TData>
  table: CoreTable<TData>
}) {
  const { rowSelection } = table.getState()
  return isSubRowSelected({ row, rowSelection, table }) === 'some'
}

export function getRowIsAllSelected<TData extends RowData>({
  row,
  table,
}: {
  row: CoreRow<TData>
  table: CoreTable<TData>
}) {
  const { rowSelection } = table.getState()
  return isSubRowSelected({ row, rowSelection, table }) === 'all'
}

export function getRowCanSelect<TData extends RowData>({
  row,
  table,
}: {
  row: CoreRow<TData>
  table: CoreTable<TData>
}) {
  if (typeof table.options.enableRowSelection === 'function') {
    return table.options.enableRowSelection(row)
  }

  return table.options.enableRowSelection ?? true
}

export function getRowCanSelectSubRows<TData extends RowData>({
  row,
  table,
}: {
  row: CoreRow<TData>
  table: CoreTable<TData>
}) {
  if (typeof table.options.enableSubRowSelection === 'function') {
    return table.options.enableSubRowSelection(row)
  }

  return table.options.enableSubRowSelection ?? true
}

export function getRowCanMultiSelect<TData extends RowData>({
  row,
  table,
}: {
  row: CoreRow<TData>
  table: CoreTable<TData>
}) {
  if (typeof table.options.enableMultiRowSelection === 'function') {
    return table.options.enableMultiRowSelection(row)
  }

  return table.options.enableMultiRowSelection ?? true
}

export function getRowToggleSelectedHandler<TData extends RowData>({
  row,
  table,
}: {
  row: CoreRow<TData>
  table: CoreTable<TData>
}) {
  const canSelect = getRowCanSelect({ row, table })

  return (e: unknown) => {
    if (!canSelect) return
    toggleRowSelected({
      row,
      table,
      value: ((e as MouseEvent).target as HTMLInputElement)?.checked,
    })
  }
}
