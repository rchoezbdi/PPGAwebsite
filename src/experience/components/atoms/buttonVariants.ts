/** Variants an editor may pick. The DXP reads this list through the editing contract; it keeps no copy. */
export const EDITABLE_BUTTON_VARIANTS = ['primary', 'secondary', 'outline', 'white'] as const
export type EditableButtonVariant = (typeof EDITABLE_BUTTON_VARIANTS)[number]
