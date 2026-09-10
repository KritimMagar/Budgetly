import { createId } from '../domain/ids.js'

/**
 * Action creators own the impure bits — ids and timestamps — so the reducer
 * stays a pure function of (state, action) and is trivially testable.
 */

export function addTransaction(value, now = Date.now()) {
  return {
    type: 'transaction/add',
    payload: { ...value, id: createId('txn'), createdAt: now, updatedAt: now },
  }
}

export function updateTransaction(id, value, now = Date.now()) {
  return { type: 'transaction/update', payload: { id, value, updatedAt: now } }
}

export function deleteTransaction(id) {
  return { type: 'transaction/delete', payload: { id } }
}

export function addCategory(name, colorKey) {
  return { type: 'category/add', payload: { id: createId('cat'), name, colorKey } }
}

export function renameCategory(id, name) {
  return { type: 'category/rename', payload: { id, name } }
}

/** Transactions in the removed category move to `reassignTo`. */
export function deleteCategory(id, reassignTo) {
  return { type: 'category/delete', payload: { id, reassignTo } }
}

/** `cents` of null clears the budget for that category. */
export function setBudget(categoryId, cents) {
  return { type: 'budget/set', payload: { categoryId, cents } }
}

export function updateSettings(patch) {
  return { type: 'settings/update', payload: patch }
}

export function replaceState(state) {
  return { type: 'state/replace', payload: state }
}
