import { RequiredKeys, functionalUpdate, orderColumns } from '..'
import { CoreColumn, createColumn } from '../core/column'
import { CoreTable } from '../core/table'
import {
  CellData,
  ColumnDef,
  ColumnDefResolved,
  GroupColumnDef,
  RowData,
  TableOptionsResolved,
  TableState,
  Updater,
} from '../types'
import { getRowParentRow } from './coreRowFunctions'

export function mergeTableOptions<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({
  table,
  defaultOptions,
  options,
}: {
  table: TTable
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

export function resetTable<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ table }: { table: TTable }) {
  table.setState(table.initialState)
}

export function setTableOptions<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({
  defaultOptions,
  table,
}: {
  table: TTable
  defaultOptions: TableOptionsResolved<TData>
}) {
  const newOptions = functionalUpdate(updater, table.options)
  table.options = mergeTableOptions({
    table,
    defaultOptions,
    options: newOptions,
  }) as RequiredKeys<TableOptionsResolved<TData>, 'state'>
}

export function getTableState<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ table }: { table: TTable }): TableState {
  return table.options.state as TableState
}

export function setTableState<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ updater, table }: { table: TTable; updater: Updater<TableState> }) {
  table.options.onStateChange?.(updater)
}

export function _getRowId<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
  TRow extends TData = TData,
>({ row, table }: { row: TRow; table: TTable }) {
  const parentRow = getRowParentRow({ row, table })
  return (
    table.options.getRowId?.(row.original, row.index, parentRow) ??
    `${parentRow ? [parentRow.id, row.index].join('.') : row.index}`
  )
}

export function getTableCoreRowModel<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
  TRow extends TData = TData,
>({ table }: { table: TTable }) {
  if (!table._getCoreRowModel) {
    table._getCoreRowModel = table.options.getCoreRowModel(table)
  }

  return table._getCoreRowModel!()
}

export function getTableRowModel<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ table }: { table: TTable }) {
  return table.getPaginationRowModel()
}

export function getTableRow<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({
  rowId,
  searchAll,
  table,
}: {
  rowId: string
  searchAll: boolean
  table: TTable
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

export function _getTableDefaultColumnDef<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({
  defaultColumn,
  table,
}: {
  defaultColumn?: Partial<ColumnDef<TData, unknown>>
  table: TTable
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
  TValue extends CellData = CellData,
  TColumn extends CoreColumn<TData, TValue> = CoreColumn<TData, TValue>,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({
  columnDefs,
  table,
}: {
  columnDefs: ColumnDef<TData, TValue>[]
  table: TTable
}): TColumn[] {
  const recurseColumns = (
    columnDefs: ColumnDef<TData, unknown>[],
    parent?: TColumn,
    depth = 0
  ): TColumn[] => {
    return columnDefs.map(columnDef => {
      const column = createColumn(table, columnDef, depth, parent)

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
  TValue extends CellData = CellData,
  TColumn extends CoreColumn<TData, TValue> = CoreColumn<TData, TValue>,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ allColumns }: { allColumns: TColumn[]; table: TTable }) {
  return allColumns.flatMap(column => {
    return column.getFlatColumns()
  })
}

export function _getAllTableFlatColumnsById<
  TData extends RowData,
  TValue extends CellData = CellData,
  TColumn extends CoreColumn<TData, TValue> = CoreColumn<TData, TValue>,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ flatColumns }: { flatColumns: TColumn[]; table: TTable }) {
  return flatColumns.reduce(
    (acc, column) => {
      acc[column.id] = column
      return acc
    },
    {} as Record<string, TColumn>
  )
}

export function getAllTableLeafColumns<
  TData extends RowData,
  TValue extends CellData = CellData,
  TColumn extends CoreColumn<TData, TValue> = CoreColumn<TData, TValue>,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ allColumns }: { allColumns: TColumn[]; table: TTable }) {
  let leafColumns = allColumns.flatMap(column => column.getLeafColumns())
  return orderColumns(leafColumns)
}

export function getTableColumn<
  TData extends RowData,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ columnId, table }: { table: TTable; columnId: string }) {
  const column = table._getAllFlatColumnsById()[columnId]

  if (process.env.NODE_ENV !== 'production' && !column) {
    console.error(`[Table] Column with id '${columnId}' does not exist.`)
  }

  return column
}
