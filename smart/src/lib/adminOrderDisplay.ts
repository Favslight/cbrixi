export type MoneyValue = string | number | null | undefined;

export interface AdminOrderItemDisplay {
  id?: string;
  order_item_id?: string;
  order_id?: string;
  product_id?: string | null;
  variant_id?: string | null;
  quantity?: number;
  price_at_purchase?: MoneyValue;
  unit_price?: MoneyValue;
  effective_price?: MoneyValue;
  line_total?: MoneyValue;
  name?: string | null;
  product_name?: string | null;
  product_name_snapshot?: string | null;
  product_description?: string | null;
  product_category?: string | null;
  variant_name?: string | null;
  variant_specs?: Record<string, unknown> | null;
  variant_name_snapshot?: string | null;
  variant_specs_snapshot?: Record<string, unknown> | null;
  variant_sku?: string | null;
  discount_enabled?: boolean;
  discount_percentage?: MoneyValue;
  discount_amount?: MoneyValue;
  image_url?: string | null;
  image_urls?: string[];
  installment_enabled?: boolean;
  installment_duration_months?: MoneyValue;
  minimum_deposit_percentage?: MoneyValue;
}

export interface AdminOrderDisplaySource {
  id?: string;
  order_id?: string;
  email?: string | null;
  user_email?: string | null;
  firstname?: string | null;
  lastname?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  name?: string | null;
  username?: string | null;
  order_summary?: string | null;
  item_count?: number;
  total_quantity?: number;
  product_names?: string[] | null;
  variant_names?: string[] | null;
  products_summary?: string[] | null;
  order_items?: AdminOrderItemDisplay[] | null;
}

export interface AdminPaymentOrderDisplaySource extends AdminOrderDisplaySource {
  order?: AdminOrderDisplaySource | null;
}

export function displayName(source: AdminOrderDisplaySource) {
  return (
    source.full_name ||
    source.name ||
    [source.firstname ?? source.first_name, source.lastname ?? source.last_name].filter(Boolean).join(' ') ||
    source.username ||
    source.user_email ||
    source.email ||
    'Unknown customer'
  );
}

export function orderSummary(source: AdminPaymentOrderDisplaySource) {
  const nested = source.order;
  return (
    source.order_summary ||
    nested?.order_summary ||
    source.products_summary?.join(', ') ||
    nested?.products_summary?.join(', ') ||
    productNames(source).join(', ') ||
    itemLabels(orderItems(source)).join(', ') ||
    `Order ${shortId(source.order_id || source.id)}`
  );
}

export function orderItems(source: AdminPaymentOrderDisplaySource) {
  return source.order_items ?? source.order?.order_items ?? [];
}

export function productNames(source: AdminPaymentOrderDisplaySource) {
  const names = source.product_names ?? source.order?.product_names ?? [];
  if (names.length) return names.filter(Boolean);

  return orderItems(source)
    .map((item) => productName(item))
    .filter((name) => name !== 'Unknown product');
}

export function variantNames(source: AdminPaymentOrderDisplaySource) {
  const names = source.variant_names ?? source.order?.variant_names ?? [];
  if (names.length) return names.filter(Boolean).filter((name) => name.toLowerCase() !== 'default');

  return orderItems(source)
    .map((item) => variantName(item))
    .filter((name): name is string => Boolean(name));
}

export function productsText(source: AdminPaymentOrderDisplaySource) {
  const names = productNames(source);
  return names.length ? names.join(', ') : 'No products listed';
}

export function variantsText(source: AdminPaymentOrderDisplaySource) {
  const names = variantNames(source);
  return names.length ? names.join(', ') : 'Default';
}

export function totalQuantity(source: AdminPaymentOrderDisplaySource) {
  if (typeof source.total_quantity === 'number') return source.total_quantity;
  if (typeof source.order?.total_quantity === 'number') return source.order.total_quantity;
  return orderItems(source).reduce((sum, item) => sum + Number(item.quantity ?? 0), 0);
}

export function productName(item: AdminOrderItemDisplay) {
  return item.product_name_snapshot || item.product_name || item.name || 'Unknown product';
}

export function variantName(item: AdminOrderItemDisplay) {
  const name = item.variant_name_snapshot || item.variant_name;
  return name && name.toLowerCase() !== 'default' ? name : null;
}

export function itemLabel(item: AdminOrderItemDisplay) {
  const variant = variantName(item);
  return variant ? `${productName(item)} - ${variant}` : productName(item);
}

export function itemLabels(items: AdminOrderItemDisplay[]) {
  return items.map((item) => itemLabel(item));
}

export function itemUnitPrice(item: AdminOrderItemDisplay) {
  return item.price_at_purchase ?? item.unit_price ?? item.effective_price;
}

export function itemLineTotal(item: AdminOrderItemDisplay) {
  return item.line_total ?? Number(item.quantity ?? 0) * Number(itemUnitPrice(item) ?? 0);
}

export function shortId(id?: string | null) {
  return id ? `${id.slice(0, 12)}...` : 'unknown';
}
