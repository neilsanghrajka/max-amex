================================================
FILE: src/main.py
================================================
import asyncio
from datetime import datetime, timezone

from gyftrr.runner import GyftrrRunner
from juspay.runner import JuspayRunner
from otp.sms_otp import get_otp, Portal, OTPType

async def main() -> None:
"""
Complete end-to-end workflow: 1. Initialize Gyftrr client and purchase vouchers 2. Use JuspayRunner to complete payment
"""
SESSION_START_TIME_UTC = datetime.now(timezone.utc)

    # User configuration
    MOBILE_NUMBER = "8879472388"
    EMAIL = "sanghrajka.neil@gmail.com"
    AMOUNT = 1500
    BRAND = "amazon-gift-vouchers"

    # Payment card details
    CARD_LAST_4_DIGITS = "1006"
    CVV = "6964"

    print("=" * 60)
    print("STARTING END-TO-END VOUCHER PURCHASE AND PAYMENT WORKFLOW")
    print("=" * 60)

    # ========================================
    # PART 1: VOUCHER PURCHASE (GYFTRR)
    # ========================================

    print("\n-------STEP 1: Initialize Gyftrr Client--------")
    gyftrr_client = GyftrrRunner(MOBILE_NUMBER, EMAIL)

    print("-------STEP 2: Request OTP for Gyftrr--------")
    if not gyftrr_client.init_session():
        raise Exception("Failed to initialize Gyftrr session")

    print("-------STEP 3: Get OTP from SMS for Gyftrr--------")
    # Wait for OTP to be sent
    await asyncio.sleep(10)
    gyftrr_otp = await get_otp(
        sender_phone=MOBILE_NUMBER,
        start_date_utc=SESSION_START_TIME_UTC,
        portal=Portal.GYFTR_AMEX_REWARDS_MULTIPLIER,
        otp_type=OTPType.ACCOUNT_LOGIN,
        max_retry=5,
        exponential_backoff=True,
    )

    if not gyftrr_otp or not gyftrr_otp.otp:
        raise Exception("Failed to get Gyftrr OTP")

    print("-------STEP 4: Validate OTP for Gyftrr--------")
    if not gyftrr_client.authenticate(gyftrr_otp.otp):
        raise Exception("Failed to authenticate with Gyftrr")

    print("-------STEP 5: Get Payment Link--------")
    payment_link = gyftrr_client.purchase(AMOUNT, BRAND)
    print(f"Payment Link: {payment_link}")

    # ========================================
    # PART 2: PAYMENT PROCESSING (JUSPAY)
    # ========================================

    print("\n-------STEP 6: Initialize Juspay Payment Runner--------")
    juspay_runner = JuspayRunner(
        payment_link=payment_link,
        last_4_digits=CARD_LAST_4_DIGITS,
        cvv=CVV,
        amount=AMOUNT,
        mobile_number=MOBILE_NUMBER,
        email=EMAIL,
    )

    print("-------STEP 8: Process Payment (includes OTP handling)--------")
    if not await juspay_runner.process_payment():
        raise Exception("Payment processing failed")

    print("-------STEP 9: Get Payment Metrics--------")
    metrics = juspay_runner.get_metrics()
    print(f"Payment Metrics: {metrics}")

    print("\n" + "=" * 60)
    print("WORKFLOW COMPLETED SUCCESSFULLY!")
    print("=" * 60)
    print(f"✅ Voucher Amount: ₹{AMOUNT}")
    print(f"✅ Brand: {BRAND}")
    print(f"✅ Payment Link: {payment_link}")
    print(f"✅ Payment completed using card ending in {CARD_LAST_4_DIGITS}")

    # ========================================
    # PART 3: PAYMENT PROCESSING (JUSPAY)
    # ========================================
    # Fetch Vouchers from Gyftrr (Email or SMS)
    # Verify Vouchers are valid (Check if they are already used)
    # Apply to amaon pay balance

if **name** == "**main**":
asyncio.run(main())

