/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Bomb, BookOpen, Gamepad2, Sparkles } from "lucide-react";
import GamePlay from "./components/GamePlay";
import RulesCheatsheet from "./components/RulesCheatsheet";

type TabType = "PLAY" | "RULES";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("PLAY");

  return (
    <div className="min-h-screen bg-orange-500 text-black font-sans border-8 border-black flex flex-col">
      {/* HEADER SECTION */}
      <header className="bg-amber-400 border-b-4 border-black p-4 md:p-6 shadow-[0px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white border-4 border-black p-3 rounded-xl rotate-[-2deg] font-black text-2xl sm:text-3xl uppercase tracking-tighter shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black flex items-center gap-2">
              <Bomb className="w-8 h-8 text-red-600" />
              <span>Kitten Chaos</span>
            </div>
            <div className="hidden sm:flex gap-2">
              <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-black border-2 border-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Explosive Mode</span>
              <span className="bg-black text-white px-3 py-1 rounded-full text-xs font-black uppercase border-2 border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Classic Rules</span>
            </div>
          </div>

          {/* DYNAMIC TAB CONTROLS */}
          <nav className="flex bg-white p-1 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" id="nav-tabs">
            <button
              id="tab-play"
              onClick={() => setActiveTab("PLAY")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-display font-black uppercase tracking-wider transition ${
                activeTab === "PLAY"
                  ? "bg-yellow-400 text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-black"
                  : "text-black hover:bg-slate-100 font-bold"
              } cursor-pointer`}
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Play Arena</span>
            </button>
            <button
              id="tab-rules"
              onClick={() => setActiveTab("RULES")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-display font-black uppercase tracking-wider transition ${
                activeTab === "RULES"
                  ? "bg-yellow-400 text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-black"
                  : "text-black hover:bg-slate-100 font-bold"
              } cursor-pointer`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Rules Guide</span>
            </button>
          </nav>
        </div>
      </header>

      {/* CORE DISPLAY WINDOW */}
      <main className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {activeTab === "PLAY" && (
          <div className="space-y-6">
            {/* Banner info */}
            <div className="bg-yellow-300 border-2 border-black py-2 px-4 rounded-xl text-[10px] text-black font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="text-black shrink-0 w-3 h-3" />
                <span>
                  Tip: If you collect a Pair of matching Cat cards in your hand, you can active-press them to steal random cards from AI opponents!
                </span>
              </div>
            </div>

            <GamePlay />
          </div>
        )}

        {activeTab === "RULES" && (
          <div className="space-y-6">
            <RulesCheatsheet />
          </div>
        )}
      </main>

      {/* FOOTER BAR */}
      <footer className="bg-black text-white p-4 border-t-4 border-black text-center text-xs font-bold uppercase tracking-[0.2em]">
        <p>It is currently Your Turn — Play a card or draw to end turn</p>
      </footer>
    </div>
  );
}
