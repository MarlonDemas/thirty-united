const MAX_LEN = 24

/** Compare key: NFKC, case-folded, punctuation stripped (letters, marks, inner apostrophes and hyphens stay). */
const key = (t: string) =>
  t
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{M}'\u2019-]/gu, "")
    .replace(/^['\u2019-]+|['\u2019-]+$/g, "")

/** Same stripping for display, but the guest's own casing and characters stay. */
const clean = (t: string) => t.replace(/[^\p{L}\p{M}'\u2019-]/gu, "").replace(/^['\u2019-]+|['\u2019-]+$/g, "")

const tokens = (s: string) => s.replace(/\p{Cf}/gu, "").split(/[^\p{L}\p{M}'’-]+/u).filter(Boolean)

/**
 * The shirt carries the name a guest goes by, never the surname: the preferred name, or else the first name.
 * Any token that matches a surname token (any position, any case, any Unicode form, punctuation ignored) is dropped,
 * unless that would leave nothing. The result is upper-cased, control-free and capped at 24 characters.
 */
export function shirtName(v: { preferredName?: string; firstName?: string; surname?: string }): string {
  const name = tokens(v.preferredName?.trim() || v.firstName?.trim() || "").filter((t) => clean(t))
  const surTokens = tokens(v.surname ?? "")
  const sur = new Set(surTokens.flatMap((t) => t.split("-")).map(key).filter(Boolean))
  const full = key(surTokens.join("-"))
  if (full) sur.add(full)
  const kept = name.filter((t) => !sur.has(key(t)))
  const out = (kept.length ? kept : name).map((t) => clean(t).toLocaleUpperCase())
  let line = ""
  for (const t of out) {
    const next = line ? `${line} ${t}` : t
    if (next.length > MAX_LEN) break
    line = next
  }
  return line || Array.from(out[0] ?? "").slice(0, MAX_LEN).join("")
}

/** The number is the seat (`ticketNo`), and only once the code is verified: before that the shirt has none. */
export function shirtNumber(ticketNo: number | undefined, verified: boolean): string | null {
  return verified && ticketNo !== undefined && Number.isFinite(ticketNo) ? String(ticketNo) : null
}
