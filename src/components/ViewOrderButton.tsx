"use client";

import Link from "next/link";
import { List } from "lucide-react";
import { ColorActionButton } from "@/components/ui/color-action-button";

type ViewOrderButtonProps = {
  orderId?: string | null;
  size?: "large" | "compact" | "mini";
};

export default function ViewOrderButton({
  orderId,
  size = "mini",
}: ViewOrderButtonProps) {
  if (!orderId) return null;

  return (
    <ColorActionButton asChild color="blue" filled size={size} icon={List}>
      <Link href={`/orders/${orderId}`}>Ver pedido</Link>
    </ColorActionButton>
  );
}
