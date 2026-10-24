import { type ReactNode } from 'react';

/**
 * SwipeWrapper — Envoltorio pasivo.
 * Se desactiva el gesto 'drag="x"' con Framer Motion ya que secuestraba
 * los eventos táctiles en móviles, provocando bloqueos severos en el scroll vertical
 * y evitando poder subir o bajar en vistas con listas o calendarios.
 * La navegación entre pestañas se realiza de forma limpia y confiable mediante la barra inferior.
 */
interface SwipeWrapperProps {
  children: ReactNode;
}

export const SwipeWrapper = ({ children }: SwipeWrapperProps) => {
  return <>{children}</>;
};

