export const LoadingScreen = () => {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-black overflow-hidden relative">
      {/* CSS Gold Record */}
      <div className="absolute w-[300px] h-[300px] md:w-[400px] md:h-[400px] rounded-full border border-gold/20 flex items-center justify-center animate-spin-slow opacity-30 shadow-[0_0_60px_rgba(197,160,89,0.15)]">
        <div className="w-[90%] h-[90%] rounded-full border border-gold/10 flex items-center justify-center">
          <div className="w-[80%] h-[80%] rounded-full border border-gold/5 flex items-center justify-center">
            {/* Record grooves */}
            {[...Array(6)].map((_, i) => (
              <div key={i} className="absolute rounded-full border border-white/5" style={{ width: `${90 - i * 10}%`, height: `${90 - i * 10}%` }}></div>
            ))}
            {/* Center label */}
            <div className="w-1/3 h-1/3 bg-gold/20 rounded-full flex items-center justify-center backdrop-blur-sm z-10 border border-gold/40 shadow-[0_0_15px_rgba(197,160,89,0.5)]">
               <div className="w-3 h-3 bg-black rounded-full shadow-inner"></div>
            </div>
          </div>
        </div>
        {/* Reflection */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent rounded-full pointer-events-none transform -rotate-45"></div>
      </div>

      {/* Floating Text */}
      <div className="z-10 text-center flex flex-col items-center gap-2">
        <div className="text-gold font-serif text-3xl md:text-5xl tracking-widest animate-pulse drop-shadow-[0_0_15px_rgba(197,160,89,0.5)]">
          SONA<span className="font-light">Empordà</span>
        </div>
        <div className="text-white/40 text-[10px] uppercase tracking-[0.4em] mt-2">
          Cargando
        </div>
      </div>
    </div>
  );
};
