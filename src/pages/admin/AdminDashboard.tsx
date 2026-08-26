import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { FiAward, FiEdit2, FiX, FiCheck, FiPlus, FiTrash2 } from 'react-icons/fi';
import type { SonaEvent } from '../../types';
import { useSettings } from '../../hooks/useSettings';

export const AdminDashboard = () => {
  const [events, setEvents] = useState<SonaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<SonaEvent | null>(null);
  
  const { settings, updateVibes, updateGenres } = useSettings();
  const [newVibe, setNewVibe] = useState('');
  const [newGenre, setNewGenre] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SonaEvent[];
      setEvents(eventsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSaveSponsor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEvent) return;

    const formData = new FormData(e.currentTarget);
    const sponsorName = formData.get('sponsorName') as string;
    const sponsorImageUrl = formData.get('sponsorImageUrl') as string;
    const sponsorLink = formData.get('sponsorLink') as string;
    const sponsorMessage = formData.get('sponsorMessage') as string;
    const sponsorTier = parseInt(formData.get('sponsorTier') as string, 10) || 0;

    try {
      await updateDoc(doc(db, 'events', selectedEvent.id), {
        sponsorName,
        sponsorImageUrl,
        sponsorLink,
        sponsorMessage,
        sponsorTier,
      });
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error saving sponsor data:', error);
      alert('Error al guardar el patrocinio');
    }
  };

  const removeSponsor = async (eventId: string) => {
    if (!confirm('¿Estás seguro de eliminar el patrocinio de este evento?')) return;
    try {
      await updateDoc(doc(db, 'events', eventId), {
        sponsorName: null,
        sponsorImageUrl: null,
        sponsorLink: null,
        sponsorMessage: null,
        sponsorTier: 0,
      });
    } catch (error) {
      console.error('Error removing sponsor:', error);
    }
  };

  const handleAddVibe = async () => {
    if (!newVibe.trim()) return;
    const uppercaseVibe = newVibe.trim().toUpperCase();
    if (!settings.vibes.includes(uppercaseVibe)) {
      await updateVibes([...settings.vibes, uppercaseVibe]);
      setNewVibe('');
    }
  };

  const handleRemoveVibe = async (vibeToRemove: string) => {
    if (confirm(`¿Eliminar el género "${vibeToRemove}"?`)) {
      await updateVibes(settings.vibes.filter(v => v !== vibeToRemove));
    }
  };

  const handleAddGenre = async () => {
    if (!newGenre.trim()) return;
    const uppercaseGenre = newGenre.trim().toUpperCase();
    if (!settings.genres.includes(uppercaseGenre)) {
      await updateGenres([...settings.genres, uppercaseGenre]);
      setNewGenre('');
    }
  };

  const handleRemoveGenre = async (genreToRemove: string) => {
    if (confirm(`¿Eliminar el género "${genreToRemove}"?`)) {
      await updateGenres(settings.genres.filter(g => g !== genreToRemove));
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-light uppercase tracking-widest text-white mb-2">
          Gestión de <span className="font-bold text-red-400">Patrocinios</span>
        </h1>
        <p className="text-white/60">
          Inyecta publicidad en los eventos creados por los locales. Los niveles 1, 2 y 3 determinan el impacto visual.
        </p>
      </div>

      {/* Genres and Vibes Config */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Vibes Config */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden p-6">
          <h2 className="text-xl font-bold text-white mb-2">Ambientes de Evento (Vibes)</h2>
          <p className="text-white/50 text-xs mb-4">Opciones que los locales pueden asignar a sus eventos (ej: CENA, TARDEO).</p>
        <div className="flex gap-4 mb-6">
          <input 
            type="text" 
            value={newVibe}
            onChange={(e) => setNewVibe(e.target.value)}
            placeholder="Ej: ROCK, TECHNO..."
            className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-400 uppercase"
            onKeyDown={(e) => e.key === 'Enter' && handleAddVibe()}
          />
          <button 
            onClick={handleAddVibe}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl transition-colors font-bold flex items-center gap-2"
          >
            <FiPlus /> Añadir
          </button>
        </div>
        <div className="flex flex-wrap gap-3">
          {settings.vibes.map((vibe) => (
            <div key={vibe} className="flex items-center gap-2 bg-black border border-white/20 px-3 py-1.5 rounded-lg text-sm text-white/80">
              {vibe}
              <button 
                onClick={() => handleRemoveVibe(vibe)}
                className="text-red-400 hover:text-red-300 ml-1"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          </div>
        </div>

        {/* Genres Config */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden p-6">
          <h2 className="text-xl font-bold text-white mb-2">Géneros Musicales (Genres)</h2>
          <p className="text-white/50 text-xs mb-4">Estilos musicales que los músicos eligen en su EPK (ej: ROCK, INDIE).</p>
          <div className="flex gap-4 mb-6">
            <input 
              type="text" 
              value={newGenre}
              onChange={(e) => setNewGenre(e.target.value)}
              placeholder="Ej: JAZZ, METAL..."
              className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-400 uppercase"
              onKeyDown={(e) => e.key === 'Enter' && handleAddGenre()}
            />
            <button 
              onClick={handleAddGenre}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl transition-colors font-bold flex items-center gap-2"
            >
              <FiPlus /> Añadir
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {settings.genres.map((genre) => (
              <div key={genre} className="flex items-center gap-2 bg-black border border-white/20 px-3 py-1.5 rounded-lg text-sm text-white/80">
                {genre}
                <button 
                  onClick={() => handleRemoveGenre(genre)}
                  className="text-red-400 hover:text-red-300 ml-1"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-red-400"></div>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-white/80">
              <thead className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-widest text-white/40">
                <tr>
                  <th className="px-6 py-4">Evento</th>
                  <th className="px-6 py-4">Local</th>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Estado Patrocinio</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{event.title}</td>
                    <td className="px-6 py-4">{event.venueName || 'Desconocido'}</td>
                    <td className="px-6 py-4">
                      {event.date ? format(parseISO(event.date), "d MMM yyyy", { locale: es }) : 'Sin fecha'}
                    </td>
                    <td className="px-6 py-4">
                      {event.sponsorTier && event.sponsorTier > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-900/40 text-red-400 border border-red-500/20">
                          <FiAward className="w-3.5 h-3.5" />
                          Nivel {event.sponsorTier}: {event.sponsorName}
                        </span>
                      ) : (
                        <span className="text-white/30 text-xs uppercase tracking-wider">Sin Patrocinador</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSelectedEvent(event)}
                          className="p-2 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                          title="Gestionar Patrocinio"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        {event.sponsorTier && event.sponsorTier > 0 && (
                          <button
                            onClick={() => removeSponsor(event.id)}
                            className="p-2 text-red-400/60 hover:text-red-400 bg-red-900/10 hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Eliminar Patrocinador"
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Edición de Patrocinio */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Editar Patrocinador</h3>
                <p className="text-sm text-white/60 mt-1">Evento: {selectedEvent.title}</p>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-2 text-white/40 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveSponsor} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-white/60 font-bold">Nivel de Patrocinio (1-3)</label>
                <select 
                  name="sponsorTier" 
                  defaultValue={selectedEvent.sponsorTier || 0}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-400 transition-colors appearance-none"
                >
                  <option value={0}>0 - Sin Patrocinador</option>
                  <option value={1}>1 - Básico (Mención discreta)</option>
                  <option value={2}>2 - Estándar (Banner pequeño)</option>
                  <option value={3}>3 - Premium (Marca de agua y banner gigante)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-white/60 font-bold">Nombre del Patrocinador</label>
                <input 
                  type="text" 
                  name="sponsorName" 
                  defaultValue={selectedEvent.sponsorName || ''}
                  placeholder="Ej: Estrella Damm"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-400 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-white/60 font-bold">URL del Logo (Opcional)</label>
                <input 
                  type="url" 
                  name="sponsorImageUrl" 
                  defaultValue={selectedEvent.sponsorImageUrl || ''}
                  placeholder="https://ejemplo.com/logo.png"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-400 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-white/60 font-bold">Enlace Web (Opcional)</label>
                <input 
                  type="url" 
                  name="sponsorLink" 
                  defaultValue={selectedEvent.sponsorLink || ''}
                  placeholder="https://estrelladamm.com"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-400 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-white/60 font-bold">Mensaje (Opcional)</label>
                <input 
                  type="text" 
                  name="sponsorMessage" 
                  defaultValue={selectedEvent.sponsorMessage || ''}
                  placeholder="Patrocinador Oficial"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-400 transition-colors"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="px-6 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-colors font-bold uppercase tracking-widest text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors font-bold uppercase tracking-widest text-xs flex items-center gap-2"
                >
                  <FiCheck className="w-4 h-4" />
                  Guardar Patrocinio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
