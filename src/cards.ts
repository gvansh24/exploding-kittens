import { Card, CardType } from "./types";

export const CARD_TEMPLATES: Record<CardType, { title: string; description: string; color: string; emoji: string }> = {
  [CardType.EXPLODING_KITTEN]: {
    title: "Exploding Kitten",
    description: "Show this immediately. Defuse or DIE!",
    color: "bg-red-500 border-4 border-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-red-400",
    emoji: "💣"
  },
  [CardType.DEFUSE]: {
    title: "Defuse",
    description: "Safely defuse a kitten with laser pointers, belly rubs, or catnip sandwiches.",
    color: "bg-emerald-400 border-4 border-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-emerald-300",
    emoji: "🛠️"
  },
  [CardType.SKIP]: {
    title: "Skip",
    description: "Immediately end your turn without drawing a card.",
    color: "bg-blue-300 border-4 border-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-200",
    emoji: "🏃"
  },
  [CardType.ATTACK]: {
    title: "Attack",
    description: "Do not draw any cards. Force the next player to take 2 turns in a row!",
    color: "bg-orange-400 border-4 border-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-orange-350",
    emoji: "⚔️"
  },
  [CardType.SEE_THE_FUTURE]: {
    title: "See the Future",
    description: "Peer into the cosmic unknown. Privately view the top 3 cards in the deck.",
    color: "bg-purple-300 border-4 border-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-purple-200",
    emoji: "🔮"
  },
  [CardType.SHUFFLE]: {
    title: "Shuffle",
    description: "Vigorously shake up the remaining deck until it mewls in confusion.",
    color: "bg-sky-300 border-4 border-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-sky-200",
    emoji: "🌀"
  },
  [CardType.FAVOR]: {
    title: "Favor",
    description: "Select another player. They must choose and give you 1 card from their hand.",
    color: "bg-yellow-300 border-4 border-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-200",
    emoji: "🤝"
  },
  [CardType.NOPE]: {
    title: "Nope",
    description: "Cancel any action card played by another player (except Defuse or Kitten). Can Nope other Nopes!",
    color: "bg-rose-400 border-4 border-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-rose-300",
    emoji: "🛑"
  },
  [CardType.CATTERMELON]: {
    title: "Cattermelon",
    description: "A vanilla cat card. Collect 2 of a kind to steal a random card from others.",
    color: "bg-pink-200 border-4 border-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-pink-100",
    emoji: "🍉"
  },
  [CardType.TACOCAT]: {
    title: "Tacocat",
    description: "Palindromic vanilla feline. Collect 2 of a kind to steal a random card.",
    color: "bg-pink-200 border-4 border-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-pink-100",
    emoji: "🌮"
  },
  [CardType.HAIRY_POTATO_CAT]: {
    title: "Hairy Potato Cat",
    description: "Extremely spuddy feline. Collect 2 of a kind to steal a random card.",
    color: "bg-pink-200 border-4 border-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-pink-100",
    emoji: "🥔"
  },
  [CardType.BEARD_CAT]: {
    title: "Beard Cat",
    description: "Uncomfortably bearded feline. Collect 2 of a kind to steal a random card.",
    color: "bg-pink-200 border-4 border-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-pink-100",
    emoji: "🧔"
  },
  [CardType.RAINBOW_RALPHING_CAT]: {
    title: "Rainbow Cat",
    description: "Feline vomiting spectral rays. Collect 2 of a kind to steal a random card.",
    color: "bg-pink-200 border-4 border-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-pink-100",
    emoji: "🌈"
  }
};

export function createNewDeck(numPlayers: number): { deck: Card[]; initialHands: Record<string, Card[]> } {
  const deck: Card[] = [];
  let idCounter = 1;

  const addCard = (type: CardType, count: number) => {
    const template = CARD_TEMPLATES[type];
    for (let i = 0; i < count; i++) {
      deck.push({
        id: `${type}-${idCounter++}`,
        type,
        title: template.title,
        description: template.description,
        color: template.color,
        emoji: template.emoji
      });
    }
  };

  // Build standard actions deck (except defuses and kittens)
  addCard(CardType.SKIP, 5);
  addCard(CardType.ATTACK, 4);
  addCard(CardType.SEE_THE_FUTURE, 5);
  addCard(CardType.SHUFFLE, 4);
  addCard(CardType.FAVOR, 4);
  addCard(CardType.NOPE, 5);

  // Vanilla cats
  addCard(CardType.CATTERMELON, 4);
  addCard(CardType.TACOCAT, 4);
  addCard(CardType.HAIRY_POTATO_CAT, 4);
  addCard(CardType.BEARD_CAT, 4);
  addCard(CardType.RAINBOW_RALPHING_CAT, 4);

  // Shuffle the normal cards first to distribute for initial hands
  const shuffledActions = shuffleArray([...deck]);

  // Give each player 1 Defuse and 4 random cards from the action cards pool
  const initialHands: Record<string, Card[]> = {};
  
  // Create defuse pool
  const makeDefuse = (): Card => ({
    id: `DEFUSE-init-${idCounter++}`,
    type: CardType.DEFUSE,
    title: CARD_TEMPLATES[CardType.DEFUSE].title,
    description: CARD_TEMPLATES[CardType.DEFUSE].description,
    color: CARD_TEMPLATES[CardType.DEFUSE].color,
    emoji: CARD_TEMPLATES[CardType.DEFUSE].emoji
  });

  // Distribute
  for (let pNum = 0; pNum < numPlayers; pNum++) {
    const pId = `player-${pNum}`;
    const pHand: Card[] = [makeDefuse()];
    // Draw 4 random normal cards
    for (let draw = 0; draw < 4; draw++) {
      const drawn = shuffledActions.pop();
      if (drawn) {
        pHand.push(drawn);
      }
    }
    initialHands[pId] = pHand;
  }

  // Put remaining action cards and leftover Defuses back to active deck
  const finalDeck = [...shuffledActions];
  // Add leftover defuses (standard is 6 defuses total, so with players we might have some remaining)
  const remainingDefuses = Math.max(0, 6 - numPlayers);
  for (let i = 0; i < remainingDefuses; i++) {
    finalDeck.push(makeDefuse());
  }

  // Shuffle everything together
  let shuffledFinalDeck = shuffleArray(finalDeck);

  // Inserts (Players - 1) Exploding Kittens secretly into the deck
  const explodingKittenCount = numPlayers - 1;
  for (let i = 0; i < explodingKittenCount; i++) {
    shuffledFinalDeck.push({
      id: `EXPLODING_KITTEN-${idCounter++}`,
      type: CardType.EXPLODING_KITTEN,
      title: CARD_TEMPLATES[CardType.EXPLODING_KITTEN].title,
      description: CARD_TEMPLATES[CardType.EXPLODING_KITTEN].description,
      color: CARD_TEMPLATES[CardType.EXPLODING_KITTEN].color,
      emoji: CARD_TEMPLATES[CardType.EXPLODING_KITTEN].emoji
    });
  }

  // Reshuffle with exploding kittens
  shuffledFinalDeck = shuffleArray(shuffledFinalDeck);

  return { deck: shuffledFinalDeck, initialHands };
}

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
