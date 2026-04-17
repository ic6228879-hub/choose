/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import { Play, RotateCcw, Trophy, X, Settings2, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// --- Constants & Types ---
const COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8",
  "#F7DC6F", "#BB8FCE", "#82E0AA", "#F1948A", "#85C1E9",
  "#F5B041", "#58D68D", "#A569BD", "#EC7063", "#5DADE2"
];

const FRICTION = 0.992; // Friction factor (closer to 1 = longer spin)
const MIN_VELOCITY = 0.001;
const INITIAL_VELO_BASE = 0.3;
const INITIAL_VELO_RANDOM = 0.2;

export default function App() {
  const [items, setItems] = useState<string[]>(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);
  const [inputValue, setInputValue] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(null);
  const angleRef = useRef(0);
  const velocityRef = useRef(0);

  // --- Wheel Logic ---

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    ctx.clearRect(0, 0, width, height);

    const step = (Math.PI * 2) / items.length;
    const currentAngle = angleRef.current;

    items.forEach((item, i) => {
      const startAngle = currentAngle + i * step;
      const endAngle = startAngle + step;

      // Draw segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + step / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${Math.max(12, 24 - items.length)}px Inter, sans-serif`;
      ctx.shadowColor = "rgba(0,0,0,0.3)";
      ctx.shadowBlur = 4;
      ctx.fillText(item, radius - 30, 10);
      ctx.restore();
    });

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.shadowBlur = 10;
    ctx.shadowColor = "rgba(0,0,0,0.2)";
    ctx.stroke();

    // Draw indicator (Static Arrow at top)
    // The canvas is stationary, so we draw it separately or just have a DOM element
  }, [items]);

  const animate = useCallback(() => {
    if (velocityRef.current > MIN_VELOCITY) {
      angleRef.current += velocityRef.current;
      velocityRef.current *= FRICTION;
      drawWheel();
      requestRef.current = requestAnimationFrame(animate);
    } else {
      // Spinning finished
      setIsSpinning(false);
      velocityRef.current = 0;
      
      // Calculate winner
      // The arrow is at the top (angle - Math.PI / 2)
      // We need to find which segment is at the top position.
      // Top is 3/2 * PI (or -1/2 * PI)
      const step = (Math.PI * 2) / items.length;
      // Normalize angle to [0, 2PI]
      const normalizedAngle = ((angleRef.current % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);
      
      // The segments are drawn starting from currentAngle.
      // Segment i starts at currentAngle + i*step.
      // The point at the very top (12 o'clock) is 3*PI/2 (or -PI/2).
      // Let's find index i such that currentAngle + i*step <= -PI/2 <= currentAngle + (i+1)*step (roughly)
      // Actually simpler: solve for i in: (3*PI/2 - currentAngle) mod 2PI
      const targetPos = (Math.PI * 1.5 - angleRef.current) % (Math.PI * 2);
      const index = Math.floor((((targetPos % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2)) / step);
      
      const winnerItem = items[index];
      setWinner(winnerItem);
      
      // Confetti!
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [items, drawWheel]);

  const spin = () => {
    if (isSpinning || items.length === 0) return;
    
    setWinner(null);
    setIsSpinning(true);
    
    // Set initial velocity
    velocityRef.current = INITIAL_VELO_BASE + Math.random() * INITIAL_VELO_RANDOM;
    
    // Start animation
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    requestRef.current = requestAnimationFrame(animate);
  };

  const handleUpdateItems = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const newItems = inputValue.split(/[簡,，\n]+/).map(i => i.trim()).filter(i => i !== "");
    if (newItems.length > 0) {
      setItems(newItems);
      setInputValue("");
      setShowConfig(false);
    }
  };

  const resetItems = () => {
    setItems(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);
    angleRef.current = 0;
    velocityRef.current = 0;
  };

  useEffect(() => {
    drawWheel();
  }, [drawWheel]);

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-[#1C1E21] font-sans selection:bg-rose-100 flex flex-col items-center justify-center p-4 md:p-8">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute top-10 left-10 w-64 h-64 bg-rose-200 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-200 rounded-full blur-3xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 w-full max-w-2xl bg-white/80 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl overflow-hidden p-6 md:p-10"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">
              幸運大轉盤
            </h1>
            <p className="text-sm font-medium text-gray-400 mt-1">LUCKY SPINNER WHEEL</p>
          </div>
          <button 
            onClick={() => setShowConfig(!showConfig)}
            className="p-3 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Settings2 className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* List Config (Collapse) */}
        <AnimatePresence>
          {showConfig && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <form onSubmit={handleUpdateItems} className="space-y-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-700 uppercase tracking-widest">名單設定</span>
                  <button type="button" onClick={resetItems} className="text-xs text-rose-500 hover:underline flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" /> 重設預設值
                  </button>
                </div>
                <div className="relative">
                  <textarea 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="輸入號碼或人名，使用逗號或換行區隔..."
                    className="w-full h-32 p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-200 outline-none transition-all text-sm resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    type="submit"
                    className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition-transform active:scale-95"
                  >
                    更新名單
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setItems([]); setShowConfig(false); }}
                    className="px-4 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Spinner Area */}
        <div className="relative flex flex-col items-center">
          {/* Indicator Arrow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
            <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-rose-600 drop-shadow-lg" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full scale-50" />
          </div>

          {/* Canvas Container */}
          <div className="relative p-4 rounded-full bg-white shadow-inner border-[12px] border-gray-900 overflow-hidden ring-8 ring-gray-100">
            <canvas 
              ref={canvasRef}
              width={500}
              height={500}
              className="w-full max-w-[400px] h-auto drop-shadow-xl"
            />
          </div>

          {/* Spin Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={isSpinning || items.length === 0}
            onClick={spin}
            className={`mt-10 group relative flex items-center gap-3 px-12 py-5 rounded-full font-black text-xl tracking-tighter shadow-xl transition-all
              ${(isSpinning || items.length === 0) 
                ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                : "bg-gray-900 text-white hover:bg-black active:shadow-inner"
              }`}
          >
            {isSpinning ? (
              <RotateCcw className="w-6 h-6 animate-spin" />
            ) : (
              <Play className="w-6 h-6 fill-current" />
            )}
            {isSpinning ? "旋轉中..." : "開始抽籤"}
            
            {!isSpinning && items.length > 0 && (
              <div className="absolute inset-0 rounded-full border-2 border-rose-500 animate-ping opacity-20 pointer-events-none" />
            )}
          </motion.button>
        </div>

        {/* Item Counter */}
        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-center gap-4 flex-wrap">
          {items.slice(0, 10).map((item, idx) => (
            <span key={idx} className="px-3 py-1 bg-gray-50 text-[11px] font-bold text-gray-500 rounded-full border border-gray-100">
              {item}
            </span>
          ))}
          {items.length > 10 && (
            <span className="px-3 py-1 bg-gray-50 text-[11px] font-bold text-gray-400 rounded-full border border-gray-100 italic">
              + {items.length - 10} more
            </span>
          )}
        </div>
      </motion.div>

      {/* Winner Modal */}
      <AnimatePresence>
        {winner && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.5, y: 50, rotate: -5 }}
              animate={{ scale: 1, y: 0, rotate: 0 }}
              exit={{ scale: 1.1, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl p-10 overflow-hidden text-center"
            >
              {/* Modal Decor */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-500 via-orange-500 to-yellow-500" />
              <button 
                onClick={() => setWinner(null)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>

              <div className="mb-6 flex justify-center">
                <div className="p-5 bg-yellow-50 rounded-full">
                  <Trophy className="w-12 h-12 text-yellow-500" />
                </div>
              </div>

              <h2 className="text-lg font-bold text-gray-400 tracking-widest uppercase mb-1">恭喜中獎！</h2>
              <div className="relative inline-block mb-10">
                <h3 className="text-7xl font-black text-gray-900 relative z-10 px-4">
                  {winner}
                </h3>
                <div className="absolute -bottom-2 -left-2 -right-2 h-6 bg-yellow-200 -z-0 opacity-60 rounded-full" />
              </div>

              <button 
                onClick={() => setWinner(null)}
                className="w-full bg-gray-900 text-white py-5 rounded-[20px] font-black text-lg hover:bg-black transition-all active:scale-95 shadow-xl shadow-gray-200"
              >
                再抽一次
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer info */}
      <p className="mt-8 text-xs font-mono text-gray-400 opacity-50 uppercase tracking-[0.2em]">
        Physics based rotation • Easing out • Interactive Canvas
      </p>
    </div>
  );
}
