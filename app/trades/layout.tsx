import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trade Journal — Trading OS",
  description: "Browse, search, and filter all logged trades across instruments and markets.",
};

export default function TradesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
