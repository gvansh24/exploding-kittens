import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Play, RotateCcw, HelpCircle, Layers, Trash2, Shield, Eye, Flame, Bomb, ArrowRight, UserPlus, 
  HelpCircle as QuestionIcon, Sparkles, Smile, Star, PlusCircle, AlertCircle
} from "lucide-react";
import { Card, CardType, Player, GameLog } from "../types";
import { createNewDeck, CARD_TEMPLATES } from "../cards";

export default function GamePlay() {
  const [deck, setDeck] = useState<Card[]>([]);
  const [discardPile, setDiscardPile] = useState<Card[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);
  const [attackTurnsRemaining, setAttackTurnsRemaining] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [logs, setLogs] = useState<GameLog[]>([]);
  
  // Interactive Overlays
  const [seeTheFutureCards, setSeeTheFutureCards] = useState<Card[] | null>(null);
  const [pendingDefusal, setPendingDefusal] = useState<{ playerIndex: number; card: Card } | null>(null);
  const [selectedCardsForCombo, setSelectedCardsForCombo] = useState<string[]>([]); // Card IDs
  const [botActionMessage, setBotActionMessage] = useState<string | null>(null);
  const [isBotThinking, setIsBotThinking] = useState<boolean>(false);
  const [botActionTrigger, setBotActionTrigger] = useState<number>(0);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll logs without jumping window
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [logs]);

  // Initial Game Setup
  const handleStartGame = () => {
    const numPlayers = 4;
    const { deck: newDeck, initialHands } = createNewDeck(numPlayers);
    
    const initialPlayers: Player[] = [
      { id: "player-0", name: "You (Defusal Expert)", isBot: false, hand: initialHands["player-0"], isDead: false },
      { id: "player-1", name: "Tacocat 🌮", isBot: true, hand: initialHands["player-1"], isDead: false, botPersonality: "Highly aggressive, loves playing Skip cards at the absolute last minute." },
      { id: "player-2", name: "Cattermelon 🍉", isBot: true, hand: initialHands["player-2"], isDead: false, botPersonality: "Cautious collector, hoards matching pairs to steal your Defuse!" },
      { id: "player-3", name: "Beard Cat 🧔", isBot: true, hand: initialHands["player-3"], isDead: false, botPersonality: "Chaotic prankster, shuffles the deck randomly just to cause panic." }
    ];

    setDeck(newDeck);
    setDiscardPile([]);
    setPlayers(initialPlayers);
    setCurrentPlayerIndex(0);
    setAttackTurnsRemaining(0);
    setGameOver(false);
    setWinner(null);
    setLogs([
      { id: "log-start", playerName: "SYSTEM", action: "Match Started!", detail: "4 players dealt 1 Defuse + 4 cards. Keep an eye on the deck counter!", isImportant: true }
    ]);
    setSeeTheFutureCards(null);
    setPendingDefusal(null);
    setSelectedCardsForCombo([]);
    setBotActionMessage(null);
    setIsBotThinking(false);
    setBotActionTrigger(0);
    setGameStarted(true);
  };

  // Helper to add logs
  const addLog = (playerName: string, action: string, detail?: string, isImportant = false) => {
    setLogs(prev => [...prev, {
      id: `log-${Date.now()}-${Math.random()}`,
      playerName,
      action,
      detail,
      isImportant
    }]);
  };

  // End Turn Mechanism (Drawing card)
  const drawCard = (playerIdx: number) => {
    setSeeTheFutureCards(null);
    if (gameOver || pendingDefusal) return;
    const activePlayer = players[playerIdx];
    if (activePlayer.isDead) return;

    if (deck.length === 0) {
      addLog("SYSTEM", "The deck is totally empty!", "No more kittens! Safe end of matches.", true);
      // Determine winner based on who has most cards or survived
      const alive = players.filter(p => !p.isDead);
      setWinner(alive[0] || players[0]);
      setGameOver(true);
      return;
    }

    const nextDeck = [...deck];
    const drawnCard = nextDeck.shift()!;
    setDeck(nextDeck);

    addLog(activePlayer.name, "DREW A CARD", `Remaining Deck Count: ${nextDeck.length}`);

    if (drawnCard.type === CardType.EXPLODING_KITTEN) {
      addLog(activePlayer.name, "💣 DRAW_EXPLODING_KITTEN", "An absolute emergency!", true);
      
      // Check if player has defuse
      const defuseIdx = activePlayer.hand.findIndex(c => c.type === CardType.DEFUSE);
      if (defuseIdx !== -1) {
        // Trigger defusal overlays
        setPendingDefusal({ playerIndex: playerIdx, card: drawnCard });
      } else {
        // No defuse! BOOM!
        handleKnockout(playerIdx);
      }
    } else {
      // Normal Card Add
      const updatedPlayers = players.map((p, idx) => {
        if (idx === playerIdx) {
          return { ...p, hand: [...p.hand, drawnCard] };
        }
        return p;
      });
      setPlayers(updatedPlayers);
      advanceTurn(playerIdx);
    }
  };

  // Defusing Kittens
  const handleDefuseKitten = (insertionIndex: "TOP" | "MID" | "BOTTOM" | "RANDOM") => {
    if (!pendingDefusal) return;
    const { playerIndex, card: kittenCard } = pendingDefusal;
    const activePlayer = players[playerIndex];

    // Remove 1 Defuse card from current player's hand
    const defuseIdx = activePlayer.hand.findIndex(c => c.type === CardType.DEFUSE);
    if (defuseIdx === -1) return; // shouldn't happen but safe guard

    const updatedHand = [...activePlayer.hand];
    const discardedDefuse = updatedHand.splice(defuseIdx, 1)[0];

    // Discard Defuse
    setDiscardPile(prev => [discardedDefuse, ...prev]);

    // Insert Kitten back to deck
    const nextDeck = [...deck];
    let actualIdx = 0;
    let label = "top of the deck";

    if (insertionIndex === "TOP") {
      nextDeck.unshift(kittenCard);
      actualIdx = 0;
      label = "Top spot (1st card)";
    } else if (insertionIndex === "MID") {
      actualIdx = Math.min(2, nextDeck.length);
      nextDeck.splice(actualIdx, 0, kittenCard);
      label = `3rd spot (index ${actualIdx})`;
    } else if (insertionIndex === "BOTTOM") {
      nextDeck.push(kittenCard);
      actualIdx = nextDeck.length - 1;
      label = "Bottom spot";
    } else {
      actualIdx = Math.floor(Math.random() * (nextDeck.length + 1));
      nextDeck.splice(actualIdx, 0, kittenCard);
      label = `Random spot (index ${actualIdx})`;
    }

    setDeck(nextDeck);
    
    // Update players state
    const updatedPlayers = players.map((p, idx) => {
      if (idx === playerIndex) {
        return { ...p, hand: updatedHand };
      }
      return p;
    });
    setPlayers(updatedPlayers);

    const logLabel = playerIndex === 0 ? `at the: ${label}.` : `in secret.`;
    addLog(activePlayer.name, "🛠️ PLAYED DEFUSE", `Defused the Exploding Kitten! Slid it privately back into the deck ${logLabel}`, true);
    setPendingDefusal(null);

    // Advance turn index
    advanceTurn(playerIndex);
  };

  // Turn management flow
  const advanceTurn = (playerIdx: number) => {
    setSeeTheFutureCards(null);
    if (attackTurnsRemaining > 1) {
      setAttackTurnsRemaining(prev => prev - 1);
      addLog(players[playerIdx].name, "DRAW REMAINING", `Must draw again due to stacked Attacks! (${attackTurnsRemaining - 1} attack draws remaining.)`);
      // Since they have matches left, turn index remains same!
    } else {
      setAttackTurnsRemaining(0);
      findNextPlayer(playerIdx);
    }
  };

  const findNextPlayer = (currentIndex: number, currentPlayersState: Player[] = players) => {
    let nextIdx = (currentIndex + 1) % currentPlayersState.length;
    let loops = 0;
    while (currentPlayersState[nextIdx].isDead && loops < currentPlayersState.length) {
      nextIdx = (nextIdx + 1) % currentPlayersState.length;
      loops++;
    }

    if (loops >= currentPlayersState.length) {
      // Safe guard
      setGameOver(true);
    } else {
      setCurrentPlayerIndex(nextIdx);
    }
  };

  // Dead Player Execution
  const handleKnockout = (playerIdx: number) => {
    const isHuman = playerIdx === 0;
    const deadPlayer = players[playerIdx];

    const updatedPlayers = players.map((p, idx) => {
      if (idx === playerIdx) {
        return { ...p, isDead: true, hand: [] }; // lose all cards on death
      }
      return p;
    });

    setPlayers(updatedPlayers);
    addLog(deadPlayer.name, "💥 EXPLODED", "No Defuse card left in hand! Out of the game.", true);
    setPendingDefusal(null);

    // Filter surviving players
    const survivors = updatedPlayers.filter(p => !p.isDead);
    if (survivors.length === 1) {
      setWinner(survivors[0]);
      setGameOver(true);
      addLog("SYSTEM", "GAME OVER", `🎉 ${survivors[0].name} is the ULTIMATE Survivor!`, true);
    } else {
      // Find next player, cancel leftover attacks from the dead player
      setAttackTurnsRemaining(0);
      findNextPlayer(playerIdx, updatedPlayers);
    }
  };

  // Bot Turn Intelligence loop
  useEffect(() => {
    if (!gameStarted || gameOver || pendingDefusal) return;

    const activePlayer = players[currentPlayerIndex];
    if (activePlayer && activePlayer.isBot && !activePlayer.isDead) {
      setIsBotThinking(true);
      const timer = setTimeout(() => {
        executeBotAI(currentPlayerIndex);
      }, 1400); // realistic playing delay
      return () => clearTimeout(timer);
    }
  }, [currentPlayerIndex, gameStarted, gameOver, pendingDefusal, botActionTrigger, attackTurnsRemaining]);

  // Bot Auto-Defuse loop
  useEffect(() => {
    if (pendingDefusal && pendingDefusal.playerIndex !== 0) {
      const timer = setTimeout(() => {
        handleDefuseKitten("RANDOM");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [pendingDefusal]);

  // AI Tactical Decisions Module
  const executeBotAI = (botIdx: number) => {
    const bot = players[botIdx];
    const botHand = [...bot.hand];

    // Priority 1: Check if bot holds and wants to play Skip or Attack to avoid drawing
    // Only play if bot holds action cards
    const skipCard = botHand.find(c => c.type === CardType.SKIP);
    const attackCard = botHand.find(c => c.type === CardType.ATTACK);
    const seeFutureCard = botHand.find(c => c.type === CardType.SEE_THE_FUTURE);
    const shuffleCard = botHand.find(c => c.type === CardType.SHUFFLE);
    const favorCard = botHand.find(c => c.type === CardType.FAVOR);

    // Bot matches check (Pairs)
    const cardCounts: Record<string, number[]> = {};
    botHand.forEach((card, idx) => {
      if (card.type !== CardType.DEFUSE && card.type !== CardType.EXPLODING_KITTEN) {
        if (!cardCounts[card.title]) cardCounts[card.title] = [];
        cardCounts[card.title].push(idx);
      }
    });

    const matchingPairKey = Object.keys(cardCounts).find(k => cardCounts[k].length >= 2);

    // Logic: If there is a highly dangerous state (e.g. deck has top kitten known or very few cards)
    const deckDangerRatio = deck.length <= 4;

    if (matchingPairKey) {
      const idxs = cardCounts[matchingPairKey];
      const cardA = botHand[idxs[0]];
      const cardB = botHand[idxs[1]];

      const nextHand = botHand.filter((_, i) => i !== idxs[0] && i !== idxs[1]);
      
      const validTargets = players.filter((p, i) => i !== botIdx && !p.isDead && p.hand.length > 0);
      
      if (validTargets.length > 0) {
        const targetPlayer = validTargets[Math.floor(Math.random() * validTargets.length)];
        const targetIdx = players.findIndex(p => p.id === targetPlayer.id);

        const randomTargetCardIdx = Math.floor(Math.random() * targetPlayer.hand.length);
        const stolenCard = targetPlayer.hand[randomTargetCardIdx];

        const newTargetHand = targetPlayer.hand.filter((_, i) => i !== randomTargetCardIdx);

        setPlayers(prev => prev.map((p, pIdx) => {
          if (pIdx === botIdx) return { ...p, hand: [...nextHand, stolenCard] };
          if (pIdx === targetIdx) return { ...p, hand: newTargetHand };
          return p;
        }));

        setDiscardPile(prev => [cardA, cardB, ...prev]);
        
        const logMsg = targetIdx === 0 
          ? `Used two matching '${matchingPairKey}' cards to steal a random card from your hand!`
          : `Used two matching '${matchingPairKey}' cards to steal a random card from ${targetPlayer.name}!`;
          
        addLog(bot.name, "🐾 PLAYED PAIR COMBO", logMsg, targetIdx === 0);
        setIsBotThinking(false);
        setBotActionTrigger(prev => prev + 1);
        return;
      }
    }

    if (deckDangerRatio && (skipCard || attackCard)) {
      // Highly dangerous! Try to run away
      const cardToPlay = attackCard || skipCard!;
      const playedHand = botHand.filter(c => c.id !== cardToPlay.id);
      
      setPlayers(prev => prev.map((p, idx) => {
        if (idx === botIdx) return { ...p, hand: playedHand };
        return p;
      }));
      setDiscardPile(prev => [cardToPlay, ...prev]);

      if (cardToPlay.type === CardType.ATTACK) {
        setAttackTurnsRemaining(prev => (prev > 0 ? prev : 0) + 2);
        addLog(bot.name, "⚔️ PLAYED ATTACK", "Avoided drawing and added 2 attacks to the next player!");
        setIsBotThinking(false);
        findNextPlayer(botIdx);
      } else {
        addLog(bot.name, "🏃 PLAYED SKIP", "Safely skipped drawing their card!");
        setIsBotThinking(false);
        advanceTurn(botIdx);
      }
      return;
    }

    if (favorCard && Math.random() > 0.4) {
      // play favor
      const playedHand = botHand.filter(c => c.id !== favorCard.id);
      
      const validTargets = players.filter((p, i) => i !== botIdx && !p.isDead && p.hand.length > 0);
      if (validTargets.length > 0) {
        const targetPlayer = validTargets[Math.floor(Math.random() * validTargets.length)];
        const randomCardIdx = Math.floor(Math.random() * targetPlayer.hand.length);
        const stolenCard = targetPlayer.hand[randomCardIdx];
        
        const targetHand = targetPlayer.hand.filter((_, i) => i !== randomCardIdx);
        
        setPlayers(prev => prev.map(p => {
          if (p.id === bot.id) return { ...p, hand: [...playedHand, stolenCard] };
          if (p.id === targetPlayer.id) return { ...p, hand: targetHand };
          return p;
        }));
        
        setDiscardPile(prev => [favorCard, ...prev]);
        addLog(bot.name, "🤝 PLAYED FAVOR", `Forced ${targetPlayer.name} to give a card!`);
        setIsBotThinking(false);
        setBotActionTrigger(prev => prev + 1);
        return; // Bot made a move, re-triggers AI next render
      }
    }

    if (seeFutureCard && Math.random() > 0.4) {
      // Play see the future
      const playedHand = botHand.filter(c => c.id !== seeFutureCard.id);
      setPlayers(prev => prev.map((p, idx) => {
        if (idx === botIdx) return { ...p, hand: playedHand };
        return p;
      }));
      setDiscardPile(prev => [seeFutureCard, ...prev]);
      
      // Simulated Bot look at future
      const top3 = deck.slice(0, 3).map(c => c.title).join(", ");
      addLog(bot.name, "🔮 PLAYED SEE THE FUTURE", `Peered into the cosmic unknown at the top 3 cards.`);
      
      // If bot sees kitten on top, they will shuffle next if they have one!
      if (deck.slice(0, 1).some(c => c.type === CardType.EXPLODING_KITTEN) && shuffleCard) {
        // Shuffler trigger
        const shuffleHand = playedHand.filter(c => c.id !== shuffleCard.id);
        setPlayers(prev => prev.map((p, idx) => {
          if (idx === botIdx) return { ...p, hand: shuffleHand };
          return p;
        }));
        setDiscardPile(prev => [shuffleCard, ...prev]);

        // Shuffle deck
        const shuffledDeck = [...deck];
        shuffledDeck.sort(() => Math.random() - 0.5);
        setDeck(shuffledDeck);
        addLog(bot.name, "🌀 PLAYED SHUFFLE", "Panicked because of kittens on top and shook up the entire deck!");
      }

      setIsBotThinking(false);
      setBotActionTrigger(prev => prev + 1);
      return; 
    }

    // Default bot action: Draw card
    setIsBotThinking(false);
    drawCard(botIdx);
  };

  // User Actions: Play standard cards
  const handlePlayCard = (card: Card, cardIndex: number) => {
    if (currentPlayerIndex !== 0 || pendingDefusal || gameOver) return;

    if (card.type === CardType.DEFUSE) {
      addLog("SYSTEM", "⚠️ INVALID ACTION", "Defuse cards cannot be played as regular actions! They activate automatically when you draw an Exploding Kitten.");
      return;
    }

    const user = players[0];
    const updatedHand = [...user.hand];
    updatedHand.splice(cardIndex, 1);

    // Handle Card Specials
    if (card.type !== CardType.SEE_THE_FUTURE) {
      setSeeTheFutureCards(null);
    }

    if (card.type === CardType.SKIP) {
      setDiscardPile(prev => [card, ...prev]);
      setPlayers(prev => prev.map((p, idx) => idx === 0 ? { ...p, hand: updatedHand } : p));
      addLog(user.name, "🏃 PLAYED SKIP", "Avoided drawing and successfully ended 1 turn!");
      advanceTurn(0);
    } else if (card.type === CardType.ATTACK) {
      setDiscardPile(prev => [card, ...prev]);
      setPlayers(prev => prev.map((p, idx) => idx === 0 ? { ...p, hand: updatedHand } : p));
      setAttackTurnsRemaining(prev => (prev > 0 ? prev : 0) + 2);
      addLog(user.name, "⚔️ PLAYED ATTACK", "Ended turn and forced the next player to assume 2 consecutive turns!");
      findNextPlayer(0);
    } else if (card.type === CardType.SHUFFLE) {
      setDiscardPile(prev => [card, ...prev]);
      // Shuffle Remaining Deck
      const nextDeck = [...deck];
      // Random permutation
      for (let i = nextDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [nextDeck[i], nextDeck[j]] = [nextDeck[j], nextDeck[i]];
      }
      setDeck(nextDeck);
      setPlayers(prev => prev.map((p, idx) => idx === 0 ? { ...p, hand: updatedHand } : p));
      addLog(user.name, "🌀 PLAYED SHUFFLE", "Vigorously shook remaining deck list.");
    } else if (card.type === CardType.SEE_THE_FUTURE) {
      setDiscardPile(prev => [card, ...prev]);
      setPlayers(prev => prev.map((p, idx) => idx === 0 ? { ...p, hand: updatedHand } : p));
      setSeeTheFutureCards(deck.slice(0, 3));
      addLog(user.name, "🔮 PLAYED SEE THE FUTURE", "Inspected the upcoming top 3 cards.");
    } else if (card.type === CardType.FAVOR) {
      setDiscardPile(prev => [card, ...prev]);
      const validTargets = players.filter((p, i) => i !== 0 && !p.isDead && p.hand.length > 0);
      if (validTargets.length > 0) {
        const targetPlayer = validTargets[Math.floor(Math.random() * validTargets.length)];
        const randomCardIdx = Math.floor(Math.random() * targetPlayer.hand.length);
        const stolenCard = targetPlayer.hand[randomCardIdx];
        const targetHand = targetPlayer.hand.filter((_, i) => i !== randomCardIdx);
        
        setPlayers(prev => prev.map(p => {
          if (p.id === user.id) return { ...p, hand: [...updatedHand, stolenCard] };
          if (p.id === targetPlayer.id) return { ...p, hand: targetHand };
          return p;
        }));
        addLog(user.name, "🤝 PLAYED FAVOR", `Forced ${targetPlayer.name} to give you a card! (Received ${stolenCard.title})`);
      } else {
        setPlayers(prev => prev.map((p, idx) => idx === 0 ? { ...p, hand: updatedHand } : p));
        addLog(user.name, "🤝 PLAYED FAVOR", "No valid players to take a card from!");
      }
    } else if (card.type === CardType.NOPE) {
      setDiscardPile(prev => [card, ...prev]);
      // Nope needs to be played on someone else's action, but in a single player fast game we can play it normally too
      setPlayers(prev => prev.map((p, idx) => idx === 0 ? { ...p, hand: updatedHand } : p));
      addLog(user.name, "🛑 PLAYED NOPE", "A direct exclamation of NOPE! Adds flair, though typically played out of turn.");
    } else {
      // If it's a vanilla Cat, check if player wants to activate combos
      // Toggle card selection instead
      const isSelected = selectedCardsForCombo.includes(card.id);
      if (isSelected) {
        setSelectedCardsForCombo(prev => prev.filter(id => id !== card.id));
      } else {
        if (selectedCardsForCombo.length < 2) {
          setSelectedCardsForCombo(prev => [...prev, card.id]);
        }
      }
    }
  };

  // Launch pair-combo to steal card
  const handlePlayPairCombo = () => {
    setSeeTheFutureCards(null);
    if (selectedCardsForCombo.length !== 2) return;
    const user = players[0];
    
    // Check if card titles are identical (matching pair)
    const cardA = user.hand.find(c => c.id === selectedCardsForCombo[0])!;
    const cardB = user.hand.find(c => c.id === selectedCardsForCombo[1])!;

    if (cardA.title !== cardB.title) {
      alert("Combos must be a matching pair of the same title (e.g. 2 Tacocats)!");
      setSelectedCardsForCombo([]);
      return;
    }

    // Play combo
    const remainingHand = user.hand.filter(c => c.id !== cardA.id && c.id !== cardB.id);
    
    // Choose random Bot as target
    const targetIdx = 1 + Math.floor(Math.random() * 3);
    const targetPlayer = players[targetIdx];

    if (targetPlayer.isDead || targetPlayer.hand.length === 0) {
      alert(`${targetPlayer.name} is either dead or out of card payload! Select another time.`);
      setSelectedCardsForCombo([]);
      return;
    }

    const randomCardIdx = Math.floor(Math.random() * targetPlayer.hand.length);
    const stolenCard = targetPlayer.hand[randomCardIdx];

    const updatedTargetHand = targetPlayer.hand.filter((_, i) => i !== randomCardIdx);

    setPlayers(prev => prev.map((p, idx) => {
      if (idx === 0) return { ...p, hand: [...remainingHand, stolenCard] };
      if (idx === targetIdx) return { ...p, hand: updatedTargetHand };
      return p;
    }));

    setDiscardPile(prev => [cardA, cardB, ...prev]);
    setSelectedCardsForCombo([]);
    addLog(user.name, "🐾 ACTIVATED PAIR STEAL", `Stole a random card from ${targetPlayer.name} using two matching ${cardA.title}s! Detailed: Obtained ${stolenCard.title}.`, true);
  };

  return (
    <div className="space-y-6">
      {!gameStarted ? (
        // Start Board
        <div className="bg-white border-4 border-black rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center justify-center py-20 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 text-slate-200 text-9xl opacity-15 select-none pointer-events-none">🐱</div>
          <Bomb className="w-16 h-16 text-red-600 mb-6 animate-bounce" />
          <h2 className="font-sans text-3xl sm:text-5xl font-black text-black tracking-tighter uppercase">KITTEN DEFUSING ARENA</h2>
          <p className="text-slate-800 max-w-lg mt-4 text-sm sm:text-base leading-relaxed font-sans font-bold">
            Play against 3 intelligent AI Kitten bots: Tacocat 🌮, Cattermelon 🍉, and Beard Cat 🧔. 
            Defuse explosions, play complex skips, stack attacks, and steal cards to survive! 
          </p>
          <button
            onClick={handleStartGame}
            className="mt-8 bg-yellow-400 hover:bg-yellow-300 text-black font-sans font-black py-4 px-10 rounded-xl text-lg border-4 border-black hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase tracking-tight"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Shuffle & Deal Hands</span>
          </button>
        </div>
      ) : (
        // Play area layout
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 items-start font-sans">
          
          {/* LEFT SIDEBAR: Bot Opponents (1 col) */}
          <div className="xl:col-span-1 space-y-4">
            <h3 className="font-sans font-black text-xs tracking-wider uppercase text-black flex items-center gap-2">
              🤖 AI CHALLENGERS
            </h3>
            {/* BOT PLAYERS HUD */}
            <div className="grid grid-cols-1 gap-4">
              {players.slice(1).map((bot, bIdx) => {
                const isCurrent = currentPlayerIndex === bIdx + 1;
                const deadClass = bot.isDead ? "opacity-50 grayscale border-black bg-slate-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" : "bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]";
                const currentBorder = isCurrent && !bot.isDead 
                  ? "border-yellow-400 ring-4 ring-yellow-300 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-amber-50" 
                  : "border-4 border-black";

                return (
                  <div 
                    key={bot.id} 
                    className={`p-4 rounded-xl border-4 transition-all flex flex-col justify-between ${currentBorder} ${deadClass}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl p-1 bg-white rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                          {bIdx === 0 ? "🌮" : bIdx === 1 ? "🍉" : "🧔"}
                        </div>
                        <div>
                          <h4 className="font-black text-black text-sm uppercase tracking-tight">{bot.name}</h4>
                          <span className="text-[9px] text-slate-700 font-black block">AI CHALLENGER</span>
                        </div>
                      </div>
                      <div className="text-right">
                        {bot.isDead ? (
                          <span className="text-[10px] bg-red-600 text-white border-2 border-black px-2 py-0.5 rounded font-mono uppercase font-black">
                            💥 DEAD
                          </span>
                        ) : (
                          <span className="whitespace-nowrap flex items-center justify-center text-xs text-white font-mono font-black bg-black px-2 py-1 rounded border-2 border-black">
                            {bot.hand.length} Cards
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Bot active status banner */}
                    <div className="mt-4 pt-3 border-t-2 border-black text-xs text-slate-800 flex items-center justify-between">
                      <span className="italic block max-w-[140px] truncate font-bold">{bot.botPersonality}</span>
                      {isCurrent && !bot.isDead && (
                        <span className="text-[9px] bg-red-600 text-white font-black border border-black px-2 py-0.5 rounded animate-pulse uppercase">
                          Thinking...
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CENTER ARENA: Table & Hand (3 cols) */}
          <div className="xl:col-span-3 space-y-4">
            {/* CENTRAL TABLE: DECK & DISCARD PILE */}
            <div className="bg-emerald-600 border-8 border-amber-900 rounded-2xl p-3 shadow-[inset_0px_0px_20px_rgba(0,0,0,0.5),8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col items-center justify-center min-h-[160px]">
              {/* Pattern overlay */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#ffffff_0%,_transparent_100%)]"></div>
              
              <div className="flex gap-12 sm:gap-24 items-center relative z-10 w-full justify-center">
                {/* DRAW DECK */}
                <div className="flex flex-col items-center relative">
                  <span className="text-white font-black uppercase text-xs mb-2 tracking-widest drop-shadow-md">Draw Deck</span>
                  <div className="relative w-32 aspect-[2/3] cursor-pointer group" onClick={() => { if(currentPlayerIndex===0) drawCard(0); }}>
                    {deck.length > 0 ? (
                      Array.from({ length: Math.min(deck.length, 5) }).map((_, i) => (
                        <div 
                          key={`deck-${i}`}
                          className="absolute w-full h-full bg-slate-800 border-4 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000000_10px,#000000_20px)] transition-transform group-hover:-translate-y-1"
                          style={{ top: -i * 3, left: -i * 3, zIndex: i }}
                        >
                          <div className="bg-white m-2 absolute inset-0 rounded border-2 border-black flex items-center justify-center">
                            <span className="text-4xl">🐱</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="w-full h-full border-4 border-dashed border-emerald-800 rounded-xl flex items-center justify-center opacity-50">
                        <span className="text-emerald-900 font-bold text-xs uppercase">Empty</span>
                      </div>
                    )}
                  </div>
                  <span className="mt-8 bg-black text-white font-mono text-xs px-3 py-1 rounded-full border-2 border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {deck.length} Left
                  </span>
                </div>

                {/* DISCARD PILE */}
                <div className="flex flex-col items-center relative">
                  <span className="text-white font-black uppercase text-xs mb-2 tracking-widest drop-shadow-md">Discard Pile</span>
                  <div className="relative w-32 aspect-[2/3]">
                    {discardPile.length > 0 ? (
                      <AnimatePresence>
                        {discardPile.slice(0, 5).reverse().map((card, idx) => {
                          const isTop = idx === Math.min(discardPile.length, 5) - 1;
                          return (
                            <motion.div 
                              layoutId={`card-${card.id}`}
                              key={card.id}
                              initial={{ opacity: 0, scale: 1.5, y: -50 }}
                              animate={{ opacity: 1, scale: 1, y: 0, rotate: (card.id.length % 5 - 2) * 8 }}
                              className={`absolute w-full h-full p-2 rounded-xl border-4 border-black flex flex-col justify-between text-left shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white ${card.color} ${!isTop && 'opacity-80 grayscale-[0.5]'}`}
                              style={{ zIndex: idx }}
                            >
                              <div className="flex justify-between items-start gap-1">
                                <span className="font-sans font-black text-[10px] uppercase block text-black tracking-tighter leading-none line-clamp-1">{card.title}</span>
                              </div>
                              <div className="flex-1 flex items-center justify-center py-1">
                                <span className="text-4xl filter drop-shadow">{card.emoji}</span>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    ) : (
                      <div className="w-full h-full border-4 border-dashed border-emerald-800 rounded-xl flex items-center justify-center opacity-50">
                        <span className="text-emerald-900 font-bold text-xs uppercase text-center px-2">Play Here</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* INTERACTIVE STATE OVERLAYS */}
            {seeTheFutureCards && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white border-4 border-black p-6 sm:p-8 rounded-2xl relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black max-w-2xl w-full mx-auto animate-in fade-in zoom-in duration-200">
                  <div className="absolute top-0 right-0 p-4 text-purple-600 text-5xl sm:text-7xl opacity-20 pointer-events-none">🔮</div>
                  <h3 className="font-sans font-black text-purple-900 text-xl mb-1 uppercase tracking-tight">Cosmic Visions (See the Future)</h3>
                  <p className="text-sm text-slate-800 font-bold mb-6">Privately view the upcoming 3 cards remaining in the deck index:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {seeTheFutureCards.length > 0 ? (
                      seeTheFutureCards.map((card, idx) => (
                        <div key={idx} className="bg-purple-100 border-2 border-black p-4 rounded-xl text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black flex flex-col items-center justify-center">
                          <span className="text-4xl block mb-2">{card.emoji}</span>
                          <h4 className="text-sm font-black text-black block">{card.title}</h4>
                          <span className="text-[11px] text-purple-950 font-bold uppercase mt-1">{idx === 0 ? "Next drawn" : idx === 1 ? "2nd card" : "3rd card"}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-purple-800 font-black italic col-span-3 text-center">Deck holds no cards payload currently!</span>
                    )}
                  </div>
                  <div className="mt-8 flex justify-end">
                    <button
                      onClick={() => setSeeTheFutureCards(null)}
                      className="bg-purple-400 hover:bg-purple-300 text-black text-sm font-black py-3 px-8 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] rounded-xl transition duration-100 cursor-pointer uppercase shrink-0"
                    >
                      Close Vision
                    </button>
                  </div>
                </div>
              </div>
            )}

            {pendingDefusal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur p-4">
                <div className="bg-emerald-300 border-4 border-black p-8 sm:p-12 rounded-3xl shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center text-black flex flex-col justify-center items-center max-w-3xl w-full mx-auto animate-in zoom-in duration-300">
                  <Shield className="w-16 h-16 text-black mb-4 animate-pulse" />
                  <h3 className="font-sans font-black text-black text-3xl sm:text-4xl tracking-tighter uppercase">KITTEN DEFUSAL REQUIRED!</h3>
                  <p className="text-sm sm:text-base text-black font-black max-w-lg mt-4 leading-relaxed">
                    {players[pendingDefusal.playerIndex].name} drew an Exploding Kitten! 
                    Fortunately, a **Defuse card** is held in your inventory payload. 
                    Choose exactly where you want to insert the Kitten card back into the remaining deck secretly:
                  </p>

                  {currentPlayerIndex === 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 w-full max-w-2xl">
                      <button
                        onClick={() => handleDefuseKitten("TOP")}
                        className="bg-white hover:bg-slate-100 border-4 border-black text-black text-sm font-black p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer uppercase"
                      >
                        Top Spot (1st)
                      </button>
                      <button
                        onClick={() => handleDefuseKitten("MID")}
                        className="bg-white hover:bg-slate-100 border-4 border-black text-black text-sm font-black p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer uppercase"
                      >
                        3rd Card Spot
                      </button>
                      <button
                        onClick={() => handleDefuseKitten("BOTTOM")}
                        className="bg-white hover:bg-slate-100 border-4 border-black text-black text-sm font-black p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer uppercase"
                      >
                        Bottom Spot
                      </button>
                      <button
                        onClick={() => handleDefuseKitten("RANDOM")}
                        className="bg-white hover:bg-slate-100 border-4 border-black text-black text-sm font-black p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer uppercase"
                      >
                        Random Spot
                      </button>
                    </div>
                  ) : (
                    <div className="mt-8 text-sm sm:text-base text-black font-black italic bg-emerald-400 p-4 border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      AI bot is placing the kitten back...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* GAME WINNER HUD */}
            {gameOver && (
              <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 rounded-xl text-center relative overflow-hidden text-black">
                <h3 className="font-sans font-black text-3xl text-red-600 tracking-tighter uppercase">🎉 CHAMPION DECLARED!</h3>
                <p className="text-black font-black mt-2 text-sm">{winner ? `${winner.name} survived and is crowned kitten defusal royalty!` : "Match over."}</p>
                
                <div className="mt-6 flex flex-col md:flex-row gap-3 justify-center">
                  <button
                    onClick={handleStartGame}
                    className="bg-yellow-400 hover:bg-yellow-300 border-4 border-black text-black font-sans font-black py-3 px-8 rounded-lg text-sm transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer uppercase"
                  >
                    Play Again
                  </button>
                </div>
              </div>
            )}

            {/* PLAYER CONTROL HUB (USER INTERACTION) */}
            <div className="bg-white border-4 border-black rounded-xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4 text-black">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b-2 border-black pb-4">
                <div>
                  <h3 className="font-sans font-black text-lg text-black flex items-center gap-2 uppercase tracking-tighter">
                    <span>Your Hand Inventory</span>
                    <span className="text-xs bg-black text-white font-mono px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]">
                      {players[0]?.hand?.length || 0} Cards
                    </span>
                  </h3>
                  <p className="text-xs text-slate-800 font-bold mt-1">Select any card to play. End your turn by choosing &ldquo;Draw Card&rdquo;.</p>
                </div>

                {currentPlayerIndex === 0 && !pendingDefusal && !gameOver && (
                  <div className="flex gap-2.5">
                    {selectedCardsForCombo.length === 2 && (
                      <button
                        onClick={handlePlayPairCombo}
                        className="bg-amber-400 hover:bg-amber-300 border-2 border-black text-black text-xs font-black py-2.5 px-4 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center gap-1.5 cursor-pointer uppercase font-sans shrink-0"
                      >
                        <QuestionIcon className="w-3.5 h-3.5" />
                        <span>Play Pair Stolen Combo</span>
                      </button>
                    )}
                    <button
                      onClick={() => drawCard(0)}
                      className="bg-yellow-400 hover:bg-yellow-300 text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all font-sans font-black py-2.5 px-6 rounded-lg text-xs cursor-pointer flex items-center gap-1 uppercase shrink-0"
                    >
                      <span>Draw Card & End Turn</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* HAND LIST OR DRAWER */}
              <div className="flex flex-wrap justify-center gap-3 pb-4 pt-1 max-h-[280px] overflow-y-auto">
                {players[0]?.hand?.length > 0 ? (
                  <AnimatePresence>
                    {players[0].hand.map((card, idx) => {
                      const isComboSelected = selectedCardsForCombo.includes(card.id);
                      const selectedBorder = isComboSelected ? "ring-4 ring-yellow-300 font-black" : "";
                      const selectOpacity = (currentPlayerIndex !== 0) ? "opacity-75" : "";

                      return (
                        <motion.button
                          layoutId={`card-${card.id}`}
                          initial={{ opacity: 0, y: 50, scale: 0.8 }}
                          animate={{ opacity: 1, y: 0, scale: 1, rotate: isComboSelected ? 2 : 0 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          whileHover={{ y: -15, scale: 1.05 }}
                          key={card.id || idx}
                          onClick={() => handlePlayCard(card, idx)}
                          disabled={currentPlayerIndex !== 0 || pendingDefusal || gameOver}
                          className={`min-w-[130px] w-36 aspect-[2/3] p-3 rounded-xl border-4 border-black flex flex-col justify-between text-left relative cursor-pointer group shrink-0 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${card.color} ${selectedBorder} ${selectOpacity}`}
                        >
                          <div className="flex justify-between items-start gap-1">
                            <span className="font-sans font-black text-xs uppercase block text-black tracking-tighter select-none leading-none">
                              {card.title}
                            </span>
                            <span className="text-sm shrink-0 select-none">{card.emoji}</span>
                          </div>
                          <div className="flex-1 flex items-center justify-center py-1 opacity-95 group-hover:scale-105 transition select-none">
                            <span className="text-4xl filter drop-shadow">{card.emoji}</span>
                          </div>
                          <span className="text-[9px] text-black font-semibold block leading-tight h-10 select-none line-clamp-3">
                            {card.description}
                          </span>
                          {isComboSelected && (
                            <div className="absolute top-1.5 right-1.5 bg-yellow-300 p-0.5 rounded border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                              <span className="text-[7.5px] text-black font-black px-0.5 block select-none leading-none">PAIR</span>
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </AnimatePresence>
                ) : (
                  <div className="w-full text-center py-6 text-xs text-slate-800 font-bold italic">
                    {players[0]?.isDead ? "💥 You are dead! Restart the matches above." : "Zero cards in hand! Select \"Draw Card\" to replenish your tactical cargo."}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR: Logs and Stats (1 col) */}
          <div className="xl:col-span-1 space-y-4 text-black">
            {/* Game Stats */}
            <div className="bg-white border-4 border-black p-4 rounded-xl flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="bg-yellow-300 px-2.5 py-1.5 rounded-lg text-center border-2 border-black w-full">
                <span className="text-[10px] text-black font-black uppercase block">ATTACKS</span>
                <span className="font-mono text-xs font-black text-black">{attackTurnsRemaining} Turns Remaining</span>
              </div>
            </div>

            {/* Active Live logs ticker */}
            <div className="bg-white border-4 border-black rounded-xl p-4 flex flex-col h-[220px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-sans font-black text-xs tracking-wider uppercase text-black mb-3 flex items-center gap-2">
                📢 BATTLE LOGS
              </h3>
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
                {logs.map((log) => (
                  <div 
                    key={log.id} 
                    className={`p-2 rounded border-2 border-black leading-tight shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                      log.isImportant 
                        ? "bg-red-200 border-black text-black font-bold" 
                        : "bg-slate-100 border-black text-black"
                    }`}
                  >
                    <span className="font-black text-red-700 block uppercase text-[9px] font-mono select-none">
                      {log.playerName}
                    </span>
                    <span className="font-mono text-[10px] text-black font-black">{log.action}:</span>{" "}
                    <span className="font-sans text-[11px] font-semibold">{log.detail}</span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </div>
            
            {/* Reset widget */}
            <button
              onClick={handleStartGame}
              className="w-full bg-red-500 hover:bg-red-600 border-4 border-black text-white py-3.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reshuffle & Restart Arena</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
