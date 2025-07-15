import { components } from "./types";
import {
  VoucherInventory,
  findVoucherCombinationFor1000,
  findVoucherCombinationFor1500,
  validateResponse,
} from "./utils";

// Type aliases for better readability
type AuthRequest = components["schemas"]["AuthRequest"];
type AuthValidateRequest = components["schemas"]["AuthValidateRequest"];
type AuthValidateResponse = components["schemas"]["AuthValidateResponse"];
type GetBrandResponse = components["schemas"]["GetBrandResponse"];
type Product = components["schemas"]["Product"];
type CartProduct = components["schemas"]["CartProduct"];
type AddToCartRequest = components["schemas"]["AddToCartRequest"];
type AddToCartResponse = components["schemas"]["AddToCartResponse"];
type CreateOrderRequest = components["schemas"]["CreateOrderRequest"];
type CreateOrderResponse = components["schemas"]["CreateOrderResponse"];

const BASE_URL = "https://api.gyftr.com/amex-api/api/v1";

const DEFAULT_HEADERS = {
  accept: "application/json, text/plain, */*",
  "accept-encoding": "gzip, deflate, br, zstd",
  "accept-language": "en-US,en;q=0.9",
  "content-type": "application/json;charset=UTF-8",
  dnt: "1",
  origin: "https://www.gyftr.com",
  priority: "u=1, i",
  "sec-ch-ua": '"Not)A;Brand";v="8", "Chromium";v="138"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"macOS"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-site",
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
};

const SUPPORTED_BRANDS = new Set(["amazon-gift-vouchers"]);
const SUPPORTED_AMOUNTS = new Set([1000, 1500]);

export interface SimpleProduct {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

/**
 * Request OTP for Gyftr authentication
 */
export async function requestOtp(
  mobileNumber: string,
  email: string
): Promise<boolean> {
  console.log("Requesting OTP for Gyftr authentication");

  const requestBody: AuthRequest = {
    mobileNumber,
    email,
  };

  try {
    const response = await fetch(`${BASE_URL}/user/auth`, {
      method: "POST",
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (validateResponse(data)) {
      console.log("OTP request successful");
      return true;
    } else {
      console.error("Failed to request OTP:", data);
      return false;
    }
  } catch (error) {
    console.error("Error requesting OTP:", error);
    return false;
  }
}

/**
 * Validate OTP and get authentication token
 */
export async function validateOtp(
  mobileNumber: string,
  email: string,
  otp: string
): Promise<string | null> {
  console.log("Validating OTP for Gyftr authentication");

  const requestBody: AuthValidateRequest = {
    mobileNumber,
    email,
    otp,
  };

  try {
    const response = await fetch(`${BASE_URL}/user/auth-validate`, {
      method: "POST",
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(requestBody),
    });

    const data: AuthValidateResponse = await response.json();

    if (validateResponse(data)) {
      console.log("OTP validation successful");
      return data.auth_token;
    } else {
      console.error("Failed to validate OTP:", data);
      return null;
    }
  } catch (error) {
    console.error("Error validating OTP:", error);
    return null;
  }
}

/**
 * Get available vouchers for a brand
 */
export async function getAvailableVouchers(
  brand: string = "amazon-gift-vouchers"
): Promise<SimpleProduct[]> {
  console.log(`Getting available vouchers for ${brand}`);

  try {
    const response = await fetch(`${BASE_URL}/brand/${brand}`, {
      method: "GET",
      headers: DEFAULT_HEADERS,
    });

    const data: GetBrandResponse = await response.json();

    if (validateResponse(data) && data.products) {
      return data.products.map((product: Product) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: product.available_qty,
      }));
    } else {
      console.error(`Error getting available vouchers for ${brand}:`, data);
      return [];
    }
  } catch (error) {
    console.error("Error fetching available vouchers:", error);
    return [];
  }
}

/**
 * Create a cart product with default values
 */
function createCartProduct(
  productId: number,
  quantity: number,
  email: string,
  mobileNumber: string
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
  mobileNumber: string
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
        mobileNumber
      )
    );
  } else if (totalAmount === 1500) {
    const specs = findVoucherCombinationFor1500(voucherInventory);
    for (const spec of specs) {
      cartItems.push(
        createCartProduct(
          voucherInventory[spec.amount].id,
          spec.quantity,
          email,
          mobileNumber
        )
      );
    }
  }

  return cartItems;
}

/**
 * Add products to cart
 */
export async function addToCart(
  authToken: string,
  cartProducts: CartProduct[]
): Promise<string | null> {
  console.log("Adding products to cart");

  const requestBody: AddToCartRequest = {
    products: cartProducts,
  };

  try {
    const response = await fetch(`${BASE_URL}/cart/add-to-cart`, {
      method: "POST",
      headers: {
        ...DEFAULT_HEADERS,
        token: authToken,
      },
      body: JSON.stringify(requestBody),
    });

    const data: AddToCartResponse = await response.json();

    if (validateResponse(data)) {
      console.log("Products added to cart successfully");
      return data.cartItemIds;
    } else {
      console.error("Failed to add products to cart:", data);
      return null;
    }
  } catch (error) {
    console.error("Error adding products to cart:", error);
    return null;
  }
}

/**
 * Create payment link for cart items
 */
export async function createPaymentLink(
  authToken: string,
  cartItemIds: string,
  email: string,
  mobileNumber: string
): Promise<string | null> {
  console.log("Creating payment link");

  const requestBody: CreateOrderRequest = {
    cart_item_ids: cartItemIds,
    email,
    mobile: mobileNumber,
    name: "Customer",
    user_id: authToken,
    mode: "Y",
    utmsource: "",
  };

  try {
    const response = await fetch(`${BASE_URL}/order/create-order`, {
      method: "POST",
      headers: {
        ...DEFAULT_HEADERS,
        token: authToken,
      },
      body: JSON.stringify(requestBody),
    });

    const data: CreateOrderResponse = await response.json();

    if (validateResponse(data, 201)) {
      const paymentUrl = data.formAction?.web;
      console.log("Payment link created:", paymentUrl);
      return paymentUrl || null;
    } else {
      console.error("Failed to create payment link:", data);
      return null;
    }
  } catch (error) {
    console.error("Error creating payment link:", error);
    return null;
  }
}

/**
 * Complete voucher purchase flow and return payment link
 */
export async function purchaseVouchers(
  authToken: string,
  totalAmount: number,
  email: string,
  mobileNumber: string,
  brand: string = "amazon-gift-vouchers"
): Promise<string | null> {
  // Validate inputs
  if (!SUPPORTED_BRANDS.has(brand)) {
    throw new Error(`Brand ${brand} is not supported`);
  }

  if (!SUPPORTED_AMOUNTS.has(totalAmount)) {
    throw new Error(`Amount ${totalAmount} is not supported`);
  }

  // Get available vouchers
  const availableVouchers = await getAvailableVouchers(brand);
  if (availableVouchers.length === 0) {
    throw new Error("No vouchers available");
  }

  // Construct cart
  const cart = constructCart(availableVouchers, totalAmount, email, mobileNumber);
  if (cart.length === 0) {
    throw new Error("Failed to construct cart");
  }

  // Add to cart
  const cartItemIds = await addToCart(authToken, cart);
  if (!cartItemIds) {
    throw new Error("Failed to add items to cart");
  }

  // Create payment link
  const paymentLink = await createPaymentLink(
    authToken,
    cartItemIds,
    email,
    mobileNumber
  );
  if (!paymentLink) {
    throw new Error("Failed to create payment link");
  }

  return paymentLink;
} 