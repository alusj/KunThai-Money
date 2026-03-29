import supabase from "../lib/supabaseClient";

export async function getTransactions({ userId, direction = "all", limit, search = "" } = {}) {
  let resolvedUserId = userId;

  if (!resolvedUserId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    resolvedUserId = user?.id;
  }

  if (!resolvedUserId) {
    return [];
  }

  let query = supabase
    .from("transactions")
    .select(
      "id,transaction_type,direction,amount,currency,description,counterparty_name,counterparty_account,created_at,metadata"
    )
    .eq("user_id", resolvedUserId)
    .order("created_at", { ascending: false });

  if (direction !== "all") {
    query = query.eq("direction", direction);
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  if (!search.trim()) {
    return data || [];
  }

  const searchTerm = search.trim().toLowerCase();

  return (data || []).filter((transaction) =>
    [
      transaction.transaction_type,
      transaction.description,
      transaction.counterparty_name,
      transaction.counterparty_account,
      transaction.id,
    ]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(searchTerm))
  );
}

export function summarizeTransactions(transactions = []) {
  return transactions.reduce(
    (summary, transaction) => {
      const amount = Number(transaction.amount || 0);

      if (transaction.direction === "credit") {
        summary.totalInflow += amount;
      } else if (transaction.direction === "debit") {
        summary.totalOutflow += amount;
      }

      summary.totalCount += 1;
      return summary;
    },
    { totalInflow: 0, totalOutflow: 0, totalCount: 0 }
  );
}
