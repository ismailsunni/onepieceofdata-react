/** Shortens an axis label to `max` characters with an ellipsis */
export const truncateLabel = (label: string, max: number) =>
  label.length > max ? `${label.slice(0, max - 1)}…` : label
