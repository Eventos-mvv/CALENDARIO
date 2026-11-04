import { useLayoutEffect, useRef } from 'react';
import palco from '../assets/fotos/palco-louvor.jpg';
import plateia from '../assets/fotos/plateia-ministros.jpg';
import selfie from '../assets/fotos/comunhao-selfie.jpg';
import { gsap, prefersReducedMotion } from '../motion/smooth';

/**
 * Bloco de fotos dos encontros do MVV (arquivos do próprio projeto,
 * em src/assets/fotos). Cada foto se move devagar dentro da moldura ao rolar.
 */
const PHOTOS = [
  { src: palco, alt: 'Louvor no palco do auditório da Igreja Verbo da Vida, com o público em pé', cls: 'band__item--main' },
  { src: plateia, alt: 'Auditório lotado de ministros ouvindo uma ministração', cls: 'band__item--a' },
  { src: selfie, alt: 'Participantes tirando uma foto juntos no celular durante o evento', cls: 'band__item--b' },
];

export function PhotoBand() {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!root.current || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.band__item').forEach((item, i) => {
        const img = item.querySelector('img');
        gsap.fromTo(
          img,
          { yPercent: -8 },
          {
            yPercent: 8,
            ease: 'none',
            scrollTrigger: { trigger: item, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        );
        gsap.from(item, {
          clipPath: 'inset(12% 0 12% 0)',
          duration: 1.1,
          delay: i * 0.08,
          ease: 'power3.out',
          scrollTrigger: { trigger: item, start: 'top 88%' },
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="band">
      {PHOTOS.map((p) => (
        <figure key={p.src} className={`band__item ${p.cls}`}>
          <img src={p.src} alt={p.alt} loading="lazy" decoding="async" />
        </figure>
      ))}
    </div>
  );
}
