/** Merges settings under content so editorial data (content) always wins on overlapping keys. */
export const mergeProps = (content: Record<string, unknown>, settings: Record<string, unknown>) => ({ ...settings, ...content })
