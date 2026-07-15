export type TxStatus = "pending" | "claimed" | "confirmed";
export type VendorPlan = "free" | "pro";
export type VerificationMethod = "manual" | "auto";

export type VendorPaymentConfig = {
  vendor_id: string;
  uen: string | null;
  mobile: string | null;
  payee_name: string;
  verification_method: VerificationMethod;
  plan: VendorPlan;
  created_at: string;
  updated_at: string;
};

export type Transaction = {
  id: string;
  vendor_id: string;
  kit_slug: string;
  order_ref: string;
  amount_cents: number;
  status: TxStatus;
  qr_payload: string;
  claimed_at: string | null;
  confirmed_at: string | null;
  created_at: string;
};

export type Refund = {
  id: string;
  transaction_id: string;
  refunded_amount_cents: number;
  reason: string | null;
  created_by: string;
  created_at: string;
};

export interface Database {
  paykit: {
    Tables: {
      vendor_payment_config: {
        Row: VendorPaymentConfig;
        Insert: {
          vendor_id: string;
          uen?: string | null;
          mobile?: string | null;
          payee_name: string;
          verification_method?: VerificationMethod;
          plan?: VendorPlan;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          uen?: string | null;
          mobile?: string | null;
          payee_name?: string;
          verification_method?: VerificationMethod;
          plan?: VendorPlan;
          updated_at?: string;
        };
      };
      transactions: {
        Row: Transaction;
        Insert: {
          id?: string;
          vendor_id: string;
          kit_slug: string;
          order_ref: string;
          amount_cents: number;
          status?: TxStatus;
          qr_payload: string;
          claimed_at?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
        };
        Update: {
          status?: TxStatus;
          claimed_at?: string | null;
          confirmed_at?: string | null;
        };
      };
      refunds: {
        Row: Refund;
        Insert: {
          id?: string;
          transaction_id: string;
          refunded_amount_cents: number;
          reason?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          reason?: string | null;
        };
      };
      kit_api_keys: {
        Row: { kit_slug: string; secret_hash: string; created_at: string };
        Insert: { kit_slug: string; secret_hash: string; created_at?: string };
        Update: { secret_hash?: string };
      };
    };
  };
}
