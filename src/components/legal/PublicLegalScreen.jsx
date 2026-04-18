import { ChevronLeft, FileText } from "lucide-react";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { LEGAL_CONTENT } from "./legalContent";

export default function PublicLegalScreen() {
  const navigate = useNavigate();
  const { policyKey } = useParams();

  const policy = useMemo(() => LEGAL_CONTENT[policyKey] || null, [policyKey]);

  if (!policy) {
    navigate("/", { replace: true });
    return null;
  }

  const Icon = policy.icon || FileText;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_28%,#f8fafc_100%)]">
      <div className="border-b border-white/60 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-5 md:px-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200"
            aria-label={`Back from ${policy.title}`}
          >
            <ChevronLeft size={22} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-slate-400">
              Legal
            </p>
            <h1 className="mt-1 truncate text-xl font-bold text-slate-950">{policy.title}</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6 md:px-8">
        <div className="rounded-[30px] bg-[#f3f4f6] p-3 sm:p-4">
          <div className="mb-4 flex justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm">
              <Icon size={26} />
            </span>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <div className="border-b border-slate-200 px-5 py-5">
              <p className="text-[1.02rem] font-semibold text-slate-950">{policy.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">{policy.description}</p>
            </div>

            <div>
              {policy.sections.map((section, index) => (
                <div key={section.heading}>
                  <div className="px-5 py-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {section.heading}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{section.body}</p>
                  </div>
                  {index !== policy.sections.length - 1 ? (
                    <div className="ml-[4.6rem] h-px bg-slate-200" />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
