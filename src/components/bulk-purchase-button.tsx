"use client";

import { Button } from "@/components/ui/button";

export function BulkPurchaseButton() {
  const handleBulkPurchase = async () => {
    try {
      const response = await fetch("/api/bulk-purchase", {
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
      console.log("Bulk Purchase Response:", data);

      if (response.ok) {
        alert(`Bulk purchase initiated! Job ID: ${data.jobId}`);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Bulk purchase failed:", error);
      alert("Bulk purchase failed. Check console for details.");
    }
  };

  return (
    <Button onClick={handleBulkPurchase} className="ml-4">
      Test Bulk Purchase
    </Button>
  );
}
