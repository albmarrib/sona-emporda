import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ChevronRight, MapPin, User, FileText, Link as LinkIcon, Users, Camera } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase/firebase';

interface WizardStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  fields: {
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'number' | 'url' | 'select' | 'image';
    placeholder?: string;
    options?: string[];
  }[];
}

export const OnboardingWizard = ({ onComplete }: { onComplete: () => void }) => {
  const { currentUser, userRole, userData } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({
    ...userData,
    address: userData?.address || userData?.location || ''
  });

  React.useEffect(() => {
    if (userData) {
      setFormData((prev: any) => ({
        ...prev,
        ...userData,
        address: userData.address || userData.location || prev.address || ''
      }));
    }
  }, [userData]);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { settings } = useSettings();

  // Pasos para músico
  const musicianSteps: WizardStep[] = [
    {
      title: 'Tu Identidad Musical',
      description: 'Empecemos por lo básico. ¿Cómo te conoce el mundo?',
      icon: <User className="w-8 h-8 text-gold" />,
      fields: [
        { name: 'profileImageUrl', label: 'Foto de Perfil', type: 'image' },
        { name: 'stageName', label: 'Nombre Artístico / Banda', type: 'text', placeholder: 'Ej. The Rockers' },
        { name: 'mainGenre', label: 'Género Principal', type: 'select', options: settings.genres || ['Indie', 'Rock', 'Acústico'] },
        { name: 'formationType', label: 'Tipo de Formación', type: 'select', options: ['solo', 'duo', 'band'] },
        { name: 'membersCount', label: 'Número de Miembros', type: 'number', placeholder: 'Ej. 4' },
        { name: 'membersNames', label: 'Nombres de los Miembros', type: 'text', placeholder: 'Ej. Laura (Voz), Marc...' }
      ]
    },
    {
      title: 'Sobre Ti y Booking',
      description: 'Cuéntanos un poco sobre ti y cómo localizarte.',
      icon: <FileText className="w-8 h-8 text-gold" />,
      fields: [
        { name: 'baseLocation', label: 'Población Base', type: 'text', placeholder: 'Ej: Figueres, Girona...' },
        { name: 'shortBio', label: 'Biografía Corta', type: 'textarea', placeholder: 'Escribe 2-3 líneas sobre tu proyecto...' },
        { name: 'contactPhone', label: 'Teléfono Móvil', type: 'text', placeholder: '+34 600 000 000' },
        { name: 'contactWhatsapp', label: 'WhatsApp Business / Móvil', type: 'text', placeholder: '+34 600 000 000' },
        { name: 'contactEmail', label: 'Email de Contacto (Opcional)', type: 'text', placeholder: 'tu@email.com' }
      ]
    },
    {
      title: 'Enlaces y Redes',
      description: 'Conecta tus redes para que puedan escuchar tu música.',
      icon: <LinkIcon className="w-8 h-8 text-gold" />,
      fields: [
        { name: 'spotifyUrl', label: 'Enlace a Spotify (Artist Page)', type: 'url', placeholder: 'https://open.spotify.com/artist/...' },
        { name: 'youtubeUrl', label: 'Video Destacado (YouTube)', type: 'url', placeholder: 'https://youtube.com/watch?v=...' },
        { name: 'instagramUrl', label: 'Instagram (Opcional)', type: 'url', placeholder: 'https://instagram.com/tu_perfil' },
        { name: 'websiteUrl', label: 'Página Web (Opcional)', type: 'url', placeholder: 'https://tuweb.com' }
      ]
    },
    {
      title: 'Datos Técnicos y Chat',
      description: 'Detalles extra para cuando actúes y te pongas en contacto.',
      icon: <FileText className="w-8 h-8 text-gold" />,
      fields: [
        { name: 'technicalRider', label: 'Technical Rider / Necesidades Técnicas', type: 'textarea', placeholder: 'Ej: Llevamos mesa propia, necesitamos 2 tomas...' },
        { name: 'customApplyMessage', label: 'Plantilla de Mensaje para Contacto (Chat)', type: 'textarea', placeholder: 'Ej: Hola, me gustaría poder actuar en su local...' }
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
        { name: 'name', label: 'Nombre del Establecimiento', type: 'text', placeholder: 'Ej. Sala La Mirona' },
        { name: 'email', label: 'Email Público', type: 'text', placeholder: 'Ej: contacto@salasoho.com' },
        { name: 'address', label: 'Dirección Física Completa', type: 'text', placeholder: 'Ej. Carrer Major 12, Salt' }
      ]
    },
    {
      title: 'Contacto y Redes',
      description: 'Información para que los músicos y el público te contacten.',
      icon: <Users className="w-8 h-8 text-gold" />,
      fields: [
        { name: 'contactPhone', label: 'Teléfono Fijo o Contacto', type: 'text', placeholder: '+34 900 000 000' },
        { name: 'contactWhatsapp', label: 'WhatsApp Business / Móvil (Opcional)', type: 'text', placeholder: '+34 600 000 000' },
        { name: 'websiteUrl', label: 'Página Web (Opcional)', type: 'url', placeholder: 'https://tulocal.com' },
        { name: 'instagramUrl', label: 'Instagram (Opcional)', type: 'url', placeholder: 'https://instagram.com/tu_local' }
      ]
    },
    {
      title: 'Configuración de Chat',
      description: 'Mensajes por defecto para invitar a músicos.',
      icon: <FileText className="w-8 h-8 text-gold" />,
      fields: [
        { name: 'customInviteMessage', label: 'Plantilla de Invitación (Chat)', type: 'textarea', placeholder: 'Ej: Hola, nos gustaría que actuaras en nuestro local...' }
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
      // Ahora TANTO locales como músicos guardan todos sus datos en la colección unificada 'users'
      // Mapeamos genre -> mainGenre para músicos por coherencia
      const updateData = { ...formData };
      if (updateData.mainGenre) {
        updateData.genre = updateData.mainGenre;
      }
      
      await setDoc(doc(db, 'users', currentUser.uid), {
        ...updateData,
        onboardingCompleted: true,
        updatedAt: new Date()
      }, { merge: true });

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
            <h1 className="text-xs uppercase tracking-widest text-gold mb-4 border border-gold/30 rounded-full inline-block px-3 py-1 bg-gold/10">Configuración Inicial Guiada</h1>
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
                ) : field.type === 'select' ? (
                  <select
                    name={field.name}
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all"
                  >
                    <option value="" disabled>Selecciona una opción...</option>
                    {field.options?.map(opt => (
                      <option key={opt} value={opt} className="bg-zinc-900">{opt}</option>
                    ))}
                  </select>
                ) : field.type === 'image' ? (
                  <div className="flex flex-col gap-4">
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !currentUser) return;
                        setUploadingImage(true);
                        try {
                          const imageRef = ref(storage, `users/${currentUser.uid}/profile_${Date.now()}`);
                          await uploadBytes(imageRef, file);
                          const url = await getDownloadURL(imageRef);
                          setFormData({...formData, [field.name]: url});
                        } catch (error) {
                          console.error("Error uploading image:", error);
                        } finally {
                          setUploadingImage(false);
                        }
                      }}
                      className="hidden" 
                      accept="image/*"
                    />
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-24 h-24 rounded-full border-2 border-dashed border-white/20 hover:border-gold cursor-pointer flex flex-col items-center justify-center overflow-hidden bg-black/50 mx-auto transition-colors group relative"
                    >
                      {formData[field.name] ? (
                        <>
                          <img src={formData[field.name]} alt="Perfil" className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="w-6 h-6 text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-2">
                          <Camera className="w-6 h-6 text-white/40 mx-auto mb-1 group-hover:text-gold transition-colors" />
                          <p className="text-[8px] uppercase tracking-widest text-white/40 group-hover:text-gold transition-colors">
                            {uploadingImage ? 'Subiendo...' : 'Subir Foto'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
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

          <div className="mt-8 text-center p-4 bg-white/5 border border-white/10 rounded-lg">
            <p className="text-[10px] uppercase tracking-widest text-white/60 leading-relaxed font-bold">
              Todos los campos son opcionales
            </p>
            <p className="text-[9px] uppercase tracking-widest text-white/40 leading-relaxed mt-2">
              Recuerda que siempre podrás acudir a la sección {userRole === 'venue' ? 'Configuración' : 'EPK'} de tu panel en cualquier momento para rellenar o editar lo que desees más tarde.
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
