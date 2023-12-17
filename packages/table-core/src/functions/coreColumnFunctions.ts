import { CoreColumn } from '../core/column'
import { CellData, RowData } from '../types'
import { _getTableOrderColumnsFn } from './orderingFunctions'

export function getColumnFlatColumns<
  TData extends RowData,
  TValue extends CellData = CellData,
>({ column }: { column: CoreColumn<TData, TValue> }) {
  return [
    column as CoreColumn<TData, TValue>,
    ...column.columns?.flatMap(d => d.getFlatColumns()),
  ]
}

export function getColumnLeafColumns<
  TData extends RowData,
  TValue extends CellData = CellData,
>({
  column,
}: {
  column: CoreColumn<TData, TValue>
}): CoreColumn<TData, TValue>[] {
  if (column.columns?.length) {
    let leafColumns = column.columns.flatMap(column =>
      getColumnLeafColumns({ column })
    )

    return _getTableOrderColumnsFn({ columns: leafColumns })
  }

  return [column as CoreColumn<TData, TValue>]
}
