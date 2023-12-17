import { CoreCell } from '../core/cell'
import { CoreColumn } from '../core/column'
import { CoreRow } from '../core/row'
import { CoreTable } from '../core/table'
import { CellData, RowData } from '../types'
import { getRowValue } from './coreRowFunctions'

export function getCellValue<
  TData extends RowData,
  TValue extends CellData = CellData,
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
  TValue extends CellData = CellData,
  TCell extends CoreCell<TData, TValue> = CoreCell<TData, TValue>,
>({ cell, table }: { cell: TCell; table: CoreTable<TData> }) {
  return (
    getCellValue({ row: cell.row, columnId: cell.column.id }) ??
    table?.options?.renderFallbackValue
  )
}

export function getCellContext<
  TData extends RowData,
  TValue extends CellData = CellData,
  TCell extends CoreCell<TData, TValue> = CoreCell<TData, TValue>,
>({ cell, table }: { cell: TCell; table: CoreTable<TData> }) {
  return {
    table,
    column: cell.column,
    row: cell.row,
    cell,
    getValue: () => getCellValue({ row: cell.row, columnId: cell.column.id }),
    renderValue: () => renderCellValue({ cell, table }),
  }
}
