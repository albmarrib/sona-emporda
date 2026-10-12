export interface LandingDesign {
  theme: 'dark' | 'light';
  typography: 'sans-serif' | 'serif' | 'mono';
  layout?: 'vertical' | 'horizontal'; // 'vertical' (tradicional) o 'horizontal' (editorial en columnas continuas)
}

export interface LandingImages {
  heroBackgroundUrl: string;
  liveBackgroundUrl: string;
  musicBackgroundUrl: string;
  contactBackgroundUrl: string;
  heroOverlayOpacity?: number; // 0 to 100 (percentage of dark/light overlay, default 30)
  liveOverlayOpacity?: number; // 0 to 100 (default 50)
  musicOverlayOpacity?: number; // 0 to 100 (default 65)
  contactOverlayOpacity?: number; // 0 to 100 (default 50)
}

export interface LandingHero {
  title: string;
  subtitle: string;
  biography: string;
  ctaText: string;
  ctaTarget: string;
}

export interface LandingModules {
  showLiveDates: boolean;
  showSpotify: boolean;
  spotifyEmbedUrl: string;
  showYoutube: boolean;
  youtubeVideoId: string; // Keep for backwards compatibility
  youtubeVideoIds: string[];
  showInstagram: boolean;
  instagramUsername: string;
  showBookingWidget: boolean;
}

export interface LandingConfig {
  isActive: boolean;
  subdomain: string;
  design: LandingDesign;
  images: LandingImages;
  hero: LandingHero;
  modules: LandingModules;
}
