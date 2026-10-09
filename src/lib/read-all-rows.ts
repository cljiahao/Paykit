/** Read a deterministically ordered query without silently truncating at the API row cap. */
export async function readAllRows<T>(
  page: (
    from: number,
    to: number,
  ) => PromiseLike<{
    data: T[] | null;
    error: { message: string } | null;
  }>,
): Promise<T[]> {
  const rows: T[] = [];
  while (true) {
    const { data, error } = await page(rows.length, rows.length + 999);
    if (error || !data)
      throw new Error("Could not load complete query results");
    if (data.length === 0) return rows;
    rows.push(...data);
  }
}

/** Complete query result for route handlers that map read failures to HTTP 503. */
export async function readAllRowsResult<T>(
  page: Parameters<typeof readAllRows<T>>[0],
): Promise<{ data: T[] | null; error: { message: string } | null }> {
  try {
    return { data: await readAllRows(page), error: null };
  } catch {
    return {
      data: null,
      error: { message: "Could not load complete query results" },
    };
  }
}
