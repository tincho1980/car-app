import { createElement } from 'react';
import { itemIcon } from '@/lib/plan-items';
import type { Category } from '@/server/db/schemas/plan';

// Ícono lucide de un ítem del plan (o de su categoría).
export function ItemIcon({
  itemId,
  category,
  className,
}: {
  itemId: string;
  category: Category;
  className?: string;
}) {
  return createElement(itemIcon(itemId, category), { className });
}
