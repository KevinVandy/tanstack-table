import { CoreCell, createCoreCell } from '../core/cell'
import { CoreColumn } from '../core/column'
import { CoreRow } from '../core/row'
import { CoreTable } from '../core/table'
import { CellValue, RowData } from '../types'
import { flattenBy } from '../utils'

export function getRowValue<
  TData extends RowData,
  TValue extends CellValue = CellValue,
>({ column, row }: { column: CoreColumn<TData, TValue>; row: CoreRow<TData> }) {
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
  TValue extends CellValue = CellValue,
>({ column, row }: { column: CoreColumn<TData, TValue>; row: CoreRow<TData> }) {
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
  TValue extends CellValue = CellValue,
>({
  column,
  row,
  table,
}: {
  column: CoreColumn<TData, TValue>
  row: CoreRow<TData>
  table: CoreTable<TData>
}) {
  return row.getValue(column.id) ?? table.options.renderFallbackValue
}

export function getRowLeafRows<TData extends RowData>({
  row,
}: {
  row: CoreRow<TData>
}): CoreRow<TData>[] {
  return flattenBy(row.subRows, d => d.subRows)
}

export function getRowParentRow<TData extends RowData>({
  row,
  table,
}: {
  row: CoreRow<TData>
  table: CoreTable<TData>
}): CoreRow<TData> | undefined {
  return row.parentId ? table.getRow(row.parentId, true) : undefined
}

export function getRowParentRows<TData extends RowData>({
  row,
  table,
}: {
  row: CoreRow<TData>
  table: CoreTable<TData>
}): CoreRow<TData>[] {
  let parentRows: CoreRow<TData>[] = []
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
  TValue extends CellValue = CellValue,
>({
  leafColumns,
  row,
  table,
}: {
  leafColumns: CoreColumn<TData, TValue>[]
  row: CoreRow<TData>
  table: CoreTable<TData>
}): CoreCell<TData, TValue>[] {
  return leafColumns.map(column => {
    return createCoreCell(table, row, column)
  })
}

export function _getAllRowCellsByColumnId<
  TData extends RowData,
  TValue extends CellValue = CellValue,
>({
  allCells,
}: {
  allCells: CoreCell<TData, TValue>[]
}): Record<string, CoreCell<TData, TValue>> {
  return allCells.reduce(
    (acc, cell) => {
      acc[cell.column.id] = cell
      return acc
    },
    {} as Record<string, CoreCell<TData, TValue>>
  )
}
