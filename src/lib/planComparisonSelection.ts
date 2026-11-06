type Plan = { code?: string }

/** Keep valid, distinct choices in their slots and fill gaps from the current plan order. */
export function planComparisonSelection(plans: Plan[], preferred: unknown): string[] {
  const codes = [...new Set(plans.map((plan) => plan.code).filter((code): code is string => typeof code === 'string' && Boolean(code)))]
  const requested = Array.isArray(preferred) ? preferred : []
  const selected = Array<string>(Math.min(3, codes.length)).fill('')
  for (let index = 0; index < selected.length; index++) {
    const choice = requested[index]
    if (typeof choice === 'string' && codes.includes(choice) && !selected.includes(choice)) selected[index] = choice
  }
  for (let index = 0; index < selected.length; index++) {
    if (!selected[index]) selected[index] = codes.find((candidate) => !selected.includes(candidate)) ?? ''
  }
  return selected
}
