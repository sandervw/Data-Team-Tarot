import { Card } from "./Card";
import { getDailyDraw, getPreviousDrawDates } from "../utils/dailyDraw";
import React from "react";

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

interface PriorDrawsProps {
  readonly cards: readonly TarotCard[];
  readonly fortunes: readonly Fortune[];
}

const PriorDraws = ({
  cards,
  fortunes,
}: PriorDrawsProps): React.JSX.Element => {
  const priorDrawDates = getPreviousDrawDates(9, new Date());
  const priorDraws = priorDrawDates.map((date) => {
    const fortune = getDailyDraw(fortunes, date);
    const cardIndex = fortune.card
      ? cards.findIndex((c) => c.id === fortune.card)
      : Math.floor(Math.random() * cards.length);
    const card = cards[cardIndex];
    return { date, fortune, card };
  });

  return (
    <>
      {priorDraws.map(({ date, fortune, card }) => (
        <React.Fragment key={date.toDateString()}>
          <h2 className="subtitle">{date.toDateString()}</h2>
          <Card card={card} />
          <p className="fortune">{fortune.text}</p>
        </React.Fragment>
      ))}
    </>
  );
};

export { PriorDraws };
