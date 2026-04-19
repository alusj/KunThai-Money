import BackTab from "./BackTab";

export default function AgentTransferHeader({ onBack }) {
  return (
    <div className="relative flex h-14 items-center justify-center border-b">
      <div className="absolute left-4">
        <BackTab onBack={onBack} />
      </div>

      <h1 className="text-lg font-semibold">Agent Transfer</h1>
    </div>
  );
}
