import { CoreCell, createCell } from '../core/cell'
import { CoreColumn } from '../core/column'
import { CoreRow } from '../core/row'
import { CoreTable } from '../core/table'
import { CellData, RowData } from '../types'
import { flattenBy } from '../utils'

export function getRowValue<
  TData extends RowData,
  TValue extends CellData = CellData,
  TColumn extends CoreColumn<TData, TValue> = CoreColumn<TData, TValue>,
  TRow extends CoreRow<TData> = CoreRow<TData>,
>({ column, row }: { column: TColumn; row: TRow }) {
  const columnId = column.id
  if (row._valuesCache.hasOwnProperty(columnId)) {
    return row._valuesCache[columnId]
  }

  if (!column?.accessorFn) {
    return undefined
  }

  row._valuesCache[columnId] = column.accessorFn(
    row.original as TData,
    row.index
  )

  return row._valuesCache[columnId] as any
}

export function getUniqueRowValues<
  TData extends RowData,
  TValue extends CellData = CellData,
  TColumn extends CoreColumn<TData, TValue> = CoreColumn<TData, TValue>,
  TRow extends CoreRow<TData> = CoreRow<TData>,
>({ column, row }: { column: TColumn; row: TRow }) {
  const columnId = column.id
  if (row._uniqueValuesCache.hasOwnProperty(columnId)) {
    return row._uniqueValuesCache[columnId]
  }

  if (!column?.accessorFn) {
    return undefined
  }

  if (!column.columnDef.getUniqueValues) {
    row._uniqueValuesCache[columnId] = [row.getValue(columnId)]
    return row._uniqueValuesCache[columnId]
  }

  row._uniqueValuesCache[columnId] = column.columnDef.getUniqueValues(
    row.original,
    row.index
  )

  return row._uniqueValuesCache[columnId] as any
}

export function renderRowValue<
  TData extends RowData,
  TValue extends CellData = CellData,
  TColumn extends CoreColumn<TData, TValue> = CoreColumn<TData, TValue>,
  TRow extends CoreRow<TData> = CoreRow<TData>,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ column, row, table }: { column: TColumn; row: TRow; table: TTable }) {
  return row.getValue(column.id) ?? table.options.renderFallbackValue
}

export function getRowLeafRows<
  TData extends RowData,
  TRow extends CoreRow<TData> = CoreRow<TData>,
>({ row }: { row: TRow }): TRow[] {
  return flattenBy(row.subRows, d => d.subRows)
}

export function getRowParentRow<
  TData extends RowData,
  TRow extends CoreRow<TData> = CoreRow<TData>,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ row, table }: { row: TRow; table: TTable }): TRow | undefined {
  return row.parentId ? table.getRow(row.parentId, true) : undefined
}

export function getRowParentRows<
  TData extends RowData,
  TRow extends CoreRow<TData> = CoreRow<TData>,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({ row, table }: { row: TRow; table: TTable }): TRow[] {
  let parentRows: TRow[] = []
  let currentRow = row
  while (true) {
    const parentRow = getRowParentRow({ row: currentRow, table })
    if (!parentRow) break
    parentRows.push(parentRow)
    currentRow = parentRow
  }
  return parentRows.reverse()
}

export function getAllRowCells<
  TData extends RowData,
  TValue extends CellData = CellData,
  TCell extends CoreCell<TData, TValue> = CoreCell<TData, TValue>,
  TColumn extends CoreColumn<TData, TValue> = CoreColumn<TData, TValue>,
  TRow extends CoreRow<TData> = CoreRow<TData>,
  TTable extends CoreTable<TData> = CoreTable<TData>,
>({
  leafColumns,
  row,
  table,
}: {
  leafColumns: TColumn[]
  row: TRow
  table: TTable
}): TCell[] {
  return leafColumns.map(column => {
    return createCell(table, row, column)
  })
}

export function _getAllRowCellsByColumnId<
  TData extends RowData,
  TValue extends CellData = CellData,
  TCell extends CoreCell<TData, TValue> = CoreCell<TData, TValue>,
>({ allCells }: { allCells: TCell[] }): Record<string, TCell> {
  return allCells.reduce(
    (acc, cell) => {
      acc[cell.column.id] = cell
      return acc
    },
    {} as Record<string, TCell>
  )
}
