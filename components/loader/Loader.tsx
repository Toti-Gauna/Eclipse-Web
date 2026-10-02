import './loader.css';

/** Runs in <head> before first paint: show the loader only on the first visit of the session. */
export const LOADER_HEAD_SCRIPT = `(function(){try{var s=window.sessionStorage;if(s.getItem('eclipse:visited'))return;s.setItem('eclipse:visited','1');document.documentElement.setAttribute('data-loader','on');window.__eclipseLoaderAt=performance.now();}catch(e){}})();`;

/** Duration of the loader before the iris starts opening (ms), see loader.css. */
export const LOADER_IRIS_AT_MS = 1000;

const WORD = 'ECLIPSE';

export function Loader() {
  return (
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
  );
}
