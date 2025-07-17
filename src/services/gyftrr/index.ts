import {
  getAvailableVouchers,
  addToCart,
  createPaymentLink,
  validateOtp,
  requestOtp,
  CartProduct,
} from "./client";
import {
  VoucherBrand,
  SUPPORTED_AMOUNTS,
  constructCart,
  PaymentLinkErrorType,
} from "./utils";

/**
 * Given the total amount and quantity, check if sufficient quanties of vouchers are available.
 */
export async function isPurchasePossible(
  totalAmount: number,
  quantity: number,
  email: string,
  mobileNumber: string,
  brand: VoucherBrand,
): Promise<{ possible: boolean; cart: CartProduct[]; message?: string }> {
  // BASIC VALIDATIONS
  //--------------------------------

  if (!SUPPORTED_AMOUNTS.has(totalAmount)) {
    return {
      possible: false,
      cart: [],
      message: `Amount ${totalAmount} is not supported`,
    };
  }

  // GET AVAILABLE VOUCHERS FROM GYFTRR
  //--------------------------------
  const availableVouchers = await getAvailableVouchers(brand);
  if (availableVouchers.length === 0) {
    return {
      possible: false,
      cart: [],
      message: "No vouchers available",
    };
  }

  // CONSTRUCT 1 CART
  //--------------------------------
  const cart: CartProduct[] = constructCart(
    availableVouchers,
    totalAmount,
    email,
    mobileNumber,
  );

  if (cart.length === 0) {
    return {
      possible: false,
      cart: [],
      message: `Unable to construct cart for a single purchase of ${totalAmount}.`,
    };
  }

  // VALIDATE THAT THE INVENTORY IS SUFFICIENT
  //--------------------------------
  const availableVouchersMap = new Map(
    availableVouchers.map((v) => [v.id, v.quantity]),
  );

  for (const cartItem of cart) {
    const requiredQty = cartItem.quantity * quantity;
    const availableQty = availableVouchersMap.get(cartItem.id) ?? 0;

    if (availableQty < requiredQty) {
      return {
        possible: false,
        cart: [],
        message: `Insufficient inventory for voucher ID ${cartItem.id}. Required: ${requiredQty}, Available: ${availableQty}`,
      };
    }
  }

  return { possible: true, cart: cart };
}

/**
 * Create payment links for a given total amount and quantity
 */
export async function initiatePayment(
  authToken: string,
  totalAmount: number,
  email: string,
  mobileNumber: string,
  brand: VoucherBrand,
): Promise<{ paymentLink?: string; errorType?: PaymentLinkErrorType }> {
  const { possible, cart, message } = await isPurchasePossible(
    totalAmount,
    1,
    email,
    mobileNumber,
    brand,
  );

  if (!possible) {
    throw new Error(`Purchase is not possible: ${message}`);
  }

  // Add to cart
  const cartItemIds = await addToCart(authToken, cart);
  if (!cartItemIds) {
    throw new Error("Failed to add items to cart");
  }

  // Create payment link

  const { paymentLink, errorType } = await createPaymentLink(
    authToken,
    cartItemIds,
    email,
    mobileNumber,
  );

  return { paymentLink, errorType };
}

export { validateOtp, requestOtp };
