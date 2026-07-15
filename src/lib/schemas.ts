import { z } from "zod";

export const vendorPaymentConfigInputSchema = z
  .object({
    payee_name: z.string().trim().min(1, "Payee name is required").max(100),
    uen: z
      .string()
      .trim()
      .regex(/^[0-9A-Za-z]{8,12}$/, "Invalid UEN")
      .optional()
      .or(z.literal("")),
    mobile: z
      .string()
      .trim()
      .regex(/^\+65[0-9]{8}$/, "Use +65XXXXXXXX")
      .optional()
      .or(z.literal("")),
  })
  .transform((v) => ({
    payee_name: v.payee_name,
    uen: v.uen || undefined,
    mobile: v.mobile || undefined,
  }))
  .refine((v) => Boolean(v.uen) !== Boolean(v.mobile), {
    message: "Provide either a UEN or a mobile number, not both",
    path: ["uen"],
  });

export type VendorPaymentConfigInput = z.infer<
  typeof vendorPaymentConfigInputSchema
>;
