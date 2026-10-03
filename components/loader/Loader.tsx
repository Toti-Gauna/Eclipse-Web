import './loader.css';

/** Runs in <head> before first paint: show the loader only on the first visit of the session. */
export const LOADER_HEAD_SCRIPT = `(function(){try{var s=window.sessionStorage;if(s.getItem('eclipse:visited'))return;s.setItem('eclipse:visited','1');document.documentElement.setAttribute('data-loader','on');window.__eclipseLoaderAt=performance.now();}catch(e){}})();`;

/**
 * Runs right after the loader markup is parsed (stylesheets are loaded by then):
 * anchors every loader animation to the head script's clock. Without it the CSS
 * timeline only starts on the first free frame, so a busy main thread during
 * hydration could stretch the loader past 1.5 s. If the page is that late, the
 * animations are simply already over and the loader never covers the content.
 */
const LOADER_SYNC_SCRIPT = `(function(){try{var el=document.querySelector('.loader'),t=window.__eclipseLoaderAt;if(!el||t==null||!el.getAnimations)return;var a=el.getAnimations({subtree:true});for(var i=0;i<a.length;i++)a[i].startTime=t;}catch(e){}})();`;

/** Duration of the loader before the iris starts opening (ms), see loader.css. */
export const LOADER_IRIS_AT_MS = 880;

const WORD = 'ECLIPSE';

export function Loader() {
  return (
    <>
      <div className="loader" aria-hidden="true">
        <div className="loader-stage">
          <div className="loader-flash" />
          <svg className="loader-ring" viewBox="0 0 120 120">
            <circle className="loader-track" cx="60" cy="60" r="56" />
            <circle className="loader-progress" cx="60" cy="60" r="56" pathLength={1} />
          </svg>
          <p className="loader-word">
            {WORD.split('').map((c, i) => (
              <span key={i} style={{ ['--i' as string]: i }}>
                {c}
              </span>
            ))}
          </p>
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: LOADER_SYNC_SCRIPT }} />
    </>
  );
}
