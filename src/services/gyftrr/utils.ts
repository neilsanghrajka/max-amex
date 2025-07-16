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
  if (response && response.code && response.code === expectedCode) {
    console.log("Response:", response);
    return true;
  } else {
    console.log("Error:", response);
    return false;
  }
}
