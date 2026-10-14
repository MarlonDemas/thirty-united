/** Seat number is reply order, shown as three digits: 007. Undefined means not assigned yet. */
export function formatSeat(n: number | undefined): string {
  return n === undefined ? "---" : String(n).padStart(3, "0")
}
