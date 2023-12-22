import { CoreCell } from '../core/cell'
import { CoreColumn } from '../core/column'
import { CoreRow } from '../core/row'
import { CoreTable } from '../core/table'
import { CellValue, RowData } from '../types'
import { getRowValue } from './coreRowFunctions'

export function getCellValue<
  TData extends RowData,
  TValue extends CellValue = CellValue,
>({
  column,
  row,
}: {
  row: CoreRow<TData>
  column: CoreColumn<TData, TValue>
}): TValue {
  return getRowValue({ column, row })
}

export function renderCellValue<
  TData extends RowData,
  TValue extends CellValue = CellValue,
>({ cell, table }: { cell: CoreCell<TData, TValue>; table: CoreTable<TData> }) {
  return (
    getCellValue({ row: cell.row, column: cell.column }) ??
    table?.options?.renderFallbackValue
  )
}

export function getCellContext<
  TData extends RowData,
  TValue extends CellValue = CellValue
>({ cell, table }: { cell: CoreCell<TData, TValue>; table: CoreTable<TData> }) {
  return {
    table,
    column: cell.column,
    row: cell.row,
    cell,
    getValue: () => getCellValue({ row: cell.row, column: cell.column }),
    renderValue: () => renderCellValue({ cell, table }),
  }
}
