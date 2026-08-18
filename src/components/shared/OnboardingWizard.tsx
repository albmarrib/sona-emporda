import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ChevronRight, MapPin, User, FileText, Link as LinkIcon, Users } from 'lucide-react';

interface WizardStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  fields: {
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'number' | 'url';
    placeholder: string;
  }[];
}

export const OnboardingWizard = ({ onComplete }: { onComplete: () => void }) => {
  const { currentUser, userRole } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  // Pasos para músico
  const musicianSteps: WizardStep[] = [
    {
      title: 'Tu Identidad Musical',
      description: 'Empecemos por lo básico. ¿Cómo te conoce el mundo?',
      icon: <User className="w-8 h-8 text-gold" />,
      fields: [
        { name: 'stageName', label: 'Nombre Artístico / Banda', type: 'text', placeholder: 'Ej. The Rockers' },
        { name: 'mainGenre', label: 'Género Principal', type: 'text', placeholder: 'Ej. Indie, Rock, Acústico' }
      ]
    },
    {
      title: 'Tu Estilo y Biografía',
      description: 'Cuéntanos un poco sobre ti para que los locales sepan qué esperar.',
      icon: <FileText className="w-8 h-8 text-gold" />,
      fields: [
        { name: 'shortBio', label: 'Biografía Corta', type: 'textarea', placeholder: 'Escribe 2-3 líneas sobre tu proyecto...' },
        { name: 'contactPhone', label: 'Teléfono de Contacto', type: 'text', placeholder: '+34 600 000 000' }
      ]
    },
    {
      title: 'Enlaces y Material',
      description: 'Conecta tus redes para que puedan escuchar tu música.',
      icon: <LinkIcon className="w-8 h-8 text-gold" />,
      fields: [
        { name: 'spotifyUrl', label: 'Enlace de Spotify', type: 'url', placeholder: 'https://open.spotify.com/artist/...' }
      ]
    }
  ];

  // Pasos para local
  const venueSteps: WizardStep[] = [
    {
      title: 'Información del Local',
      description: 'Datos básicos de tu establecimiento para que los músicos te encuentren.',
      icon: <MapPin className="w-8 h-8 text-gold" />,
      fields: [
        { name: 'name', label: 'Nombre del Local', type: 'text', placeholder: 'Ej. Sala La Mirona' },
        { name: 'address', label: 'Dirección Física Completa', type: 'text', placeholder: 'Ej. Carrer Major 12, Salt' }
      ]
    },
    {
      title: 'Detalles de Contacto',
      description: 'Información para que los músicos puedan comunicarse contigo.',
      icon: <Users className="w-8 h-8 text-gold" />,
      fields: [
        { name: 'contactPhone', label: 'WhatsApp / Teléfono de Contacto', type: 'text', placeholder: '+34 600 000 000' }
      ]
    }
  ];

  const steps = userRole === 'venue' ? venueSteps : musicianSteps;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    try {
      if (userRole === 'venue') {
        // Los locales guardan su perfil directamente en la colección 'users'
        await setDoc(doc(db, 'users', currentUser.uid), {
          ...formData,
          onboardingCompleted: true,
          updatedAt: new Date()
        }, { merge: true });
      } else {
        // Los músicos guardan en 'musicians'
        await setDoc(doc(db, 'musicians', currentUser.uid), {
          ...formData,
          updatedAt: new Date()
        }, { merge: true });

        // Y marcamos el onboarding en 'users'
        await setDoc(doc(db, 'users', currentUser.uid), {
          onboardingCompleted: true
        }, { merge: true });
      }

      onComplete();
    } catch (error) {
      console.error("Error saving onboarding data:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Progress Bar */}
        <div className="w-full bg-black/50 h-1.5 flex">
          {steps.map((_, idx) => (
            <div 
              key={idx} 
              className={`flex-1 h-full transition-colors duration-500 ${idx <= currentStep ? 'bg-gold' : 'bg-white/10'}`} 
            />
          ))}
        </div>

        <div className="p-6 md:p-10 flex-1 overflow-y-auto">
          {/* Header del paso */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-black border border-gold/30 mb-4 shadow-[0_0_20px_rgba(197,160,89,0.1)]">
              {step.icon}
            </div>
            <h2 className="text-2xl md:text-3xl font-serif text-white mb-2">{step.title}</h2>
            <p className="text-white/50 text-sm">{step.description}</p>
          </div>

          {/* Formulario */}
          <div className="space-y-6 max-w-md mx-auto">
            {step.fields.map((field) => (
              <div key={field.name}>
                <label className="block text-xs uppercase tracking-widest text-gold mb-2">
                  {field.label}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    name={field.name}
                    value={formData[field.name] || ''}
                    onChange={handleInputChange}
                    placeholder={field.placeholder}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white placeholder-white/20 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all min-h-[100px]"
                  />
                ) : (
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name] || ''}
                    onChange={handleInputChange}
                    placeholder={field.placeholder}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white placeholder-white/20 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-[10px] uppercase tracking-widest text-white/30">
              No te preocupes, puedes dejar campos en blanco y modificar esta información en cualquier momento desde tu perfil.
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 md:p-6 bg-black/50 border-t border-white/10 flex justify-between items-center">
          <button 
            onClick={handleFinish}
            className="text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors"
          >
            Saltar todo
          </button>
          
          <button
            onClick={handleNext}
            disabled={isSaving}
            className="flex items-center gap-2 bg-gold text-black px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-yellow-500 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Guardando...' : currentStep === steps.length - 1 ? 'Finalizar' : 'Siguiente Paso'}
            {!isSaving && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

      </div>
    </div>
  );
};
