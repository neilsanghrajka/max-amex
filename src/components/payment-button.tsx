"use client";

import { Button } from "@/components/ui/button";

export function PaymentButton() {
  const handlePayment = async () => {
    try {
      const response = await fetch("/api/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cardType: "MRCC",
          quantity: 1,
          amount: 1000,
        }),
      });

      const data = await response.json();
      console.log("Payment Response:", data);

      if (response.ok) {
        alert(`Payment initiated! Job ID: ${data.jobId}`);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Payment failed:", error);
      alert("Payment failed. Check console for details.");
    }
  };

  return (
    <Button onClick={handlePayment} className="ml-4">
      Test Payment
    </Button>
  );
}
