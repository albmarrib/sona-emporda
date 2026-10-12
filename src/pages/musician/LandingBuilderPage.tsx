import { LandingPageBuilder } from '../../components/musician/LandingPageBuilder';

export const LandingBuilderPage = () => {
  return (
    <div className="flex flex-col h-full space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif text-gold">Constructor de Landing Page</h1>
          <p className="text-white/60 text-xs sm:text-sm mt-0.5">
            Configura y diseña tu página web pública.
          </p>
        </div>
      </div>

      <div className="flex-1 bg-white/5 border border-white/10 p-3 sm:p-6 overflow-hidden">
        <LandingPageBuilder />
      </div>
    </div>
  );
};
