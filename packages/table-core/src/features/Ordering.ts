import { makeStateUpdater, memo } from '../utils'

import { Table, OnChangeFn, Updater, Column, RowData } from '../types'

import { TableFeature } from '../core/table'
import { _getTableOrderColumnsFn } from '../functions/orderingFunctions'

export interface ColumnOrderTableState {
  columnOrder: ColumnOrderState
}

export type ColumnOrderState = string[]

export interface ColumnOrderOptions {
  /**
   * If provided, this function will be called with an `updaterFn` when `state.columnOrder` changes. This overrides the default internal state management, so you will need to persist the state change either fully or partially outside of the table.
   * @link [API Docs](https://tanstack.com/table/v8/docs/api/features/column-ordering#oncolumnorderchange)
   * @link [Guide](https://tanstack.com/table/v8/docs/guide/column-ordering)
   */
  onColumnOrderChange?: OnChangeFn<ColumnOrderState>
}

export interface ColumnOrderDefaultOptions {
  onColumnOrderChange: OnChangeFn<ColumnOrderState>
}

export interface ColumnOrderInstance<TData extends RowData> {
  _getOrderColumnsFn: () => (
    columns: Column<TData, unknown>[]
  ) => Column<TData, unknown>[]
  /**
   * Resets the **columnOrder** state to `initialState.columnOrder`, or `true` can be passed to force a default blank state reset to `[]`.
   * @link [API Docs](https://tanstack.com/table/v8/docs/api/features/column-ordering#resetcolumnorder)
   * @link [Guide](https://tanstack.com/table/v8/docs/guide/column-ordering)
   */
  resetColumnOrder: (defaultState?: boolean) => void
  /**
   * Sets or updates the `state.columnOrder` state.
   * @link [API Docs](https://tanstack.com/table/v8/docs/api/features/column-ordering#setcolumnorder)
   * @link [Guide](https://tanstack.com/table/v8/docs/guide/column-ordering)
   */
  setColumnOrder: (updater: Updater<ColumnOrderState>) => void
}

//

export const Ordering: TableFeature = {
  getInitialState: (state): ColumnOrderTableState => {
    return {
      columnOrder: [],
      ...state,
    }
  },

  getDefaultOptions: <TData extends RowData>(
    table: Table<TData>
  ): ColumnOrderDefaultOptions => {
    return {
      onColumnOrderChange: makeStateUpdater('columnOrder', table),
    }
  },

  createTable: <TData extends RowData>(table: Table<TData>): void => {
    table.setColumnOrder = updater =>
      table.options.onColumnOrderChange?.(updater)
    table.resetColumnOrder = defaultState => {
      table.setColumnOrder(
        defaultState ? [] : table.initialState.columnOrder ?? []
      )
    }
    table._getOrderColumnsFn = memo(
      () => [
        table.getState().columnOrder,
        table.getState().grouping,
        table.options.groupedColumnMode,
      ],
      (columnOrder, grouping, groupedColumnMode) => columns => {
        return _getTableOrderColumnsFn({ columns, table })
      },
      {
        key: process.env.NODE_ENV === 'development' && 'getOrderColumnsFn',
        // debug: () => table.options.debugAll ?? table.options.debugTable,
      }
    )
  },
}
