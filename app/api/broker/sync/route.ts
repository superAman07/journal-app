import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  authenticateAngelOne,
  fetchAngelOneTradebook,
  pairAngelOneTrades,
} from "@/lib/services/angel-one-service";
import { fetchDhanTrades, pairDhanTrades } from "@/lib/services/dhan-service";
import { parseTradebookCSV } from "@/lib/services/tradebook-csv-service";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { broker, credentials, csvContent } = body;

    if (broker === "ANGEL_ONE") {
      if (!credentials?.clientCode || !credentials?.password || !credentials?.apiKey || !credentials?.totpSecret) {
        return NextResponse.json(
          { error: "Angel One requires Client Code, Password/PIN, API Key, and TOTP Secret Key." },
          { status: 400 }
        );
      }

      // Step 1: Authenticate with dynamic TOTP
      const authResult = await authenticateAngelOne(credentials);
      if (!authResult.success || !authResult.jwtToken) {
        return NextResponse.json(
          { error: authResult.error || "Failed to log in to Angel One SmartAPI." },
          { status: 400 }
        );
      }

      // Step 2: Fetch today's Tradebook
      const tradebookResult = await fetchAngelOneTradebook(authResult.jwtToken, credentials.apiKey);
      if (!tradebookResult.success || !tradebookResult.trades) {
        return NextResponse.json(
          { error: tradebookResult.error || "Failed to fetch orders from Angel One." },
          { status: 400 }
        );
      }

      // Step 3: Match Buy & Sell legs into completed trades
      const pairedTrades = pairAngelOneTrades(tradebookResult.trades);
      return NextResponse.json({
        success: true,
        broker: "Angel One",
        totalOrders: tradebookResult.trades.length,
        completedTradesCount: pairedTrades.length,
        trades: pairedTrades,
      });
    }

    if (broker === "DHAN") {
      if (!credentials?.clientId || !credentials?.accessToken) {
        return NextResponse.json(
          { error: "Dhan requires Client ID and Access Token." },
          { status: 400 }
        );
      }

      const dhanResult = await fetchDhanTrades(credentials);
      if (!dhanResult.success || !dhanResult.trades) {
        return NextResponse.json(
          { error: dhanResult.error || "Failed to fetch orders from Dhan API." },
          { status: 400 }
        );
      }

      const pairedTrades = pairDhanTrades(dhanResult.trades);
      return NextResponse.json({
        success: true,
        broker: "Dhan",
        totalOrders: dhanResult.trades.length,
        completedTradesCount: pairedTrades.length,
        trades: pairedTrades,
      });
    }

    if (broker === "CSV") {
      if (!csvContent || typeof csvContent !== "string") {
        return NextResponse.json({ error: "CSV file content is required." }, { status: 400 });
      }

      const pairedTrades = parseTradebookCSV(csvContent);
      return NextResponse.json({
        success: true,
        broker: "CSV Tradebook",
        completedTradesCount: pairedTrades.length,
        trades: pairedTrades,
      });
    }

    return NextResponse.json({ error: "Unsupported broker or method." }, { status: 400 });
  } catch (error: any) {
    console.error("[POST /api/broker/sync] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process broker sync request." },
      { status: 500 }
    );
  }
}
