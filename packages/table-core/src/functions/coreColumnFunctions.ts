import { CoreColumn } from '../core/column'
import { CellData, RowData } from '../types'
import { _getTableOrderColumnsFn } from './orderingFunctions'

export function getColumnFlatColumns<
  TData extends RowData,
  TValue extends CellData = CellData,
  TColumn extends CoreColumn<TData, TValue> = CoreColumn<TData, TValue>
>({ column }: { column: TColumn }) {
  return [
    column as TColumn,
    ...column.columns?.flatMap(d => d.getFlatColumns()),
  ]
}

export function getColumnLeafColumns<
  TData extends RowData,
  TValue extends CellData = CellData,
  TColumn extends CoreColumn<TData, TValue> = CoreColumn<TData, TValue>
>({ column }: { column: TColumn }): TColumn[] {
  if (column.columns?.length) {
    let leafColumns = column.columns.flatMap(column =>
      getColumnLeafColumns({ column })
    )

    return _getTableOrderColumnsFn({ columns: leafColumns })
  }

  return [column as TColumn]
}
