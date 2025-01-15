interface CharacterCounterProps {
  current: number;
  max: number;
}

const CharacterCounter = ({ current, max }: CharacterCounterProps) => {
  const remaining = max - current;
  const isOverLimit = remaining < 0;

  return (
    <span className={`text-sm ${isOverLimit ? 'text-red-500' : 'text-muted-foreground'}`}>
      {remaining} characters remaining
    </span>
  );
};

export default CharacterCounter;