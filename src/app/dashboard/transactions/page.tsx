import { getVendorSession, getVendorPlan } from "@/lib/vendor-session";
import { listTransactions } from "@/lib/transactions";
import { TransactionTable } from "./transaction-table";

export default async function TransactionsPage() {
  const { supabase, user } = await getVendorSession();

  const config = await getVendorPlan(supabase, user.id);
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
