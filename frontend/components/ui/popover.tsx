"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 flex w-72 origin-(--radix-popover-content-transform-origin) flex-col gap-2.5 rounded-lg bg-popover p-2.5 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
}

/**
 * A scrim behind an open popover, for panels that are a destination rather than
 * a hint — a notification list, say — where the page behind should visibly
 * recede instead of competing with it.
 *
 * Radix has no `Popover.Overlay`, so this is a plain element inside the
 * popover's own portal: it mounts and unmounts with `open`, escapes any
 * stacking or containing block the trigger sits in (a `backdrop-blur` header is
 * a containing block for fixed children, so a scrim rendered in place would be
 * the size of the header), and sits between the page and the content at z-50.
 *
 * It is clickable on purpose. Dismissal is already handled by the content's
 * outside-press, and catching the press here stops that same click from also
 * landing on whatever sits underneath. Styled to match `DialogOverlay`.
 *
 * Render it as a sibling before `PopoverContent`, inside `Popover`.
 */
function PopoverOverlay({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <PopoverPrimitive.Portal>
      <div
        data-slot="popover-overlay"
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-40 bg-black/10 duration-100 animate-in fade-in-0 supports-backdrop-filter:backdrop-blur-xs",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

function PopoverHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-header"
      className={cn("flex flex-col gap-0.5 text-sm", className)}
      {...props}
    />
  )
}

function PopoverTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <div
      data-slot="popover-title"
      className={cn("font-medium", className)}
      {...props}
    />
  )
}

function PopoverDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="popover-description"
      className={cn("text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverOverlay,
  PopoverTitle,
  PopoverTrigger,
}
