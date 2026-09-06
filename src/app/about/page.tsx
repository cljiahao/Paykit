import Link from "next/link";
import { AboutMerqo } from "@merqo/ui";
import { Nav } from "@/components/landing/nav";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { createServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "About",
};

export default async function AboutPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const authed = !!user;

  return (
    <>
      <Nav authed={authed} />
      <main>
        <AboutMerqo kitName="paykit">
          <Button asChild size="lg">
            <Link href="/#how">See how paykit works</Link>
          </Button>
        </AboutMerqo>
      </main>
      <Footer />
    </>
  );
}
