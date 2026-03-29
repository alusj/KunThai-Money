// BackTab.jsx
// Responsible ONLY for triggering back action

export default function BackTab({ onBack }) {
  return (
    <button onClick={onBack}>
      ←
    </button>
  );
}
