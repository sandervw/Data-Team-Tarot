interface CardProps {
  readonly card: {
    readonly name: string;
    readonly numeral: string;
    readonly art: string;
  };
}

const images = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/cards/*.{jpeg,jpg,png,gif,webp,png}',
  { eager: true }
);

const Card = ({ card }: CardProps): React.JSX.Element => {
  const artPath = `/src/assets/cards/${card.art}`;
  const resolved = images[artPath]?.default;
  const hasArt = !!resolved;

  return (
    <div className="tarot-card">
      <p className="tarot-numeral">{card.numeral}</p>
      {hasArt ? (
        <img
          src={resolved.src}
          alt={card.name}
          width={resolved.width}
          height={resolved.height}
          className="tarot-art"
        />
      ) : (
        <div className="tarot-art-placeholder">
          <span className="tarot-numeral">{card.numeral}</span>
        </div>
      )}
      <h2 className="tarot-name">{card.name}</h2>
    </div>
  );
};

export { Card };