================================================
FILE: src/gyftrr/**init**.py
================================================
[Empty file]

================================================
FILE: src/gyftrr/constants.py
================================================
BASE_URL = "https://api.gyftr.com/amex-api/api/v1"

HEADERS = {
"accept": "application/json, text/plain, _/_",
"accept-encoding": "gzip, deflate, br, zstd",
"accept-language": "en-US,en;q=0.9",
"content-type": "application/json;charset=UTF-8",
"dnt": "1",
"origin": "https://www.gyftr.com",
"priority": "u=1, i",
"sec-ch-ua": '"Not)A;Brand";v="8", "Chromium";v="138"',
"sec-ch-ua-mobile": "?0",
"sec-ch-ua-platform": '"macOS"',
"sec-fetch-dest": "empty",
"sec-fetch-mode": "cors",
"sec-fetch-site": "same-site",
"user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
}

SUPPORTED_BRANDS = {"amazon-gift-vouchers"}

SUPPORTED_AMOUNTS = {1000, 1500}

================================================
FILE: src/gyftrr/py.typed
================================================
[Empty file]

================================================
FILE: src/gyftrr/runner.py
================================================
from gyftrr.openapi.client import AuthenticatedClient, Client
from gyftrr.openapi.client.api.auth import request_otp, validate_otp
from gyftrr.openapi.client.api.brands import get_brand_by_slug
from gyftrr.openapi.client.api.cart import add_to_cart
from gyftrr.openapi.client.api.orders import create_order
from gyftrr.openapi.client.models import (
AuthRequest,
AuthValidateRequest,
CartProduct,
AddToCartRequest,
CreateOrderRequest,
)
from gyftrr.utils import (
\_find_voucher_combination_for_1000,
\_find_voucher_combination_for_1500,
validate_response,
)
from typing import Optional, TypedDict
from gyftrr.constants import BASE_URL, HEADERS, SUPPORTED_BRANDS, SUPPORTED_AMOUNTS

class SimpleProduct(TypedDict):
"""Extract only the relevant fields from the product"""

    id: int
    name: str
    price: float
    quantity: int

class GyftrrRunner:
"""
Usage # Initialize
client = GyftrrRunner(mobile_number, email)
client.init_session()

    # Authenticate
    client.authenticate(otp)

    # Get Payment Link
    Then you can run the following to purchase the vouchers
    client.purchase(1000, "amazon-gift-vouchers")
    client.purchase(1500, "amazon-gift-vouchers")
    """

    def __init__(self, mobile_number: str, email: str):
        self.mobile_number: str = mobile_number
        self.email: str = email
        self.client: Client = Client(base_url=BASE_URL).with_headers(headers=HEADERS)
        self.authenticated_client: Optional[AuthenticatedClient] = None

    # Public Methods
    # ------------------------------------------------------------------------------------------------

    def init_session(self) -> bool:
        """
        Takes user details and sends OTP as step 1
        """

        print("Requesting OTP.")
        response = request_otp.sync(
            client=self.client,
            body=AuthRequest(mobile_number=self.mobile_number, email=self.email),
        )

        if validate_response(response):
            return True
        else:
            print("Failed to request OTP")
            return False

    def authenticate(self, otp: str) -> bool:
        print("Validating OTP.")
        response = validate_otp.sync(
            client=self.client,
            body=AuthValidateRequest(
                mobile_number=self.mobile_number, email=self.email, otp=otp
            ),
        )

        if validate_response(response):
            self._authenticate(response.auth_token)
            return True
        else:
            return False

    def purchase(self, total_amount: int, brand: str = "amazon-gift-vouchers") -> str:
        cart = self._purchase_validations(total_amount, brand)

        # Add to cart
        cart_item_ids = self._create_cart(cart)
        if not cart_item_ids:
            raise ValueError("Failed to add cart to user's cart")

        # Create payment link
        payment_link = self._create_payment_link(cart_item_ids)
        if not payment_link:
            raise ValueError("Failed to create payment link")

        return payment_link

    # Private Methods
    # ------------------------------------------------------------------------------------------------

    def _authenticate(self, auth_token: str) -> None:
        """
        Authenticate the user
        """

        if not self.authenticated_client:
            self.authenticated_client = AuthenticatedClient(
                base_url=BASE_URL, headers=HEADERS, token=auth_token
            )

    def _create_cart_product(self, product_id: int, quantity: int) -> CartProduct:
        """
        Helper function to create a CartProduct with default values.
        """
        return CartProduct(
            id=product_id,
            quantity=quantity,
            name="",
            email=self.email,
            mobile=self.mobile_number,
            sendername="",
            template_id=None,
            gift_status="",
            gift_text="",
            gift_imgurl="",
            promo="",
            mode="N",
        )

    def _purchase_validations(
        self, total_amount: int, brand: str = "amazon-gift-vouchers"
    ) -> list[CartProduct]:
        if not self.authenticated_client:
            raise ValueError("User is not authenticated")

        if total_amount not in SUPPORTED_AMOUNTS:
            raise ValueError("Total amount must be in the list of supported amounts")

        if brand not in SUPPORTED_BRANDS:
            raise ValueError("Brand must be in the list of supported brands")

        # Check if vouchers are available
        available_vouchers = self._get_available_vouchers(brand)
        if not available_vouchers:
            raise ValueError("No vouchers available")

        # Check if cart can be constructed
        cart = self._construct_cart(
            available_products=available_vouchers, total_amount=total_amount
        )
        if not cart:
            raise ValueError("Failed to construct cart")

        return cart

    def _get_available_vouchers(
        self, brand: str = "amazon-gift-vouchers"
    ) -> list[SimpleProduct]:
        print(f"Getting available vouchers for {brand}")

        response = get_brand_by_slug.sync(
            client=self.client,
            slug=brand,
        )
        print(f"Get Available Vouchers Response: {response}")

        if validate_response(response) and response.products:
            return [
                {
                    "id": product.id,
                    "name": product.name,
                    "price": product.price,
                    "quantity": product.available_qty,
                }
                for product in response.products
            ]
        else:
            print(f"Error getting available vouchers for {brand}")
            return []

    def _construct_cart(
        self, available_products: list[SimpleProduct], total_amount: int
    ) -> list[CartProduct]:
        """
        Given available vouchers and target amount, return the minimum number of vouchers
        needed to reach that amount.

        Args:
            available_vouchers: List of available voucher products
            amount: Target amount (must be 1000 or 1500)

        Returns:
            List of CartProduct objects representing the optimal voucher combination

        Raises:
            ValueError: If amount is not 1000 or 1500, or if target amount cannot be reached
        """

        # Construct a dict for easy lookup of voucher inventory
        voucher_inventory = {}
        for product in available_products:
            price = int(product["price"])

            voucher_inventory[int(price)] = {
                "id": product["id"],
                "qty": int(product["quantity"]),
            }

        # Find the optimal combination
        cart_items: list[CartProduct] = []

        if total_amount == 1000:
            amount, quantity = _find_voucher_combination_for_1000(voucher_inventory)
            cart_items = [
                self._create_cart_product(
                    voucher_inventory[amount]["id"],
                    quantity,
                )
            ]

        elif total_amount == 1500:
            voucher_specs = _find_voucher_combination_for_1500(voucher_inventory)
            cart_items = [
                self._create_cart_product(
                    voucher_inventory[amount]["id"],
                    quantity,
                )
                for amount, quantity in voucher_specs
            ]

        return cart_items

    def _create_cart(self, cart: list[CartProduct]) -> Optional[str]:
        """
        Add the cart to the user's cart
        """

        if not self.authenticated_client:
            raise ValueError("User is not authenticated")

        print(f"Adding cart to user's cart: {cart}")

        response = add_to_cart.sync(
            client=self.authenticated_client,
            body=AddToCartRequest(products=cart),
            token=self.authenticated_client.token,
        )

        print(f"Add To Cart Response: {response}")

        if validate_response(response):
            return response.cart_item_ids
        else:
            print(f"Error adding cart to user's cart: {response}")
            return None

    def _create_payment_link(self, cart_item_ids: str) -> Optional[str]:
        """
        Create a payment link for the cart item ids
        """

        if not self.authenticated_client:
            raise ValueError("User is not authenticated")

        response = create_order.sync(
            client=self.authenticated_client,
            body=CreateOrderRequest(
                cart_item_ids=cart_item_ids,
                email=self.email,
                mobile=self.mobile_number,
                name="Customer",
                user_id=self.authenticated_client.token,
                mode="Y",
                utmsource="",
            ),
            token=self.authenticated_client.token,
        )

        if validate_response(response, expected_code=201):
            url = response.form_action.web
            print(f"Payment Link: {url}")
            return url
        else:
            print(f"Error creating payment link: {response}")
            return None

================================================
FILE: src/gyftrr/utils.py
================================================
from typing import TypeGuard, TypeVar, Optional, Protocol

def \_find_voucher_combination_for_1000(
lookup: dict[int, dict[str, int]],
) -> tuple[int, int]:
"""
Handle the 1000 amount case.
"""
CONFIG_1000 = [
(1000, 1),
(500, 2),
(250, 4),
]
for amount, quantity in CONFIG_1000:
if amount in lookup and lookup[amount]["qty"] >= quantity:
return amount, quantity

    raise ValueError(
        f"Cannot construct cart for amount {amount} with available vouchers"
    )

def \_find_voucher_combination_for_1500(
lookup: dict[int, dict[str, int]],
) -> list[tuple[int, int]]:
"""
Handle the 1500 amount case.
Returns a list of (amount, quantity) tuples for the vouchers needed.
"""
CONFIG_1500 = [ # Priority: 1x1000+1x500 > 3x500 > 6x250
[(1000, 1), (500, 1)], # Combination option
[(500, 3)], # Single voucher option
[(250, 6)], # Single voucher option
]

    for option in CONFIG_1500:
        # Check if this option is feasible
        if all(
            amount in lookup and lookup[amount]["qty"] >= quantity
            for amount, quantity in option
        ):
            return option

    raise ValueError("Cannot construct cart for amount 1500 with available vouchers")

# This is what OpenAPI client generates for the response when .parsed is called

class ParsedResponseProtocol(Protocol):
code: int

T = TypeVar("T", bound=ParsedResponseProtocol)

def validate_response(response: Optional[T], expected_code: int = 200) -> TypeGuard[T]:
if response and response.code and response.code == expected_code:
print(f"Response: {response}")
return True
else:
print(f"Error: {response}")
return False
