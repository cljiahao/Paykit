import Link from "next/link";
import { Footer as SharedFooter } from "@merqo/ui";
import { Wordmark } from "./wordmark";

export function Footer() {
  return (
    <SharedFooter
      wordmark={
        <Link
          href="/"
          aria-label="paykit home"
          className="transition-opacity hover:opacity-80"
        >
          <Wordmark className="text-xl" />
        </Link>
      }
      tagline="The Merqo family's shared vendor payment engine."
      kitName="paykit"
    />
  );
}
