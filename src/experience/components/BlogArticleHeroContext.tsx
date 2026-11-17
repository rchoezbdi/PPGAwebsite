'use client'

import { createContext, useContext, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'

export type BlogArticleHero = {
  title: string
  category?: string
}

type BlogArticleHeroContextValue = {
  article: BlogArticleHero | null
  setArticle: Dispatch<SetStateAction<BlogArticleHero | null>>
}

const BlogArticleHeroContext = createContext<BlogArticleHeroContextValue | null>(null)

export function BlogArticleHeroProvider({ children }: { children: ReactNode }) {
  const [article, setArticle] = useState<BlogArticleHero | null>(null)
  const value = useMemo(() => ({ article, setArticle }), [article])

  return <BlogArticleHeroContext.Provider value={value}>{children}</BlogArticleHeroContext.Provider>
}

export function useBlogArticleHero() {
  return useContext(BlogArticleHeroContext)?.article ?? null
}

export function useSetBlogArticleHero() {
  return useContext(BlogArticleHeroContext)?.setArticle
}
