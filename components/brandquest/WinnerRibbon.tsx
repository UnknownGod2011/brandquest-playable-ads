/**
 * Devpost-style diagonal WINNER ribbon. Rendered inside a `relative
 * overflow-hidden` container (e.g. a game card the player has won).
 */
export function WinnerRibbon({ label = "Winner" }: { label?: string }) {
  return (
    <span className="winner-ribbon" aria-label={`${label} badge`}>
      {label}
    </span>
  )
}
