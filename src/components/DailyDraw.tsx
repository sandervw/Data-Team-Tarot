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

const DailyDraw = ({ cards, fortunes }: DailyDrawProps): React.JSX.Element => {
  const fortune = getDailyDraw(fortunes, new Date());
  const cardIndex = fortune.card
    ? cards.findIndex((c) => c.id === fortune.card)
    : Math.floor(Math.random() * cards.length);
  const card = cards[cardIndex];

  return (
    <>
      <h2 className="subtitle">{getAdjustedDate(new Date()).toDateString()}</h2>
      <Card card={card} />
      <p className="fortune">{fortune.text}</p>
    </>
  );
};

export { DailyDraw };
