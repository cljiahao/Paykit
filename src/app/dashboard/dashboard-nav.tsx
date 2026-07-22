"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  LifeBuoy,
  LogOut,
  Menu,
  MessageSquarePlus,
  User,
  Wallet,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FeedbackForm } from "@/components/feedback-form";
import { cn } from "@/lib/utils";

type Tier = "free" | "pro";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/config", label: "Payment setup" },
  { href: "/dashboard/transactions", label: "Transactions" },
  { href: "/dashboard/stats", label: "Stats" },
];

function isActive(path: string, href: string): boolean {
  return href === "/dashboard" ? path === "/dashboard" : path.startsWith(href);
}

function initials(label: string): string {
  const first = label.trim().charAt(0);
  return first ? first.toUpperCase() : "•";
}

/**
 * Dashboard sticky-header row, per docs/business/2026-07-21-dashboard-nav-standard.md:
 * burger far-left (below sm), inline links sm+, account menu far-right at
 * every width. Get-help is a mailto link (no support-ticket infra in paykit
 * yet — see the plan's Global Constraints); Feedback opens a Sheet form.
 */
export function DashboardNav({
  signOut,
  vendorName,
  avatarUrl = null,
  plan,
}: {
  signOut: () => Promise<void>;
  vendorName: string;
  avatarUrl?: string | null;
  plan: Tier;
}) {
  const path = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const signOutFormRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1 sm:gap-3">
          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="-ml-1.5 shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-secondary sm:hidden"
          >
            {mobileOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </button>

          <Link
            href="/dashboard"
            aria-label="paykit dashboard home"
            className="shrink-0 rounded-sm text-xl font-bold tracking-tight outline-none transition-opacity hover:opacity-80 focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <span className="text-mint">Pay</span>Kit
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary",
                  isActive(path, link.href) &&
                    "bg-primary/10 text-primary hover:bg-primary/10",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Account menu"
              className="flex items-center gap-2 rounded-lg py-1 pr-2 pl-1 text-left outline-none transition-colors hover:bg-secondary focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <Avatar className="size-8 shrink-0 rounded-md ring-1 ring-inset ring-primary/25">
                {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
                <AvatarFallback className="rounded-md bg-primary/12 font-mono text-xs font-semibold tracking-tight text-primary">
                  {initials(vendorName)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden max-w-[9rem] truncate text-sm font-medium sm:inline">
                {vendorName}
              </span>
              <ChevronDown className="hidden size-4 text-muted-foreground md:inline" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl">
            <DropdownMenuLabel className="truncate px-2 py-2 text-xs font-normal text-muted-foreground">
              {vendorName} · <span className="capitalize">{plan}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile" className="cursor-pointer">
                <User className="size-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/plan" className="cursor-pointer">
                <Wallet className="size-4" />
                Plan
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="mailto:support@merqo.app?subject=paykit%20support">
                <LifeBuoy className="size-4" />
                Get help
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={() => setFeedbackOpen(true)}
            >
              <MessageSquarePlus className="size-4" />
              Feedback
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer"
              onSelect={() => signOutFormRef.current?.requestSubmit()}
            >
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Radix portals DropdownMenuContent to document.body, so a <form> nested
          inside it lives outside this component's own DOM subtree. Keeping the
          real <form action={signOut}> here (submitted via the menu item's
          onSelect -> requestSubmit) is still a genuine native form submit, just
          one that's actually reachable from this component's render tree. */}
      <form ref={signOutFormRef} action={signOut} className="hidden" />

      {mobileOpen && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-30 cursor-default sm:hidden"
          />
          <div className="absolute inset-x-0 top-full z-40 border-b bg-background/95 px-5 py-3 backdrop-blur-md sm:hidden">
            <div className="flex flex-col gap-1">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary",
                    isActive(path, link.href) && "bg-primary/10 text-primary",
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      <Sheet open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-2xl">Share feedback</SheetTitle>
            <SheetDescription>
              What&apos;s working, what&apos;s missing, what&apos;s broken?
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            <FeedbackForm />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
