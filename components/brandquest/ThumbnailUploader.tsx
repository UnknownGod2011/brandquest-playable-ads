"use client"

import { ImageUp } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const ACCEPTED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"])
const MAX_INPUT_BYTES = 1_000_000
const MAX_OUTPUT_BYTES = 200 * 1024
const MAX_EDGE = 900

export function ThumbnailUploader({
  value,
  onChange,
  id = "thumbnailUpload",
}: {
  value?: string
  onChange: (value: string) => void
  id?: string
}) {
  async function handleFile(file: File | undefined) {
    if (!file) return
    if (!ACCEPTED_TYPES.has(file.type)) {
      toast.error("Upload a PNG, JPEG, or WebP image. SVG is not accepted.")
      return
    }
    if (file.size > MAX_INPUT_BYTES) {
      toast.error("Thumbnail image must be under 1 MB before resizing.")
      return
    }

    try {
      const dataUrl = await resizeToDataUrl(file)
      const sizeBytes = Math.ceil((dataUrl.length * 3) / 4)
      if (sizeBytes > MAX_OUTPUT_BYTES) {
        toast.error("Thumbnail is still too large after compression. Try a smaller image.")
        return
      }
      onChange(dataUrl)
      toast.success("Thumbnail uploaded.")
    } catch {
      toast.error("Could not process that image.")
    }
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Upload thumbnail</Label>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          id={id}
          type="file"
          accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
          className="max-w-sm"
          onChange={(event) => {
            void handleFile(event.target.files?.[0])
            event.currentTarget.value = ""
          }}
        />
        {value?.startsWith("data:image/") ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
            Clear upload
          </Button>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        Demo-safe local thumbnail. PNG, JPEG, or WebP only; stored as a small data URL.
      </p>
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt="Thumbnail preview"
          className="mt-1 aspect-video w-full max-w-xs rounded-lg object-cover ring-1 ring-border"
        />
      ) : (
        <div className="mt-1 flex aspect-video w-full max-w-xs items-center justify-center rounded-lg bg-secondary/50 text-muted-foreground ring-1 ring-border">
          <ImageUp className="size-5" aria-hidden="true" />
        </div>
      )}
    </div>
  )
}

async function resizeToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas unavailable")
  ctx.drawImage(bitmap, 0, 0, width, height)

  const preferredType = file.type === "image/png" ? "image/png" : "image/jpeg"
  let dataUrl = canvas.toDataURL(preferredType, 0.78)
  if (Math.ceil((dataUrl.length * 3) / 4) > MAX_OUTPUT_BYTES) {
    dataUrl = canvas.toDataURL("image/jpeg", 0.62)
  }
  return dataUrl
}
