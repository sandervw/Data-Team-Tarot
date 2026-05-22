import { useState } from "react";
import { Card } from "./Card";
import { getDailyDraw, getAdjustedDate } from "../utils/dailyDraw";

interface TarotCard {
  readonly id: string;
  readonly name: string;
  readonly numeral: string;
  readonly art: string;
}

interface Fortune {
  readonly text: string;
  readonly card?: string;
  readonly added: string;
}

interface DailyDrawProps {
  readonly cards: readonly TarotCard[];
  readonly fortunes: readonly Fortune[];
}

const CARD_BACK: TarotCard = {
  id: "card-back",
  name: "",
  numeral: "",
  art: "0-card-back.png",
};

const DailyDraw = ({ cards, fortunes }: DailyDrawProps): React.JSX.Element => {
  const [revealed, setRevealed] = useState<boolean>(false);
  const fortune = getDailyDraw(fortunes, new Date());
  const cardIndex = fortune.card
    ? cards.findIndex((c) => c.id === fortune.card)
    : Math.floor(Math.random() * cards.length);
  const card = cards[cardIndex];

  return (
    <>
      <h2 className="subtitle">{getAdjustedDate(new Date()).toDateString()}</h2>
      <button
        type="button"
        className="tarot-button"
        disabled={revealed}
        onClick={() => setRevealed(true)}
      >
        Reveal
      </button>
      <div className={`tarot-flip${revealed ? " flipped" : ""}`}>
        <div className="tarot-flip-inner">
          <div className="tarot-flip-face">
            <Card card={CARD_BACK} />
          </div>
          <div className="tarot-flip-face tarot-flip-back">
            <Card card={card} />
          </div>
        </div>
      </div>
      {revealed && <p className="fortune">{fortune.text}</p>}
    </>
  );
};

export { DailyDraw };
