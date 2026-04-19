import { useEffect, useMemo, useState } from "react";
import { Loader2, MapPin, Phone, Search, User, Wallet } from "lucide-react";

import { getDiscoverableAgentAccounts } from "../../../../../Backend/services/otherAccountService";
import { formatCurrency } from "../../../../../Backend/utils/formatCurrency";
import AccountNumber from "../../MainAccountAction/CashOut/AccountNumber";
import BottomSheet from "../../MainAccountAction/CashOut/BottomSheet";
import AgentTransferHeader from "./AgentTransferHeader";

function AgentCard({ agent, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(agent)}
      className="w-full rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-sky-300 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-sky-700">Agent Account</p>
          <h3 className="mt-3 truncate text-xl font-semibold text-slate-950">{agent.agent_name}</h3>
          <p className="mt-2 text-sm font-medium text-slate-500">{agent.account_number}</p>
        </div>

        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
          {agent.distance_km != null && Number.isFinite(agent.distance_km)
            ? `${agent.distance_km.toFixed(agent.distance_km >= 10 ? 0 : 1)} km away`
            : agent.same_city
              ? "Near you"
              : agent.same_country
                ? "Same country"
                : "Available"}
        </span>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <MapPin size={16} className="mt-0.5 text-sky-700" />
        <p className="leading-6">{agent.agent_location}</p>
      </div>
    </button>
  );
}

export default function AgentTransfer({ onBack, refreshAccount, account, user, profile }) {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [transferForm, setTransferForm] = useState({
    amount: "",
    reason: "",
  });

  const buyerName =
    [profile?.first_name, profile?.middle_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    "User";
  const buyerPhone = profile?.phone || user?.phone || "";

  useEffect(() => {
    document.body.style.overflow = "hidden";

    const viewerContext = {
      country: account?.country || "",
      city: account?.city || "",
    };

    const loadAgents = async (context = viewerContext) => {
      setLoading(true);
      setError("");

      try {
        const data = await getDiscoverableAgentAccounts(context);
        setAgents(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Nearby agents could not be loaded.");
        setAgents([]);
      } finally {
        setLoading(false);
      }
    };

    void loadAgents();

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          void loadAgents({
            ...viewerContext,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [account?.city, account?.country]);

  const filteredAgents = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    if (!searchTerm) {
      return agents;
    }

    return agents.filter((agent) =>
      [agent.agent_name, agent.account_number, agent.agent_location]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchTerm))
    );
  }, [agents, search]);

  const numericAmount = Number(transferForm.amount || 0);
  const canContinue =
    Boolean(selectedAgent) &&
    Number.isFinite(numericAmount) &&
    numericAmount > 0 &&
    Boolean(buyerName.trim()) &&
    Boolean(buyerPhone.trim());

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[radial-gradient(circle_at_top,#e0f2fe_0%,#f8fafc_28%,#ffffff_62%)]">
      <AgentTransferHeader onBack={onBack} />

      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
        <section className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-sky-700">
                Agent Transfer
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950">Send through the nearest agents</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Choose a nearby agent, enter the amount, and continue with a fast transfer using your saved profile details.
              </p>
            </div>

            <label className="relative block w-full lg:max-w-md">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search agent name, account, or location"
                className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
              />
            </label>
          </div>
        </section>

        <div className="mt-6">
          {loading ? (
            <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3 text-slate-600">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-sm font-medium">Loading nearby agents...</span>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-[32px] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
              {error}
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="rounded-[32px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-slate-400">No agents yet</p>
              <h3 className="mt-4 text-2xl font-semibold text-slate-950">No discoverable agents right now</h3>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Once agent accounts enable nearby discovery, they will show here with their account name and location.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredAgents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} onSelect={setSelectedAgent} />
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomSheet
        isOpen={Boolean(selectedAgent)}
        onClose={() => setSelectedAgent(null)}
        title={selectedAgent ? `Transfer with ${selectedAgent.agent_name}` : "Agent transfer"}
      >
        {selectedAgent ? (
          <div className="space-y-5">
            <div className="rounded-[26px] border border-sky-200 bg-sky-50 px-5 py-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-sky-700">Selected Agent</p>
              <h3 className="mt-3 text-xl font-semibold text-slate-950">{selectedAgent.agent_name}</h3>
              <p className="mt-2 text-sm text-slate-600">{selectedAgent.account_number}</p>
              <p className="mt-2 text-sm text-slate-600">{selectedAgent.agent_location}</p>
            </div>

            <div className="rounded-[26px] border border-slate-200 bg-white px-5 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    <Wallet size={14} />
                    Amount
                  </span>
                  <div className="mt-2 flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4">
                    <span className="text-sm font-semibold text-slate-500">{account?.currency || "SLL"}</span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={transferForm.amount}
                      onChange={(event) =>
                        setTransferForm((current) => ({ ...current, amount: event.target.value }))
                      }
                      placeholder="0.00"
                      className="w-full bg-transparent px-3 py-3 text-[16px] text-slate-900 outline-none"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Reason
                  </span>
                  <input
                    type="text"
                    value={transferForm.reason}
                    onChange={(event) =>
                      setTransferForm((current) => ({ ...current, reason: event.target.value }))
                    }
                    placeholder="Optional short note"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    <User size={14} />
                    Your Name
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">{buyerName || "Name unavailable"}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    <Phone size={14} />
                    Your Phone
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">{buyerPhone || "Phone unavailable"}</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                Total transfer:{" "}
                <span className="font-semibold text-slate-950">
                  {formatCurrency(numericAmount || 0, account?.currency || "SLL")}
                </span>
              </div>
            </div>

            {canContinue ? (
              <AccountNumber
                account={account}
                user={user}
                profile={profile}
                onClose={() => setSelectedAgent(null)}
                refreshAccount={refreshAccount}
                startStep="confirm"
                disableFormEditing
                backLabel="Back to agent form"
                prefilledRecipientLookup={{
                  is_valid: true,
                  recipient_name: selectedAgent.agent_name,
                  recipient_profile_image: "",
                  recipient_account_number: selectedAgent.account_number,
                  message: "Agent account verified.",
                }}
                initialValues={{
                  accountNumber: selectedAgent.account_number,
                  amount: transferForm.amount,
                  reason: transferForm.reason.trim(),
                }}
                transferMetadata={{
                  flow: "agent_transfer",
                  agent_account_name: selectedAgent.agent_name,
                  agent_location: selectedAgent.agent_location,
                  sender_name: buyerName,
                  buyer_name: buyerName,
                  buyer_phone: buyerPhone,
                }}
                receiptOverrides={{
                  paymentMethod: "Agent transfer",
                  reason: transferForm.reason.trim() || "No note added",
                }}
                successBanner={{
                  title: "Transaction Successful",
                  message: "Your agent transfer receipt is ready below.",
                }}
                errorTitle="Agent transfer unsuccessful"
              />
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Add the amount first. Your name and phone are already pulled from profile for the agent.
              </div>
            )}
          </div>
        ) : null}
      </BottomSheet>
    </div>
  );
}
