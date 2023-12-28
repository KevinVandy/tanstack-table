import { CoreRow, RequiredKeys, functionalUpdate, orderColumns } from '..'
import { CoreColumn, createCoreColumn } from '../core/column'
import { CoreTable } from '../core/table'
import {
  CellValue,
  ColumnDef,
  ColumnDefResolved,
  GroupColumnDef,
  RowData,
  TableOptionsResolved,
  TableState,
  Updater,
} from '../types'
import { getRowParentRow } from './coreRowFunctions'

export function mergeTableOptions<TData extends RowData>({
  table,
  defaultOptions,
  options,
}: {
  table: CoreTable<TData>
  defaultOptions: TableOptionsResolved<TData>
  options: Partial<TableOptionsResolved<TData>>
}) {
  if (table.options.mergeOptions) {
    return table.options.mergeOptions(defaultOptions, options)
  }

  return {
    ...defaultOptions,
    ...options,
  }
}

export function resetTable<TData extends RowData>({
  table,
}: {
  table: CoreTable<TData>
}) {
  table.setState(table.initialState)
}

export function setTableOptions<TData extends RowData>({
  defaultOptions,
  table,
}: {
  table: CoreTable<TData>
  defaultOptions: TableOptionsResolved<TData>
}) {
  const newOptions = functionalUpdate(updater, table.options)
  table.options = mergeTableOptions({
    table,
    defaultOptions,
    options: newOptions,
  }) as RequiredKeys<TableOptionsResolved<TData>, 'state'>
}

export function getTableState<TData extends RowData>({
  table,
}: {
  table: CoreTable<TData>
}): TableState {
  return table.options.state as TableState
}

export function setTableState<TData extends RowData>({
  updater,
  table,
}: {
  table: CoreTable<TData>
  updater: Updater<TableState>
}) {
  table.options.onStateChange?.(updater)
}

export function _getRowId<TData extends RowData>({
  row,
  table,
}: {
  row: CoreRow<TData>
  table: CoreTable<TData>
}) {
  const parentRow = getRowParentRow({ row, table })
  return (
    table.options.getRowId?.(row.original, row.index, parentRow) ??
    `${parentRow ? [parentRow.id, row.index].join('.') : row.index}`
  )
}

export function getTableCoreRowModel<
  TData extends RowData,
>({ table }: { table: CoreTable<TData> }) {
  if (!table._getCoreRowModel) {
    table._getCoreRowModel = table.options.getCoreRowModel(table)
  }

  return table._getCoreRowModel!()
}

export function getTableRowModel<TData extends RowData>({
  table,
}: {
  table: CoreTable<TData>
}) {
  return table.getPaginationRowModel()
}

export function getTableRow<TData extends RowData>({
  rowId,
  searchAll,
  table,
}: {
  rowId: string
  searchAll?: boolean
  table: CoreTable<TData>
}) {
  const row = (searchAll ? table.getCoreRowModel() : table.getRowModel())
    .rowsById[rowId]

  if (!row) {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(`getRow expected an ID, but got ${rowId}`)
    }
    throw new Error()
  }

  return row
}

export function _getTableDefaultColumnDef<TData extends RowData>({
  defaultColumn,
  table,
}: {
  defaultColumn?: Partial<ColumnDef<TData, unknown>>
  table: CoreTable<TData>
}) {
  defaultColumn = (defaultColumn ?? {}) as Partial<ColumnDef<TData, unknown>>

  return {
    header: props => {
      const resolvedColumnDef = props.header.column
        .columnDef as ColumnDefResolved<TData>

      if (resolvedColumnDef.accessorKey) {
        return resolvedColumnDef.accessorKey
      }

      if (resolvedColumnDef.accessorFn) {
        return resolvedColumnDef.id
      }

      return null
    },
    // footer: props => props.header.column.id,
    cell: props => props.renderValue<any>()?.toString?.() ?? null,
    ...table._features.reduce((obj, feature) => {
      return Object.assign(obj, feature.getDefaultColumnDef?.())
    }, {}),
    ...defaultColumn,
  } as Partial<ColumnDef<TData, unknown>>
}

export function getAllTableColumns<
  TData extends RowData,
  TValue extends CellValue = CellValue,
  
>({
  columnDefs,
  table,
}: {
  columnDefs: ColumnDef<TData, TValue>[]
  table: CoreTable<TData>
}): CoreColumn<TData, TValue>[] {
  const recurseColumns = (
    columnDefs: ColumnDef<TData, unknown>[],
    parent?: CoreColumn<TData, TValue>,
    depth = 0
  ): CoreColumn<TData, TValue>[] => {
    return columnDefs.map(columnDef => {
      const column = createCoreColumn(table, columnDef, depth, parent)

      const groupingColumnDef = columnDef as GroupColumnDef<TData, unknown>

      column.columns = groupingColumnDef.columns
        ? recurseColumns(groupingColumnDef.columns, column, depth + 1)
        : []

      return column
    })
  }

  return recurseColumns(columnDefs)
}

export function getAllTableFlatColumns<
  TData extends RowData,
  TValue extends CellValue = CellValue,
  
>({ allColumns }: { allColumns: CoreColumn<TData, TValue>[]; table: CoreTable<TData> }) {
  return allColumns.flatMap(column => {
    return column.getFlatColumns()
  })
}

export function _getAllTableFlatColumnsById<
  TData extends RowData,
>({ flatColumns }: { flatColumns: CoreColumn<TData, unknown>[]; table: CoreTable<TData> }) {
  return flatColumns.reduce(
    (acc, column) => {
      acc[column.id] = column
      return acc
    },
    {} as Record<string, CoreColumn<TData, unknown>>
  )
}

export function getAllTableLeafColumns<
  TData extends RowData,
>({ allColumns }: { allColumns: CoreColumn<TData, unknown>[]; table: CoreTable<TData> }) {
  let leafColumns = allColumns.flatMap(column => column.getLeafColumns())
  return orderColumns(leafColumns)
}

export function getTableColumn<TData extends RowData>({
  columnId,
  table,
}: {
  table: CoreTable<TData>
  columnId: string
}) {
  const column = table._getAllFlatColumnsById()[columnId]

  if (process.env.NODE_ENV !== 'production' && !column) {
    console.error(`[Table] Column with id '${columnId}' does not exist.`)
  }

  return column
}
