import { route } from "@/lib/api/route";
import {
  InitiateBulkPurchaseRequest,
  InitiateBulkPurchaseResponse,
} from "@/app/api/bulk-purchase/types";
import { User } from "@supabase/supabase-js";
import { db } from "@/db";
import { bulkPurchaseJobTable } from "@/db/schema/bulkPurchaseJob";
import { EventNames } from "@/inngest/events";
import { inngest } from "@/inngest/client";

export const POST = route(
  InitiateBulkPurchaseRequest,
  InitiateBulkPurchaseResponse,
  async (_request: InitiateBulkPurchaseRequest, _user: User) => {
    // Insert Row into the DB
    console.log("Received Bulk Purchase Request for user", _user.id, _request);
    const [job] = await db
      .insert(bulkPurchaseJobTable)
      .values({
        amount: _request.amount,
        quantity: _request.quantity,
        status: "pending",
      })
      .returning({ id: bulkPurchaseJobTable.id });

    await inngest.send({
      name: EventNames.BULK_PURCHASE_INITIATE,
      data: {
        jobId: job.id,
      },
    });

    // TODO: Return the jobId
    return { jobId: job.id.toString() };
  },
);
