import { orderColumns } from '..'
import { CoreColumn } from '../core/column'
import { CoreTable } from '../core/table'
import { CellData, RowData } from '../types'

export function _getTableOrderColumnsFn<
  TData extends RowData,
  TValue extends CellData,
  TColumn extends CoreColumn<TData, TValue>,
  TTable extends CoreTable<TData>,
>({ columns, table }: { columns: TColumn[]; table: TTable }): TColumn[] {
  const { groupedColumnMode } = table.options
  const { columnOrder, grouping } = table.getState()
  // Sort grouped columns to the start of the column list
  // before the headers are built
  let orderedColumns: TColumn[] = []

  // If there is no order, return the normal columns
  if (!columnOrder?.length) {
    orderedColumns = columns
  } else {
    const columnOrderCopy = [...columnOrder]

    // If there is an order, make a copy of the columns
    const columnsCopy = [...columns]

    // And make a new ordered array of the columns

    // Loop over the columns and place them in order into the new array
    while (columnsCopy.length && columnOrderCopy.length) {
      const targetColumnId = columnOrderCopy.shift()
      const foundIndex = columnsCopy.findIndex(d => d.id === targetColumnId)
      if (foundIndex > -1) {
        orderedColumns.push(columnsCopy.splice(foundIndex, 1)[0]!)
      }
    }

    // If there are any columns left, add them to the end
    orderedColumns = [...orderedColumns, ...columnsCopy]
  }

  return orderColumns(orderedColumns, grouping, groupedColumnMode)
}
