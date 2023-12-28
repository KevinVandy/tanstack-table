import { CoreColumn } from '../core/column'
import { CoreTable } from '../core/table'
import { VisibilityState } from '../features/Visibility'
import { CellValue, RowData, Updater } from '../types'
import { memo } from '../utils'
import { getAllTableLeafColumns } from './coreTableFunctions'

//state functions

export function setColumnVisibilityState<TData extends RowData>({
  table,
  updater,
}: {
  table: CoreTable<TData>
  updater: Updater<VisibilityState>
}) {
  table.options.onColumnVisibilityChange?.(updater)
}

export function resetColumnVisibilityState<TData extends RowData>({
  defaultState,
  table,
}: {
  defaultState?: boolean
  table: CoreTable<TData>
}) {
  setColumnVisibilityState({
    table,
    updater: defaultState ? {} : table.initialState.columnVisibility ?? {},
  })
}

//table functions

export function toggleTableAllColumnsVisible<TData extends RowData>({
  table,
  value,
}: {
  table: CoreTable<TData>
  value?: boolean
}) {
  value = value ?? getTableIsAllColumnsVisible({ table })

  setColumnVisibilityState({
    table,
    updater: table.getAllLeafColumns().reduce(
      (obj, column) => ({
        ...obj,
        [column.id]: !value ? !getCanColumnHide({ column, table }) : value,
      }),
      {}
    ),
  })
}

export function getTableIsAllColumnsVisible<TData extends RowData>({
  table,
}: {
  table: CoreTable<TData>
}) {
  return !table
    .getAllLeafColumns()
    .some(column => getIsColumnVisible({ column, table }))
}

export function getTableIsSomeColumnsVisible<TData extends RowData>({
  table,
}: {
  table: CoreTable<TData>
}) {
  return table
    .getAllLeafColumns()
    .some(column => getIsColumnVisible({ column, table }))
}

export function getTableToggleAllColumnsVisibilityHandler<
  TData extends RowData,
>({ table }: { table: CoreTable<TData> }) {
  return (e: unknown) => {
    toggleTableAllColumnsVisible({
      table,
      value: ((e as MouseEvent).target as HTMLInputElement)?.checked,
    })
  }
}

//private factory
const makeVisibleColumnsMethod = <TData extends RowData>(
  table: CoreTable<TData>,
  key: string,
  getColumns: () => CoreColumn<TData, unknown>[]
): (() => CoreColumn<TData, unknown>[]) => {
  return memo(
    () => [
      getColumns(),
      getColumns()
        .filter(d => d.getIsVisible())
        .map(d => d.id)
        .join('_'),
    ],
    columns => {
      return columns.filter(d => d.getIsVisible?.())
    },
    {
      key,
      debug: () => table.options.debugAll ?? table.options.debugColumns,
    }
  )
}

export function getTableVisibleFlatColumns<TData extends RowData>({
  table,
}: {
  table: CoreTable<TData>
}) {
  return makeVisibleColumnsMethod(table, 'getVisibleFlatColumns', () =>
    table.getAllFlatColumns()
  )
}

export function getTableVisibleLeafColumns<TData extends RowData>({
  table,
}: {
  table: CoreTable<TData>
}) {
  return makeVisibleColumnsMethod(table, 'getVisibleLeafColumns', () =>
    table.getAllLeafColumns()
  )
}

export function getTableLeftVisibleLeafColumns<TData extends RowData>({
  table,
}: {
  table: CoreTable<TData>
}) {
  return makeVisibleColumnsMethod(table, 'getLeftVisibleLeafColumns', () =>
    table.getLeftLeafColumns()
  )
}

export function getTableRightVisibleLeafColumns<TData extends RowData>({
  table,
}: {
  table: CoreTable<TData>
}) {
  return makeVisibleColumnsMethod(table, 'getRightVisibleLeafColumns', () =>
    table.getRightLeafColumns()
  )
}

export function getTableCenterVisibleLeafColumns<TData extends RowData>({
  table,
}: {
  table: CoreTable<TData>
}) {
  return makeVisibleColumnsMethod(table, 'getCenterVisibleLeafColumns', () =>
    table.getCenterLeafColumns()
  )
}

//column functions

export function toggleColumnVisibility<
  TData extends RowData,
  TValue extends CellValue,
>({
  column,
  table,
  value,
}: {
  column: CoreColumn<TData, TValue>
  table: CoreTable<TData>
  value?: boolean
}) {
  if (getCanColumnHide({ column, table })) {
    setColumnVisibilityState({
      table,
      updater: old => ({
        ...old,
        [column.id]: value ?? !getIsColumnVisible({ column, table }),
      }),
    })
  }
}

export function getIsColumnVisible<TData extends RowData, TValue>({
  column,
  table,
}: {
  column: CoreColumn<TData, TValue>
  table: CoreTable<TData>
}) {
  return table.getState().columnVisibility?.[column.id] ?? true
}

export function getCanColumnHide<TData extends RowData, TValue>({
  column,
  table,
}: {
  column: CoreColumn<TData, TValue>
  table: CoreTable<TData>
}) {
  return (
    (column.columnDef.enableHiding ?? true) &&
    (table.options.enableHiding ?? true)
  )
}

export function getColumnToggleVisibilityHandler<
  TData extends RowData,
  TValue extends CellValue,
>({
  column,
  table,
}: {
  column: CoreColumn<TData, TValue>
  table: CoreTable<TData>
}) {
  return (e: unknown) => {
    toggleColumnVisibility({
      column,
      table,
      value: ((e as MouseEvent).target as HTMLInputElement).checked,
    })
  }
}

//row functions
