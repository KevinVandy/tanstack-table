import { CoreColumn } from '../core/column'
import { CoreRow } from '../core/row'
import { CoreTable } from '../core/table'
import {
  ColumnPinningPosition,
  ColumnPinningState,
  getDefaultColumnPinningState,
} from '../features/ColumnPinning'
import { RowData, Updater } from '../types'

//state functions

export function setColumnPinningState<TData extends RowData>({
  table,
  updater,
}: {
  table: CoreTable<TData>
  updater: Updater<ColumnPinningState>
}) {
  table.options.onColumnPinningChange?.(updater)
}

export function resetColumnPinningState<TData extends RowData>({
  table,
  defaultState,
}: {
  table: CoreTable<TData>
  defaultState?: boolean
}) {
  setColumnPinningState({
    table,
    updater: defaultState
      ? getDefaultColumnPinningState()
      : table.initialState?.columnPinning ?? getDefaultColumnPinningState(),
  })
}

//table functions

export function getIsSomeSomeColumnsPinned<TData extends RowData>({
  table,
  position,
}: {
  table: CoreTable<TData>
  position?: ColumnPinningPosition
}) {
  const pinningState = table.getState().columnPinning

  if (!position) {
    return Boolean(pinningState.left?.length || pinningState.right?.length)
  }
  return Boolean(pinningState[position]?.length)
}

export function getLeftLeafColumns<TData extends RowData>({
  table,
}: {
  table: CoreTable<TData>
}) {
  const allColumns = table.getAllLeafColumns()
  const left = table.getState().columnPinning.left
  return (left ?? [])
    .map(columnId => allColumns.find(column => column.id === columnId)!)
    .filter(Boolean)
}

export function getRightLeafColumns<TData extends RowData>({
  table,
}: {
  table: CoreTable<TData>
}) {
  const allColumns = table.getAllLeafColumns()
  const right = table.getState().columnPinning.right
  return (right ?? [])
    .map(columnId => allColumns.find(column => column.id === columnId)!)
    .filter(Boolean)
}

export function getCenterLeafColumns<TData extends RowData>({
  table,
}: {
  table: CoreTable<TData>
}) {
  const allColumns = table.getAllLeafColumns()
  const { left, right } = table.getState().columnPinning
  const leftAndRight: string[] = [...(left ?? []), ...(right ?? [])]
  return allColumns.filter(d => !leftAndRight.includes(d.id))
}

//row functions

export function getCenterVisibleCells<TData extends RowData>({
  table,
  row,
}: {
  table: CoreTable<TData>
  row: CoreRow<TData>
}) {
  const allCells = row._getAllVisibleCells()
  const { left, right } = table.getState().columnPinning
  const leftAndRight: string[] = [...(left ?? []), ...(right ?? [])]

  return allCells.filter(d => !leftAndRight.includes(d.column.id))
}

export function getLeftVisibleCells<TData extends RowData>({
  table,
  row,
}: {
  table: CoreTable<TData>
  row: CoreRow<TData>
}) {
  const allCells = row._getAllVisibleCells()
  const { left, right } = table.getState().columnPinning
  const cells = (left ?? [])
    .map(columnId => allCells.find(cell => cell.column.id === columnId)!)
    .filter(Boolean)
    .map(d => ({ ...d, position: 'left' }) as Cell<TData, unknown>)

  return cells
}

export function getRightVisibleCells<TData extends RowData>({
  table,
  row,
}: {
  table: CoreTable<TData>
  row: CoreRow<TData>
}) {
  const allCells = row._getAllVisibleCells()
  const { left, right } = table.getState().columnPinning
  const cells = (right ?? [])
    .map(columnId => allCells.find(cell => cell.column.id === columnId)!)
    .filter(Boolean)
    .map(d => ({ ...d, position: 'right' }) as Cell<TData, unknown>)

  return cells
}
