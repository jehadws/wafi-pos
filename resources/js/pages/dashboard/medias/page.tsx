import { useEffect, useRef, useState } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { UploadCloud, FileIcon, PauseCircle, PlayCircle, Trash2, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import AppLayout from "@/layouts/app-layout"
import { Media } from "@/types"
import { TabsContent } from "@/components/tabs"
import { Input } from "@/components/ui/input"

type UploadStatus = "queued" | "uploading" | "done" | "error" | "canceled"

type UploadItem = {
  id: string
  file: File
  previewUrl?: string
  progress: number
  status: UploadStatus
  controller?: AbortController
  serverUrl?: string
  error?: string
}

type MediaListResponse = {
  current_page: 1
  data: Media[]
  first_page_url: string
  from: number
  last_page: number
  last_page_url: string,
  next_page_url: null | string
  path: string
  per_page: number
  prev_page_url: null | string
  to: number
  total: number
}

function formatBytes(bytes: number) {
  if (!bytes && bytes !== 0) return ""
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function isImageFile(file: File) {
  return file.type.startsWith("image/")
}

const clampMonotonic = (current: number, next: number) =>
  Math.min(100, Math.max(current, Math.max(0, Math.round(next))))

export default function MediaManager() {
  const [tab, setTab] = useState<"upload" | "gallery">("upload")

  // Upload state
  const [items, setItems] = useState<UploadItem[]>([])
  const [dragActive, setDragActive] = useState(false)

  // Gallery state
  const [gallery, setGallery] = useState<Media[]>([])
  const [galleryLoading, setGalleryLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [pendingQuery, setPendingQuery] = useState("")
  const [selectionMode, setSelectionMode] = useState(false)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [active, setActive] = useState<Media | null>(null)

  const inputRef = useRef<HTMLInputElement | null>(null)

  // Upload: add files and auto-start
  const addFiles = (files: FileList | null) => {
    if (!files?.length) return
    const mapped: UploadItem[] = Array.from(files).map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: isImageFile(file) ? URL.createObjectURL(file) : undefined,
      progress: 0,
      status: "queued",
    }))
    setItems((prev) => [...mapped, ...prev])
    mapped.forEach((m) => startUpload(m.id, m.file))
  }

  const startUpload = async (id: string, file: File) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, status: "uploading", progress: clampMonotonic(it.progress, 1), error: undefined } : it))
    )

    const controller = new AbortController()
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, controller } : it)))

    let fallbackProgress = 0
    const fallback = setInterval(() => {
      fallbackProgress = Math.min(fallbackProgress + 2, 90)
      setItems((prev) =>
        prev.map((it) =>
          it.id === id && it.status === "uploading"
            ? { ...it, progress: clampMonotonic(it.progress, fallbackProgress) }
            : it
        )
      )
    }, 120)

    try {
      const form = new FormData()
      form.append("file", file, file.name)

      const res = await axios.post("/api/medias", form, {
        signal: controller.signal as any,
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt) => {
          if (!evt.total) return
          const pct = Math.round((evt.loaded / evt.total) * 100)
          setItems((prev) =>
            prev.map((it) =>
              it.id === id
                ? { ...it, progress: clampMonotonic(it.progress, Math.max(pct, fallbackProgress)) }
                : it
            )
          )
        },
      })

      clearInterval(fallback)
      const serverUrl = res.data?.files?.[0]?.url as string | undefined
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, status: "done", progress: 100, serverUrl } : it))
      )

    } catch (err: any) {
      clearInterval(fallback)
      const wasAborted = err?.name === "CanceledError" || err?.message === "canceled"
      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? { ...it, status: wasAborted ? "canceled" : "error", error: wasAborted ? "Upload canceled" : err?.message || "Upload failed" }
            : it
        )
      )
    }
  }

  const cancelUpload = (id: string) => {
    setItems((prev) => {
      const it = prev.find((x) => x.id === id)
      if (it?.controller) it.controller.abort()
      return prev.map((x) => (x.id === id ? { ...x, status: "canceled" } : x))
    })
  }

  const retryUpload = (id: string) => {
    const item = items.find((i) => i.id === id)
    if (!item) return
    startUpload(id, item.file)
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    addFiles(e.dataTransfer.files)
  }

  const handleClickBrowse = () => inputRef.current?.click()

  useEffect(() => {
    return () => {
      items.forEach((i) => i.previewUrl && URL.revokeObjectURL(i.previewUrl))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Gallery fetching
  const fetchGallery = async (p = page, q = searchQuery) => {
    setGalleryLoading(true)
    try {
      const { data } = await axios.get<MediaListResponse>(`/api/medias?page=${p}&search=${encodeURIComponent(q)}`)
      setGallery(data.data)
      setPage(data.current_page)
      setTotalPages(data.last_page)
      setActive(data.data[0] ?? null)
      setSelected(new Set())
    } catch (e) {
      console.error("Failed to fetch gallery", e)
    } finally {
      setGalleryLoading(false)
    }
  }

  useEffect(() => {
    if (tab === "gallery") fetchGallery(1, searchQuery)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchQuery(pendingQuery)
    fetchGallery(1, pendingQuery)
  }

  const toggleSelect = (id: number) => {
    if (!selectionMode) return
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const bulkSelect = () => {
    setSelectionMode((v) => !v)
    setSelected(new Set())
  }

  const deleteSelected = async () => {
    if (selected.size === 0) return
    if (!window.confirm(`Delete ${selected.size} media item(s)?`)) return
    try {
      await axios.post("/api/medias/bulk-delete", { ids: Array.from(selected) })
      setGallery((prev) => prev.filter((m) => !selected.has(m.id)))
      setSelected(new Set())
      setSelectionMode(false)
    } catch (e) {
      console.error("Delete failed", e)
    }
  }

  // Upload view
  const UploadView = (
    <Card className="border-0 shadow-none p-0 h-full bg-transparent">
      <CardHeader className="px-0">
        <CardTitle className="text-2xl">Upload</CardTitle>
        <p className="text-sm text-muted-foreground">Click or drag files to upload. Progress updates via axios.</p>
      </CardHeader>
      <CardContent className="p-0">
        {/* Dropzone */}
        <div
          onDragEnter={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setDragActive(true)
          }}
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setDragActive(false)
          }}
          onDrop={handleDrop}
          className={`group relative flex min-h-[180px] cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed transition-all ${dragActive
            ? "border-indigo-500 bg-indigo-50/50 dark:border-indigo-400 dark:bg-indigo-950/30"
            : "border-gray-300 bg-white/80 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-900/60"
            }`}
          onClick={handleClickBrowse}
          role="button"
          aria-label="Click or drag files to upload"
        >
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/5 via-emerald-500/5 to-fuchsia-500/5 opacity-0 blur-xl transition-opacity group-hover:opacity-100" />
          <div className="z-10 flex flex-col items-center gap-2 p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
              <UploadCloud className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium">Click to browse or drag and drop files</p>
            <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB each</p>
          </div>
          <input ref={inputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => addFiles(e.target.files)} />
        </div>

        {/* Queue */}
        <div className="mt-6">
          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground dark:border-gray-800">
              Your upload queue is empty.
            </div>
          ) : (
            <div className="grid gap-3">
              {items.map((item) => {
                const isDone = item.status === "done"
                const isError = item.status === "error"
                const isUploading = item.status === "uploading"
                const isCanceled = item.status === "canceled"
                return (
                  <Card key={item.id} className="border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="relative h-14 w-14 shrink-0 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                          {item.previewUrl && isImageFile(item.file) ? (
                            <img
                              src={item.previewUrl || "/placeholder.svg?height=60&width=60&query=media%20preview"} alt={item.file.name}
                              className="h-full w-full object-cover" crossOrigin="anonymous"
                            />
                          ) : (
                            <FileIcon className="h-6 w-6 text-gray-500" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="truncate">
                              <p className="truncate font-medium text-gray-900 dark:text-gray-100">{item.file.name}</p>
                              <p className="text-xs text-muted-foreground">{formatBytes(item.file.size)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {isDone && <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Uploaded</Badge>}
                              {isError && <Badge variant="destructive">Error</Badge>}
                              {isCanceled && <Badge variant="outline">Canceled</Badge>}
                            </div>
                          </div>
                          {/* Progress */}
                          <div className="mt-3">
                            <div className="relative h-2 w-full overflow-hidden rounded-full bg-gradient-to-r from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                              <div
                                className="h-full rounded-full bg-[length:20px_20px] bg-[linear-gradient(135deg,rgba(255,255,255,0.35)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.35)_50%,rgba(255,255,255,0.35)_75%,transparent_75%,transparent)] transition-[width] duration-300 ease-out"
                                style={{
                                  width: `${item.progress}%`,
                                  backgroundColor: isError ? "#ef4444" : isDone ? "#10b981" : "#6366f1",
                                  backgroundBlendMode: "overlay",
                                  boxShadow: "inset 0 0 6px rgba(0,0,0,0.12)",
                                }}
                              />
                            </div>
                            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                              <span className="tabular-nums">{item.progress}%</span>
                              {item.serverUrl && (
                                <a href={item.serverUrl} className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noreferrer">
                                  View
                                </a>
                              )}
                            </div>
                          </div>
                          {/* Actions */}
                          <div className="mt-3 flex items-center gap-2">
                            {isUploading && (
                              <Button size="sm" variant="ghost" onClick={() => cancelUpload(item.id)}>
                                <PauseCircle className="mr-2 h-4 w-4" /> Cancel
                              </Button>
                            )}
                            {(isError || isCanceled) && (
                              <Button size="sm" variant="outline" onClick={() => retryUpload(item.id)}>
                                <PlayCircle className="mr-2 h-4 w-4" /> Retry
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => removeItem(item.id)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  // Gallery view
  const GalleryView = (
    <Card className="border-0 shadow-none h-full p-0 bg-transparent">
      <CardHeader className="px-0">
        <CardTitle className="text-2xl">Gallery</CardTitle>
        <p className="text-sm text-muted-foreground">Browse uploaded media. Select multiple to delete. View details on the right.</p>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        {/* Search */}
        <form onSubmit={onSearchSubmit} className="mb-4 flex items-center gap-2">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={pendingQuery}
              onChange={(e) => setPendingQuery(e.target.value)}
              placeholder="Search Medias"
              className="pl-9"
              aria-label="Search media"
            />
          </div>
          <Button type="submit" variant="outline">Search</Button>
        </form>
        {/* Grid + Details */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px] h-full">
          {/* Grid */}
          <div className="rounded-xl border p-3 flex flex-col justify-between h-full">

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {gallery.map((m) => {
                const isSelected = selected.has(m.id)
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      if (selectionMode) toggleSelect(m.id)
                      setActive(m)
                    }}
                    className={`group relative aspect-square w-full overflow-hidden rounded-md border bg-white transition ${isSelected ? "ring-2 ring-indigo-500" : "hover:shadow-sm"
                      } dark:border-gray-700 dark:bg-gray-900`}
                  >
                    <img
                      src={m.sizes.thumb || "/placeholder.svg?height=300&width=300&query=media%20item"}
                      alt={m.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      crossOrigin="anonymous"
                    />
                    {/* Selection checkbox */}
                    {selectionMode && (
                      <div className="absolute left-2 top-2 rounded">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(m.id)}
                          aria-label={`Select ${m.name}`}
                        />
                      </div>
                    )}
                    {/* Name footer */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 p-1.5 text-[11px] text-white">
                      <div className="truncate">{m.name}</div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Bottom bar: bulk + delete (left) | pagination (right) */}
            <div className="flex items-center justify-between w-full mt-4">
              <div className="flex items-center gap-2">
                <Button variant={selectionMode ? "default" : "outline"} onClick={bulkSelect}>
                  {selectionMode ? "Cancel" : "Bulk Select"}
                </Button>
                <Button
                  variant="destructive"
                  disabled={!selectionMode || selected.size === 0}
                  onClick={deleteSelected}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
                {selectionMode && (
                  <span className="text-sm text-muted-foreground">{selected.size} selected</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const next = Math.max(1, page - 1)
                    fetchGallery(next, searchQuery)
                  }}
                  disabled={page <= 1 || galleryLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground tabular-nums">
                  Page {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const next = Math.min(totalPages, page + 1)
                    fetchGallery(next, searchQuery)
                  }}
                  disabled={page >= totalPages || galleryLoading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Details panel */}
          <aside className="hidden lg:block">
            <div className="sticky top-6 rounded-xl border bg-background h-full p-3">
              {active ? (
                <>
                  <div className=" w-full overflow-hidden rounded-md border dark:border-gray-800">
                    <img
                      src={active.sizes.original || "/placeholder.svg?height=600&width=600&query=preview"}
                      alt={active.name}
                      className="h-auto w-full object-cover"
                      crossOrigin="anonymous"
                    />
                  </div>
                  <div className="mt-4 space-y-2 text-sm">
                    <div>
                      <div className="text-muted-foreground">File Name:</div>
                      <div className="font-medium">{active.name}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Uploaded At:</div>
                      <div className="font-medium">
                        {new Date(active.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">By:</div>
                      <div className="font-medium">{active.user.username}</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                  Select a media to see details.
                </div>
              )}
            </div>
          </aside>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <AppLayout>
      <div className="h-full">
        <div className="grid grid-cols-1 gap-6 p-6 h-full">
          {/* Sidebar */}
          <aside className="rounded-xl backdrop-blur h-full">
            <div className="">
              <p className="text-xl leading-none font-semibold">Medias Manager</p>
            </div>
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full py-3">
              <TabsList className="w-full">
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="gallery">Gallery</TabsTrigger>
              </TabsList>
              <TabsContent value="upload">
                {UploadView}
              </TabsContent>
              <TabsContent value="gallery">
                {GalleryView}
              </TabsContent>
            </Tabs>
          </aside>
        </div>
      </div>
    </AppLayout>
  )
}

