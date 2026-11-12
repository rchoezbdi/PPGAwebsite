/** Editing policy a component publishes next to its renderer; everything else is design and stays in code. */
export type ComponentEditingPolicy = {
  /** Catalog `type` this policy belongs to. */
  type: string
  /** Select/checkbox fields (path suffix or name) that are content, not presentation. */
  functional?: string[]
  /** Fields a renderer never reads, or design images; they are not published. */
  excluded?: string[]
  /** The whole schema is presentation, so the section is not offered for insertion. */
  presentationOnly?: boolean
}
