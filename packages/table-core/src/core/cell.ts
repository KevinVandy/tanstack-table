import { CellValue, RowData } from '../types'
import { Getter, memo } from '../utils'
import { CoreColumn } from './column'
import { CoreRow } from './row'
import { CoreTable } from './table'

export interface CellContext<TData extends RowData, TValue> {
  cell: CoreCell<TData, TValue>
  column: CoreColumn<TData, TValue>
  getValue: Getter<TValue>
  renderValue: Getter<TValue | null>
  row: CoreRow<TData>
  table: CoreTable<TData>
}

export interface CoreCell<TData extends RowData, TValue> {
  /**
   * The associated Column object for the cell.
   * @link [API Docs](https://tanstack.com/table/v8/docs/api/core/cell#column)
   * @link [Guide](https://tanstack.com/table/v8/docs/guide/cells)
   */
  column: CoreColumn<TData, TValue>
  /**
   * Returns the rendering context (or props) for cell-based components like cells and aggregated cells. Use these props with your framework's `flexRender` utility to render these using the template of your choice:
   * @link [API Docs](https://tanstack.com/table/v8/docs/api/core/cell#getcontext)
   * @link [Guide](https://tanstack.com/table/v8/docs/guide/cells)
   */
  getContext: () => CellContext<TData, TValue>
  /**
   * Returns the value for the cell, accessed via the associated column's accessor key or accessor function.
   * @link [API Docs](https://tanstack.com/table/v8/docs/api/core/cell#getvalue)
   * @link [Guide](https://tanstack.com/table/v8/docs/guide/cells)
   */
  getValue: CellContext<TData, TValue>['getValue']
  /**
   * The unique ID for the cell across the entire table.
   * @link [API Docs](https://tanstack.com/table/v8/docs/api/core/cell#id)
   * @link [Guide](https://tanstack.com/table/v8/docs/guide/cells)
   */
  id: string
  /**
   * Renders the value for a cell the same as `getValue`, but will return the `renderFallbackValue` if no value is found.
   * @link [API Docs](https://tanstack.com/table/v8/docs/api/core/cell#rendervalue)
   * @link [Guide](https://tanstack.com/table/v8/docs/guide/cells)
   */
  renderValue: CellContext<TData, TValue>['renderValue']
  /**
   * The associated Row object for the cell.
   * @link [API Docs](https://tanstack.com/table/v8/docs/api/core/cell#row)
   * @link [Guide](https://tanstack.com/table/v8/docs/guide/cells)
   */
  row: CoreRow<TData>
}

export function createCoreCell<TData extends RowData, TValue extends CellValue>(
  table: CoreTable<TData>,
  row: CoreRow<TData>,
  column: CoreColumn<TData, TValue>
): CoreCell<TData, TValue> {
  const getRenderValue = () =>
    cell.getValue() ?? table.options.renderFallbackValue

  const cell: CoreCell<TData, TValue> = {
    id: `${row.id}_${column.id}`,
    row,
    column,
    getValue: () => row.getValue(column.id),
    renderValue: getRenderValue,
    getContext: memo(
      () => [table, column, row, cell],
      (table, column, row, cell) => ({
        table,
        column,
        row,
        cell: cell as CoreCell<TData, TValue>,
        getValue: cell.getValue,
        renderValue: cell.renderValue,
      }),
      {
        key: process.env.NODE_ENV === 'development' && 'cell.getContext',
        debug: () => table.options.debugAll,
      }
    ),
  }

  table._features.forEach(feature => {
    feature.createCell?.(
      cell as CoreCell<TData, TValue>,
      column,
      row as CoreRow<TData>,
      table
    )
  }, {})

  return cell as CoreCell<TData, TValue>
}
