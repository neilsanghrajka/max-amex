import { LogoutButton } from "@/components/logout-button";
import { BulkPurchaseButton } from "@/components/bulk-purchase-button";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  return (
    <div className="flex h-svh w-full items-center justify-center gap-2">
      <p>
        Hello <span>{data?.claims?.email}</span>
      </p>
      <LogoutButton />
      <BulkPurchaseButton />
    </div>
  );
}
