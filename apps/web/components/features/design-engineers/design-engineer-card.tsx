import Link from "next/link"
import Image from "next/image"
import { Bookmark, Eye, Download } from "lucide-react"
import { motion } from "motion/react"
import { ComponentVideoPreview } from "../list-card/card-video"
import { Database } from "@/types/supabase"
import { DemoWithComponent } from "@/types/global"

type DatabaseAuthor =
  Database["public"]["Functions"]["get_active_authors_with_top_components"]["Returns"][0]

interface DesignEngineerCardProps {
  author: DatabaseAuthor
}

export function DesignEngineerCard({ author }: DesignEngineerCardProps) {
  const totalViews = Number(author.total_views) || 0
  const totalUsages = Number(author.total_usages) || 0
  const totalDownloads = Number(author.total_downloads) || 0
  const topComponents = (author.top_components || []) as DemoWithComponent[]
  const authorUsername = author.display_username || author.username || "user"

  return (
    <div className="block p-[1px]">
      <div className="group relative bg-background/50 rounded-2xl p-6 sm:p-8 overflow-hidden ring-1 ring-white/10 hover:ring-white/20 transition-all duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

        <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-8 lg:gap-12 items-center">
          {/* Author Info Section */}
          <div className="relative z-10 flex flex-col justify-center">
            <Link
              href={`/${author.display_username || author.username}`}
              className="block group/author"
            >
              <div className="flex flex-col gap-5">
                <div className="h-16 w-16 rounded-full shadow-sm shrink-0 overflow-hidden ring-1 ring-border/50 group-hover/author:ring-foreground/20 transition-all duration-500">
                  {author.display_image_url || author.image_url ? (
                    <Image
                      src={author.display_image_url || author.image_url || ""}
                      alt={
                        author.display_name ||
                        author.name ||
                        author.username ||
                        ""
                      }
                      className="h-full w-full object-cover"
                      width={64}
                      height={64}
                    />
                  ) : (
                    <div className="h-full w-full bg-muted flex items-center justify-center">
                      <span className="text-xl font-medium text-muted-foreground">
                        {(
                          (author.display_name ||
                            author.name ||
                            author.username ||
                            "?")?.[0] || "?"
                        ).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <h2 className="text-2xl font-medium tracking-tight text-foreground group-hover/author:text-primary transition-colors">
                    {author.display_name || author.name || author.username}
                  </h2>
                  <p className="text-base text-foreground/70 line-clamp-2 max-w-[40ch] leading-relaxed">
                    {author.bio ||
                      `@${author.display_username || author.username}`}
                  </p>
                </div>

                <div className="flex items-center gap-5 mt-2">
                  <div className="flex items-center gap-2 text-foreground/60">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {totalViews.toLocaleString()} views
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground/60">
                    <Download className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {(totalUsages || totalDownloads).toLocaleString()} usages
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Components Cards Section */}
          {topComponents.length > 0 && (
            <div className="relative min-w-0 w-full overflow-hidden">
              {/* Fade masks for scroll area */}
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background/50 to-transparent z-10 pointer-events-none opacity-0 lg:opacity-100" />
              <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

              <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mb-4 w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pt-2">
                {topComponents.map((demo, index) => {
                  const componentUser = demo.component?.user
                  const componentUsername =
                    componentUser?.display_username ||
                    componentUser?.username ||
                    authorUsername
                  return (
                  <motion.div
                    key={demo.id}
                    className="snap-start shrink-0"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.1 + index * 0.1,
                      ease: [0.21, 0.47, 0.32, 0.98],
                    }}
                  >
                    <Link
                      href={`/${componentUsername}/${demo.component?.component_slug || "component"}/${demo.demo_slug || "default"}`}
                      className="block group/card relative w-[240px] sm:w-[260px] active:scale-[0.98] transition-transform duration-200 ease-out"
                    >
                      <div className="relative aspect-[4/3] rounded-xl shadow-base overflow-hidden ring-1 ring-white/10 group-hover/card:ring-white/20 transition-all duration-300">
                        <div className="absolute inset-0">
                          <Image
                            src={demo.preview_url || "/placeholder.svg"}
                            alt={demo.name || ""}
                            className="object-cover transition-transform duration-700 ease-out group-hover/card:scale-105"
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            priority={index === 0}
                          />
                        </div>
                        {demo.video_url && (
                          <div className="absolute inset-0 z-10">
                            <ComponentVideoPreview
                              component={demo}
                              demo={demo}
                            />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none opacity-0 group-hover/card:opacity-100 group-focus-within/card:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity duration-300 z-20">
                          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
                            <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-black/50 ring-1 ring-white/30 flex items-center justify-center text-[10px] font-medium text-white">
                              {componentUser?.display_image_url ||
                              componentUser?.image_url ? (
                                <Image
                                  src={
                                    componentUser?.display_image_url ||
                                    componentUser?.image_url ||
                                    ""
                                  }
                                  alt=""
                                  width={28}
                                  height={28}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                (componentUser?.display_name ||
                                  componentUser?.name ||
                                  componentUser?.username ||
                                  author.display_name ||
                                  author.name ||
                                  author.username ||
                                  "?")[0]?.toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-white font-medium text-sm line-clamp-1 drop-shadow-sm">
                                {demo.component?.name || demo.name}
                              </h3>
                              <div className="mt-1 flex items-center gap-3 text-white/85 text-[11px] font-medium">
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {(demo.view_count || 0).toLocaleString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Bookmark className="h-3 w-3" />
                                  {(demo.bookmarks_count || 0).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
