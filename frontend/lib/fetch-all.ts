import { axiosInstance } from "@/lib/axios";

/**
 * Every row a paginated endpoint holds, not just the first page.
 *
 * The overview dashboards fetch one large page — enough to draw a summary, but
 * a report that quietly stopped at row 300 would understate a busy office and
 * give no sign it had done so. This keeps requesting pages until it has the
 * count the server itself reports.
 *
 * A `maxPages` ceiling stops a runaway loop if an endpoint reports a total it
 * never delivers; hitting it is reported through `truncated` rather than passed
 * off as a complete set.
 */
export async function fetchAllPages<T>(
  url: string,
  params: Record<string, unknown> = {},
  options: { pageSize?: number; maxPages?: number } = {},
): Promise<{ items: T[]; truncated: boolean }> {
  const pageSize = options.pageSize ?? 200;
  const maxPages = options.maxPages ?? 50;

  const items: T[] = [];
  let page = 1;
  let total = Infinity;

  while (items.length < total && page <= maxPages) {
    const body = (await axiosInstance.get(url, {
      params: { ...params, page, pageSize },
    })) as unknown as {
      data?: T[];
      pagination?: { total?: number; totalItems?: number };
    };

    const batch = body?.data ?? [];
    items.push(...batch);

    // Endpoints disagree on the field name; an endpoint with no pagination at
    // all returns everything in one go, so the first batch is the whole set.
    const reported = body?.pagination?.total ?? body?.pagination?.totalItems;
    total = typeof reported === "number" ? reported : items.length;

    if (batch.length === 0) break;
    page += 1;
  }

  return { items, truncated: items.length < total };
}
