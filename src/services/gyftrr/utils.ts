import { CartProduct, SimpleProduct } from "./client";

export enum VoucherBrand {
  AMAZON = "amazon-gift-vouchers",
}

export enum PaymentLinkErrorType {
  MONTHLY_LIMIT_EXCEEDED = "MONTHLY_LIMIT_EXCEEDED",
  RATE_LIMITED = "RATE_LIMITED",
  OTHER = "OTHER",
}

export const SUPPORTED_AMOUNTS = new Set([1000, 1500]);

export interface VoucherInventory {
  [amount: number]: {
    id: number;
    qty: number;
  };
}

export interface VoucherSpec {
  amount: number;
  quantity: number;
}

/**
 * Find the optimal voucher combination for ₹1000 amount.
 * Tries 1x1000, then 2x500, then 4x250 in that order.
 */
export function findVoucherCombinationFor1000(
  inventory: VoucherInventory,
): VoucherSpec {
  const config: VoucherSpec[] = [
    { amount: 1000, quantity: 1 },
    { amount: 500, quantity: 2 },
    { amount: 250, quantity: 4 },
  ];

  for (const { amount, quantity } of config) {
    if (inventory[amount] && inventory[amount].qty >= quantity) {
      return { amount, quantity };
    }
  }

  throw new Error(
    "Cannot construct cart for amount ₹1000 with available vouchers",
  );
}

/**
 * Find the optimal voucher combination for ₹1500 amount.
 * Tries 1x1000+1x500, then 3x500, then 6x250 in that order.
 */
export function findVoucherCombinationFor1500(
  inventory: VoucherInventory,
): VoucherSpec[] {
  const config: VoucherSpec[][] = [
    [
      { amount: 1000, quantity: 1 },
      { amount: 500, quantity: 1 },
    ], // Combination option
    [{ amount: 500, quantity: 3 }], // Single voucher option
    [{ amount: 250, quantity: 6 }], // Single voucher option
  ];

  for (const option of config) {
    // Check if this option is feasible
    const isFeasible = option.every(
      ({ amount, quantity }) =>
        inventory[amount] && inventory[amount].qty >= quantity,
    );

    if (isFeasible) {
      return option;
    }
  }

  throw new Error(
    "Cannot construct cart for amount ₹1500 with available vouchers",
  );
}

/**
 * Validate if a response has the expected status code.
 */
export function validateResponse<T extends { code?: number }>(
  response: T | null | undefined,
  expectedCode: number = 200,
): response is T & { code: number } {
  if (response && response?.code === expectedCode) {
    console.log("Response:", response);
    return true;
  } else {
    console.log("Error:", response);
    return false;
  }
}

/**
 * Create a cart product with default values
 */
export function createCartProduct(
  productId: number,
  quantity: number,
  email: string,
  mobileNumber: string,
): CartProduct {
  return {
    id: productId,
    quantity,
    name: "",
    email,
    mobile: mobileNumber,
    sendername: "",
    template_id: null,
    gift_status: "",
    gift_text: "",
    gift_imgurl: "",
    promo: "",
    mode: "N",
  };
}

/**
 * Construct cart based on available products and target amount
 */
export function constructCart(
  availableProducts: SimpleProduct[],
  totalAmount: number,
  email: string,
  mobileNumber: string,
): CartProduct[] {
  if (!SUPPORTED_AMOUNTS.has(totalAmount)) {
    throw new Error("Total amount must be 1000 or 1500");
  }

  // Build voucher inventory lookup
  const voucherInventory: VoucherInventory = {};
  for (const product of availableProducts) {
    const price = Math.round(product.price);
    voucherInventory[price] = {
      id: product.id,
      qty: product.quantity,
    };
  }

  // Find optimal combination
  const cartItems: CartProduct[] = [];

  if (totalAmount === 1000) {
    const spec = findVoucherCombinationFor1000(voucherInventory);
    cartItems.push(
      createCartProduct(
        voucherInventory[spec.amount].id,
        spec.quantity,
        email,
        mobileNumber,
      ),
    );
  } else if (totalAmount === 1500) {
    const specs = findVoucherCombinationFor1500(voucherInventory);
    for (const spec of specs) {
      cartItems.push(
        createCartProduct(
          voucherInventory[spec.amount].id,
          spec.quantity,
          email,
          mobileNumber,
        ),
      );
    }
  }

  return cartItems;
}
