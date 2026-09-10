/** Collision-resistant enough for a single-device, single-user store. */
export function createId(prefix) {
  const time = Date.now().toString(36)
  let random
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    random = crypto.getRandomValues(new Uint32Array(1))[0].toString(36)
  } else {
    random = Math.floor(Math.random() * 0xffffffff).toString(36)
  }
  return `${prefix}_${time}${random}`
}
