import {
  _getAllRowCellsByColumnId,
  getAllRowCells,
  getRowLeafRows,
  getRowParentRow,
  getRowParentRows,
  getRowValue,
  getUniqueRowValues,
  renderRowValue,
} from '../functions/coreRowFunctions'
import { RowData, Cell, Row, Table, CellData } from '../types'
import { memo } from '../utils'
import { CoreCell } from './cell'
import { CoreTable } from './table'

// row instance types
export interface CoreRow<
  TData extends RowData,
> {
  _getAllCellsByColumnId: () => Record<string, Cell<TData, unknown>>
  _uniqueValuesCache: Record<string, unknown>
  _valuesCache: Record<string, unknown>
  /**
   * The depth of the row (if nested or grouped) relative to the root row array.
   * @link [API Docs](https://tanstack.com/table/v8/docs/api/core/row#depth)
   * @link [Guide](https://tanstack.com/table/v8/docs/guide/rows)
   */
  depth: number
  /**
   * Returns all of the cells for the row.
   * @link [API Docs](https://tanstack.com/table/v8/docs/api/core/row#getallcells)
   * @link [Guide](https://tanstack.com/table/v8/docs/guide/rows)
   */
  getAllCells: () => CoreCell<TData, unknown>[]
  /**
   * Returns the leaf rows for the row, not including any parent rows.
   * @link [API Docs](https://tanstack.com/table/v8/docs/api/core/row#getleafrows)
   * @link [Guide](https://tanstack.com/table/v8/docs/guide/rows)
   */
  getLeafRows: () => CoreRow<TData>[]
  /**
   * Returns the parent row for the row, if it exists.
   * @link [API Docs](https://tanstack.com/table/v8/docs/api/core/row#getparentrow)
   * @link [Guide](https://tanstack.com/table/v8/docs/guide/rows)
   */
  getParentRow: () => CoreRow<TData> | undefined
  /**
   * Returns the parent rows for the row, all the way up to a root row.
   * @link [API Docs](https://tanstack.com/table/v8/docs/api/core/row#getparentrows)
   * @link [Guide](https://tanstack.com/table/v8/docs/guide/rows)
   */
  getParentRows: () => CoreRow<TData>[]
  /**
   * Returns a unique array of values from the row for a given columnId.
   * @link [API Docs](https://tanstack.com/table/v8/docs/api/core/row#getuniquevalues)
   * @link [Guide](https://tanstack.com/table/v8/docs/guide/rows)
   */
  getUniqueValues: <TValue>(columnId: string) => TValue[]
  /**
   * Returns the value from the row for a given columnId.
   * @link [API Docs](https://tanstack.com/table/v8/docs/api/core/row#getvalue)
   * @link [Guide](https://tanstack.com/table/v8/docs/guide/rows)
   */
  getValue: <TValue>(columnId: string) => TValue
  /**
   * The resolved unique identifier for the row resolved via the `options.getRowId` option. Defaults to the row's index (or relative index if it is a subRow).
   * @link [API Docs](https://tanstack.com/table/v8/docs/api/core/row#id)
   * @link [Guide](https://tanstack.com/table/v8/docs/guide/rows)
   */
  id: string
  /**
   * The index of the row within its parent array (or the root data array).
   * @link [API Docs](https://tanstack.com/table/v8/docs/api/core/row#index)
   * @link [Guide](https://tanstack.com/table/v8/docs/guide/rows)
   */
  index: number
  /**
   * The original row object provided to the table. If the row is a grouped row, the original row object will be the first original in the group.
   * @link [API Docs](https://tanstack.com/table/v8/docs/api/core/row#original)
   * @link [Guide](https://tanstack.com/table/v8/docs/guide/rows)
   */
  original: TData
  /**
   * An array of the original subRows as returned by the `options.getSubRows` option.
   * @link [API Docs](https://tanstack.com/table/v8/docs/api/core/row#originalsubrows)
   * @link [Guide](https://tanstack.com/table/v8/docs/guide/rows)
   */
  originalSubRows?: TData[]
  /**
   * If nested, this row's parent row id.
   * @link [API Docs](https://tanstack.com/table/v8/docs/api/core/row#parentid)
   * @link [Guide](https://tanstack.com/table/v8/docs/guide/rows)
   */
  parentId?: string
  /**
   * Renders the value for the row in a given columnId the same as `getValue`, but will return the `renderFallbackValue` if no value is found.
   * @link [API Docs](https://tanstack.com/table/v8/docs/api/core/row#rendervalue)
   * @link [Guide](https://tanstack.com/table/v8/docs/guide/rows)
   */
  renderValue: <TValue>(columnId: string) => TValue
  /**
   * An array of subRows for the row as returned and created by the `options.getSubRows` option.
   * @link [API Docs](https://tanstack.com/table/v8/docs/api/core/row#subrows)
   * @link [Guide](https://tanstack.com/table/v8/docs/guide/rows)
   */
  subRows: CoreRow<TData>[]
}

// row instance creation
export const createRow = <TData extends RowData>(
  table: CoreTable<TData>,
  id: string,
  original: TData,
  rowIndex: number,
  depth: number,
  subRows?: Row<TData>[],
  parentId?: string
): CoreRow<TData> => {
  const row: CoreRow<TData> = {
    id,
    index: rowIndex,
    original,
    depth,
    parentId,
    subRows: subRows ?? [],
    _valuesCache: {},
    _uniqueValuesCache: {},
    getValue: columnId =>
      getRowValue({ columnId, row: row as Row<TData>, rowIndex, table }),
    getUniqueValues: columnId =>
      getUniqueRowValues({ columnId, row: row as Row<TData>, rowIndex, table }),
    renderValue: columnId =>
      renderRowValue({ row: row as Row<TData>, columnId, table }),
    getLeafRows: () => getRowLeafRows({ row }),
    getParentRow: () => getRowParentRow({ row, table }),
    getParentRows: () => getRowParentRows({ row, table }),
    getAllCells: memo(
      () => [table.getAllLeafColumns()],
      leafColumns =>
        getAllRowCells({ leafColumns, row: row as Row<TData>, table }),
      {
        key: process.env.NODE_ENV === 'development' && 'row.getAllCells',
        debug: () => table.options.debugAll ?? table.options.debugRows,
      }
    ),
    _getAllCellsByColumnId: memo(
      () => [row.getAllCells()],
      allCells => {
        return _getAllRowCellsByColumnId({ allCells })
      },
      {
        key:
          process.env.NODE_ENV === 'production' && 'row.getAllCellsByColumnId',
        debug: () => table.options.debugAll ?? table.options.debugRows,
      }
    ),
  }

  for (let i = 0; i < table._features.length; i++) {
    const feature = table._features[i]
    feature?.createRow?.(row, table)
  }

  return row as Row<TData>
}
