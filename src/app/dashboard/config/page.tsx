import { getVendorSession } from "@/lib/vendor-session";
import { getConfig } from "./actions";
import { PaymentConfigForm } from "./payment-config-form";

export default async function ConfigPage() {
  const { user } = await getVendorSession();
  const config = await getConfig();
  return (
    <main className="mx-auto max-w-lg p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Payment setup</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Set this up once — it&apos;s reused by every kit that uses paykit for
        you.
      </p>
      <div className="mt-6">
        <PaymentConfigForm initial={config} vendorId={user.id} />
      </div>
    </main>
  );
}
