"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer"

import { cn } from "@/lib/utils"

type DrawerSide = "top" | "bottom" | "left" | "right"

const swipeDirection: Record<DrawerSide, "up" | "down" | "left" | "right"> = {
  top: "up",
  bottom: "down",
  left: "left",
  right: "right",
}

function Drawer({
  side = "bottom",
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root> & { side?: DrawerSide }) {
  return <DrawerPrimitive.Root data-slot="drawer" swipeDirection={swipeDirection[side]} {...props} />
}

function DrawerTrigger(props: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerPortal(props: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />
}

function DrawerOverlay(props: React.ComponentProps<typeof DrawerPrimitive.Backdrop>) {
  return (
    <DrawerPrimitive.Backdrop
      data-slot="drawer-overlay"
      className="fixed inset-0 z-50 min-h-dvh bg-black [--backdrop-opacity:0.4] opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:duration-0 data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)]"
      {...props}
    />
  )
}

function DrawerViewport({
  side = "bottom",
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Viewport> & { side?: DrawerSide }) {
  return (
    <DrawerPrimitive.Viewport
      data-slot="drawer-viewport"
      className={cn(
        "fixed inset-0 z-50 flex",
        side === "bottom" && "items-end justify-center",
        side === "top" && "items-start justify-center",
        side === "left" && "items-stretch justify-start",
        side === "right" && "items-stretch justify-end",
      )}
      {...props}
    />
  )
}

const POPUP_BASE =
  "outline-none overflow-y-auto overscroll-contain touch-auto bg-background text-foreground " +
  "transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform " +
  "data-swiping:select-none data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)]"

const POPUP_SIDES: Record<DrawerSide, string> = {
  bottom:
    "[--bleed:2rem] w-full max-h-[calc(85vh+2rem)] -mb-[2rem] px-5 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px)+2rem)] rounded-b-none border-t shadow-[0_-0.25rem_1rem] shadow-black/10 [transform:translateY(var(--drawer-swipe-movement-y))] data-starting-style:[transform:translateY(calc(100%-2rem+2px))] data-ending-style:[transform:translateY(calc(100%-2rem+2px))]",
  top:
    "[--bleed:2rem] w-full max-h-[calc(85vh+2rem)] -mt-[2rem] px-5 pt-[calc(1.25rem+env(safe-area-inset-top,0px)+2rem)] pb-4 rounded-t-none border-b shadow-[0_0.25rem_1rem] shadow-black/10 [transform:translateY(var(--drawer-swipe-movement-y))] data-starting-style:[transform:translateY(calc(-100%+2rem-2px))] data-ending-style:[transform:translateY(calc(-100%+2rem-2px))]",
  left:
    "[--bleed:2rem] h-full w-[calc(20rem+2rem)] max-w-[calc(100vw-2rem)] -ml-[2rem] py-5 pr-[calc(1.25rem+2rem)] pl-5 border-r shadow-[0.25rem_0_1rem] shadow-black/10 [transform:translateX(var(--drawer-swipe-movement-x))] data-starting-style:[transform:translateX(calc(-100%+2rem-2px))] data-ending-style:[transform:translateX(calc(-100%+2rem-2px))]",
  right:
    "[--bleed:2rem] h-full w-[calc(20rem+2rem)] max-w-[calc(100vw-2rem)] -mr-[2rem] py-5 pl-[calc(1.25rem+2rem)] pr-5 border-l shadow-[-0.25rem_0_1rem] shadow-black/10 [transform:translateX(var(--drawer-swipe-movement-x))] data-starting-style:[transform:translateX(calc(100%-2rem+2px))] data-ending-style:[transform:translateX(calc(100%-2rem+2px))]",
}

function DrawerContent({
  className,
  side = "bottom",
  children,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Popup> & { side?: DrawerSide }) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerViewport side={side}>
        <DrawerPrimitive.Popup
          data-slot="drawer-content"
          className={cn(POPUP_BASE, POPUP_SIDES[side], "relative flex min-h-0 flex-col", className)}
          {...props}
        >
          <div aria-hidden className="mx-auto mb-4 mt-2 h-1 w-12 shrink-0 rounded-full bg-muted-foreground/25" />
          {children}
        </DrawerPrimitive.Popup>
      </DrawerViewport>
    </DrawerPortal>
  )
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn("flex flex-col gap-1.5 pb-4 text-left sm:text-left", className)}
      {...props}
    />
  )
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn("mt-auto flex flex-col gap-2 pt-4", className)}
      {...props}
    />
  )
}

function DrawerTitle({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("text-base font-semibold", className)}
      {...props}
    />
  )
}

function DrawerDescription({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function DrawerClose(props: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerViewport,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
  DrawerTrigger,
}