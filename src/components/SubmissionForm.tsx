import { useState } from "react";
import { Card } from "./Card";

interface CardOption {
  readonly id: string;
  readonly name: string;
  readonly numeral: string;
  readonly art: string;
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

  const canSubmit =
    text.trim().length > 0 && selectedCard !== "" && status !== "submitting";

  const handleSubmit = async (): Promise<void> => {
    setStatus("submitting");
    setMessage("");
    try {
      const res = await fetch("/api/fortunes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), card: selectedCard }),
      });
      const data = (await res.json()) as {
        readonly ok: boolean;
        readonly error?: string;
        readonly id?: string;
      };
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
    <>
      <textarea
        className="input width-75"
        value={text}
        maxLength={MAX_LEN}
        placeholder="Write your fortune here..."
        onChange={(e) => setText(e.target.value)}
      />
      <h2 className="subtitle">Choose a Card:</h2>
      <div className="deck-grid">
        {cards.map((c) => (
          <Card
            card={{ name: c.name, numeral: c.numeral, art: c.art }}
            onClick={() => setSelectedCard(c.id)}
            className={
              selectedCard === c.id ? "tarot-button-selected" : "tarot-button"
            }
          />
        ))}
      </div>
      <button
        type="button"
        className="btn btn-color"
        disabled={!canSubmit}
        onClick={handleSubmit}
      >
        {status === "submitting" ? "Submitting..." : "Send to the Deck"}
      </button>
      {message !== "" && <p className="fortune">{message}</p>}
    </>
  );
};

export { SubmissionForm };
