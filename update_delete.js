import fs from 'fs';

let content = fs.readFileSync('src/pages/venue/EventManager.tsx', 'utf8');

// 1. Add state for eventToDelete
content = content.replace(
  "const [editingEventId, setEditingEventId] = useState<string | null>(null);",
  "const [editingEventId, setEditingEventId] = useState<string | null>(null);\n  const [eventToDelete, setEventToDelete] = useState<string | null>(null);"
);

// 2. Update handleDeleteEvent to actually delete
const newDelete = `
  const handleDeleteEvent = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'events', id));
      setEventToDelete(null);
    } catch (e) {
      console.error(e);
      alert("Error al borrar el evento");
    }
  };
`;
content = content.replace(/const handleDeleteEvent = async \(id: string\) => \{[\s\S]*?\}\n  \};/, newDelete);

// 3. Update button click
content = content.replace(
  /onClick=\{\(\) => handleDeleteEvent\(event.id\)\}/g,
  "onClick={() => setEventToDelete(event.id)}"
);

// 4. Add the delete modal before the final closing div
const modalHtml = `
      {/* Modal Confirmar Borrado */}
      {eventToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-black border border-white/10 p-6 md:p-8 max-w-sm w-full flex flex-col gap-6 shadow-2xl">
              <div>
                <h2 className="text-xl font-serif text-white mb-2 text-center">¿Cancelar Evento?</h2>
                <p className="text-white/50 text-xs uppercase tracking-widest text-center">
                  Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="flex gap-4 mt-2">
                <button onClick={() => setEventToDelete(null)} className="flex-1 border border-white/20 text-white/50 hover:text-white py-4 text-[10px] uppercase tracking-widest font-bold transition-colors">
                  Atrás
                </button>
                <button onClick={() => handleDeleteEvent(eventToDelete)} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-4 text-[10px] uppercase tracking-widest font-bold transition-colors">
                  Sí, Cancelar
                </button>
              </div>
           </div>
        </div>
      )}

    </div>
`;
content = content.replace("    </div>\n  );\n};\n", modalHtml + "  );\n};\n");

fs.writeFileSync('src/pages/venue/EventManager.tsx', content);
