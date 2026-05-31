import { CardType } from "../types";
import { CARD_TEMPLATES } from "../cards";

interface RulesCheatsheetProps {
  className?: string;
}

export default function RulesCheatsheet({ className = "" }: RulesCheatsheetProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Target core objective */}
      <div className="bg-white border-4 border-black p-5 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black">
        <h3 className="font-sans text-xl font-black text-red-600 mb-2 flex items-center gap-2 uppercase tracking-tight">
          💥 The Core Objective
        </h3>
        <p className="text-slate-800 text-sm leading-relaxed font-bold">
          The deck contains several **Exploding Kittens**. You must play cards from your hand to skip, attack, search, or shuffle the deck to avoid drawing them. 
          If you draw an Exploding Kitten, you must play a **Defuse** card immediately to stay alive. If you cannot defuse it, you explode and are out of the game! 
          The last player standing wins.
        </p>
      </div>

      <div className="bg-white border-4 border-black p-5 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black">
        <h3 className="font-sans text-xl font-black text-black mb-4 uppercase tracking-tight">
          🎴 Card Guide & Effects
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(CARD_TEMPLATES).map(([type, card]) => {
            if (type === CardType.EXPLODING_KITTEN) return null;
            return (
              <div 
                key={type} 
                className="bg-slate-50 border-2 border-black p-3 rounded-lg flex gap-3 items-start text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <div className="text-2xl p-2 bg-yellow-300 border border-black rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] shrink-0 select-none">
                  {card.emoji}
                </div>
                <div>
                  <h4 className="font-sans font-black text-sm text-black uppercase tracking-tight">{card.title}</h4>
                  <p className="text-xs text-slate-700 font-bold mt-1">{card.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white border-4 border-black p-5 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black">
        <h3 className="font-sans text-xl font-black text-black mb-3 uppercase tracking-tight">
          🔥 Crucial Rule Intersections
        </h3>
        <ul className="space-y-3 text-sm text-slate-800 font-bold">
          <li className="flex gap-2 items-start">
            <span className="text-emerald-700 font-black bg-emerald-200 border border-black px-1.5 rounded text-xs select-none">✓</span>
            <div>
              <strong>Defusing & Secret Insertion:</strong> When you play a Defuse, the Exploding Kitten is placed **back into the deck privately**. You choose the exact position—leave it on top to explode the next player, put it on the bottom, or insert it randomly!
            </div>
          </li>
          <li className="flex gap-2 items-start">
            <span className="text-red-700 font-black bg-red-200 border border-black px-1.5 rounded text-xs select-none">✗</span>
            <div>
              <strong>Nope Restrictions:</strong> You **cannot** play a Nope card on an Exploding Kitten or a Defuse card. Those events must transpire! You can Nope skips, shuffles, attacks, and favors.
            </div>
          </li>
          <li className="flex gap-2 items-start">
            <span className="text-blue-700 font-black bg-blue-200 border border-black px-1.5 rounded text-xs select-none">✓</span>
            <div>
              <strong>Stacked Attacks:</strong> If you are targeted by an Attack card (2 turns) and you play another Attack card, the target shifts to the next player, who must now take **all** stacked turns (2 + 2 = 4 turns!).
            </div>
          </li>
          <li className="flex gap-2 items-start">
            <span className="text-purple-700 font-black bg-purple-200 border border-black px-1.5 rounded text-xs select-none">✓</span>
            <div>
              <strong>Special 2-of-a-Kind Combo:</strong> Play any two cards with matching titles (like two Tacocats or even two Skips!) to steal a random card from another player of your choice.
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}
