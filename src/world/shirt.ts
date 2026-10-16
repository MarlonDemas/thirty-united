const MAX_LEN = 24

/** Compare key: NFKC, case-folded, punctuation stripped (letters, marks, inner apostrophes and hyphens stay). */
export const nameKey = (t: string) =>
  t
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{M}'\u2019-]/gu, "")
    .replace(/^['\u2019-]+|['\u2019-]+$/g, "")

/** Same stripping for display, but the guest's own casing and characters stay. */
const clean = (t: string) => t.replace(/[^\p{L}\p{M}'\u2019-]/gu, "").replace(/^['\u2019-]+|['\u2019-]+$/g, "")

const tokens = (s: string) => s.replace(/\p{Cf}/gu, "").split(/[^\p{L}\p{M}'’-]+/u).filter(Boolean)

/** An email address, or a web address ("word.tld", lower-case tld, so "Thandi.Nkosi" is still a name). */
const ADDRESS = /@|[\p{L}\p{N}-]\.[a-z]{2,}(?![\p{L}\p{M}])/u

/** A name field's tokens, after dropping any whitespace-separated chunk that holds an email or a web address. */
const nameTokens = (s = "") =>
  tokens(
    s
      .split(/\s+/)
      .filter((chunk) => !ADDRESS.test(chunk))
      .join(" "),
  ).filter((t) => clean(t))

/**
 * Every compare key a surname contributes: each token, each part of a hyphenated token, and the whole surname
 * joined with hyphens. The shirt and the poster's plus-one credit both test names against this set.
 */
export function surnameKeys(surname = ""): Set<string> {
  const surTokens = tokens(surname)
  const sur = new Set(surTokens.flatMap((t) => t.split("-")).map(nameKey).filter(Boolean))
  const full = nameKey(surTokens.join("-"))
  if (full) sur.add(full)
  return sur
}

/** A preferred name prints at most this many tokens. */
const MAX_PREFERRED_TOKENS = 2

/**
 * The shirt carries the name a guest goes by, never the surname: the preferred name, or else the first name.
 * A chunk holding an email or web address is dropped first. Any token that matches a surname token (any position,
 * any case, any Unicode form, punctuation ignored) is dropped, and a preferred name keeps at most two tokens. If
 * every token was the surname, the shirt falls back to the first name's first token, or is empty if that is the
 * surname too. With no surname tokens yet, only the first name token is kept.
 * The result is upper-cased, control-free and capped at 24 characters.
 */
export function shirtName(v: { preferredName?: string; firstName?: string; surname?: string }): string {
  const preferred = nameTokens(v.preferredName)
  const first = nameTokens(v.firstName)
  const name = preferred.length ? preferred : first
  const sur = surnameKeys(v.surname)
  const isSurname = (t: string) => sur.has(nameKey(t))
  let kept = sur.size === 0 ? name.slice(0, 1) : name.filter((t) => !isSurname(t))
  if (preferred.length) kept = kept.slice(0, MAX_PREFERRED_TOKENS)
  if (!kept.length && first[0] && !isSurname(first[0])) kept = [first[0]]
  const out = kept.map((t) => clean(t).toLocaleUpperCase())
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
