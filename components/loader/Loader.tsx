import './loader.css';
import { LOADER_DONE_EVENT, LOADER_END_MS, LOADER_REDUCED_END_MS } from './constants';

/** Runs in <head> before first paint, on every full page load: turns the loader on and starts its clock. */
export const LOADER_HEAD_SCRIPT = `(function(){try{document.documentElement.setAttribute('data-loader','on');window.__eclipseLoaderAt=performance.now();}catch(e){}})();`;

/**
 * Runs right after the loader markup is parsed (stylesheets are loaded by then):
 * 1. Anchors every loader animation to the head script's clock. Without it the CSS
 *    timeline only starts on the first free frame, so a busy main thread during
 *    hydration could stretch the loader. If the page is that late, the animations are
 *    simply already over and the loader never covers the content.
 * 2. Any click, tap, key or wheel skips it (a 180 ms fade), without stopping the event.
 * 3. At the end (or after a skip) html[data-loader] becomes "done": the layer is removed.
 */
const LOADER_SYNC_SCRIPT = `(function(){try{var d=document.documentElement,el=document.querySelector('.loader'),t=window.__eclipseLoaderAt;if(!el||t==null||d.getAttribute('data-loader')!=='on')return;if(el.getAnimations){var a=el.getAnimations({subtree:true});for(var i=0;i<a.length;i++)a[i].startTime=t;}var rm=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches),ev=['pointerdown','keydown','wheel','touchstart'],over=0;function off(){for(var i=0;i<ev.length;i++)removeEventListener(ev[i],skip,true);}function end(s){if(over)return;over=1;off();if(s)d.setAttribute('data-loader','skip');setTimeout(function(){d.setAttribute('data-loader','done');},s?220:0);dispatchEvent(new Event('${LOADER_DONE_EVENT}'));}function skip(){end(1);}for(var i=0;i<ev.length;i++)addEventListener(ev[i],skip,{capture:true,passive:true});setTimeout(function(){end(0);},Math.max(0,t+(rm?${LOADER_REDUCED_END_MS}:${LOADER_END_MS})-performance.now()));}catch(e){}})();`;

const WORD = 'ECLIPSE';

/**
 * The loading screen is the trailers' end card (components/trailers SceneLogo): the
 * moon slides over the sun, the corona blooms with a diamond-ring glint, the ECLIPSE
 * wordmark rises letter by letter over the end line. Then the dark sky itself — a
 * disc larger than the screen — passes away like the moon, uncovering the page.
 *
 * Pure CSS (see loader.css), shown on every full page load by the head script. It
 * never blocks: the page is painted and hydrates underneath from the first frame
 * (the hero H1 stays the LCP element), and the layer is only transform / opacity.
 * Decorative: hidden from assistive tech.
 */
export function Loader({ endLine }: { endLine: string }) {
  return (
    <>
      <div className="loader" aria-hidden="true">
        <div className="loader-sky">
          <div className="loader-scene">
            <div className="loader-eclipse">
              <span className="loader-glow" />
              <span className="loader-corona" />
              <span className="loader-sun" />
              <span className="loader-moon" />
              <span className="loader-glint" />
            </div>
            <p className="loader-word">
              {WORD.split('').map((c, i) => (
                <span key={i} style={{ ['--i' as string]: i }}>
                  {c}
                </span>
              ))}
            </p>
            <p className="loader-line">{endLine}</p>
          </div>
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: LOADER_SYNC_SCRIPT }} />
    </>
  );
}
