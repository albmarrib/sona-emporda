const fs = require('fs');
const file = './src/components/shared/EPKModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Imports
content = content.replace(
  "import { FiX, FiStar, FiCalendar, FiCheckCircle, FiMessageSquare } from 'react-icons/fi';",
  "import { FiX, FiStar, FiCalendar, FiCheckCircle, FiMessageSquare, FiPhone, FiMail, FiGlobe, FiInstagram } from 'react-icons/fi';"
);

// 2. New Contact Block
const oldContactStart = '<div>\n            <h3 className="text-[10px] uppercase tracking-widest text-white/50 mb-3">CONTACTO DIRECTO</h3>';
const oldContactEnd = '</div>\n          </div>';
const newContactBlock = `<div>
            <h3 className="text-[10px] uppercase tracking-widest text-white/50 mb-3">CONTACTO DIRECTO</h3>
            <div className="flex flex-col gap-3">
              <button
                onClick={async () => {
                  try {
                    const chatId = await findOrCreateChat(artist.id);
                    onClose();
                    navigate('/venue/messages', { state: { chatId } });
                  } catch (e) {
                    console.error(e);
                    alert('Error al abrir el chat.');
                  }
                }}
                className="w-full bg-gold/20 text-gold border border-gold/50 hover:bg-gold hover:text-black transition-colors px-4 py-4 flex items-center justify-center gap-2 text-[12px] uppercase tracking-widest font-bold"
              >
                <FiMessageSquare className="w-5 h-5" /> Chat Interno
              </button>
              
              <div className="flex justify-center gap-4">
                {artist.contactWhatsapp && (
                  <a href={\`https://wa.me/\${artist.contactWhatsapp.replace(/\\+/g, '').replace(/\\s/g, '')}\`} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/50 hover:bg-[#25D366] hover:text-white transition-colors flex items-center justify-center" title="WhatsApp">
                    <FaWhatsapp className="w-5 h-5" />
                  </a>
                )}
                {artist.contactPhone && (
                  <a href={\`tel:\${artist.contactPhone.replace(/\\s/g, '')}\`} className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500 hover:text-white transition-colors flex items-center justify-center" title="Llamar">
                    <FiPhone className="w-5 h-5" />
                  </a>
                )}
                {artist.contactEmail && (
                  <a href={\`mailto:\${artist.contactEmail}\`} className="w-12 h-12 rounded-full bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors flex items-center justify-center" title="Email">
                    <FiMail className="w-5 h-5" />
                  </a>
                )}
                {artist.websiteUrl && (
                  <a href={artist.websiteUrl} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors flex items-center justify-center" title="Web">
                    <FiGlobe className="w-5 h-5" />
                  </a>
                )}
                {artist.instagramUrl && (
                  <a href={artist.instagramUrl} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-[#E1306C]/20 text-[#E1306C] border border-[#E1306C]/50 hover:bg-[#E1306C] hover:text-white transition-colors flex items-center justify-center" title="Instagram">
                    <FiInstagram className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
          </div>`;

// Replace Contact Block
const contactStartIndex = content.indexOf(oldContactStart);
const actionBlockStartIndex = content.indexOf('<div className="mt-4 border-t border-white/10 pt-6">');
if (contactStartIndex > -1 && actionBlockStartIndex > -1) {
    content = content.substring(0, contactStartIndex) + newContactBlock + content.substring(actionBlockStartIndex - 1);
}

// 3. Now move the Action Block to the top
const actionBlockFullStart = '<div className="mt-4 border-t border-white/10 pt-6">';
const actionBlockFullEnd = '</div>\n        </div>\n      </div>\n    </div>\n  );\n};';
const aStart = content.indexOf(actionBlockFullStart);
const aEnd = content.indexOf(actionBlockFullEnd);

if (aStart > -1 && aEnd > -1) {
    let actionBlock = content.substring(aStart + actionBlockFullStart.length, aEnd);
    // Remove the extra "Abrir Chat para Responder" button from action block
    const chatBtnStart = '<button \n                      onClick={async () => {\n                        try {\n                          const chatId = await findOrCreateChat(artist.id, isApplicantForEventId);';
    const chatBtnEnd = '<FaWhatsapp className="w-5 h-5" /> Abrir Chat para Responder\n                    </button>';
    const cStart = actionBlock.indexOf('<button \n                      onClick={async () => {\n                        try {\n                          const chatId = await findOrCreateChat(artist.id, isApplicantForEventId);');
    const cEnd = actionBlock.indexOf(chatBtnEnd) + chatBtnEnd.length;
    
    if (cStart > -1 && cEnd > -1) {
       actionBlock = actionBlock.substring(0, cStart) + actionBlock.substring(cEnd);
    }
    
    // Remove it from the bottom
    content = content.substring(0, aStart) + actionBlockFullEnd;
    
    // Insert at the top
    const insertPoint = '<div className="p-6 md:p-8 flex flex-col gap-6">';
    content = content.replace(insertPoint, insertPoint + '\n          ' + actionBlock);
}

fs.writeFileSync(file, content);
console.log('Update complete');
