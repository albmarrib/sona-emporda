export interface LandingDesign {
  theme: 'dark' | 'light';
  typography: 'sans-serif' | 'serif' | 'mono';
}

export interface LandingImages {
  heroBackgroundUrl: string;
  liveBackgroundUrl: string;
  musicBackgroundUrl: string;
  contactBackgroundUrl: string;
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
