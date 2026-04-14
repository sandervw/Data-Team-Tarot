import { useState } from "react";

interface CardOption {
  readonly slug: string;
  readonly name: string;
  readonly numeral: string;
}

interface SubmissionFormProps {
  readonly cards: readonly CardOption[];
}

type Status = "idle" | "submitting" | "success" | "error";

const MAX_LEN = 500;

const SubmissionForm = ({ cards }: SubmissionFormProps): React.JSX.Element => {
  const [text, setText] = useState<string>("");
  const [selectedCard, setSelectedCard] = useState<string>("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");

  const canSubmit = text.trim().length > 0 && selectedCard !== "" && status !== "submitting";

  const handleSubmit = async (): Promise<void> => {
    setStatus("submitting");
    setMessage("");
    try {
      const res = await fetch("/api/fortunes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), card: selectedCard }),
      });
      const data = (await res.json()) as { readonly ok: boolean; readonly error?: string; readonly id?: string };
      if (!res.ok || !data.ok) {
        setStatus("error");
        setMessage(data.error ?? "Submission failed");
        return;
      }
      setStatus("success");
      setMessage(`Fortune submitted as ${data.id}`);
      setText("");
      setSelectedCard("");
    } catch {
      setStatus("error");
      setMessage("Network error");
    }
  };

  return (
    <div className="display-flex-column gap-medium">
      <textarea
        className="input input-stretch"
        value={text}
        maxLength={MAX_LEN}
        placeholder="Write your fortune..."
        onChange={(e) => setText(e.target.value)}
      />
      <div className="display-grid display-grid-3-column">
        {cards.map((c) => (
          <button
            key={c.slug}
            type="button"
            className={selectedCard === c.slug ? "btn btn-color" : "btn"}
            onClick={() => setSelectedCard(c.slug)}
          >
            {c.numeral}. {c.name}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="btn btn-color"
        disabled={!canSubmit}
        onClick={handleSubmit}
      >
        {status === "submitting" ? "Submitting..." : "Submit Fortune"}
      </button>
      {message !== "" && <p className="fortune">{message}</p>}
    </div>
  );
};

export { SubmissionForm };
