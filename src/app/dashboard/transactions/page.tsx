import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { listTransactions } from "@/lib/transactions";
import { TransactionTable } from "./transaction-table";

export default async function TransactionsPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: config } = await supabase
    .from("vendor_payment_config")
    .select("plan")
    .eq("vendor_id", user.id)
    .maybeSingle();
  const transactions = await listTransactions(user.id);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Every checkout paykit has run for you, across every kit.
      </p>
      <div className="mt-6">
        <TransactionTable
          transactions={transactions}
          isPro={config?.plan === "pro"}
        />
      </div>
    </main>
  );
}
