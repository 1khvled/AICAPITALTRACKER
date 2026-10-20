/**
 * The isolation document for Adsterra's `/22/` zones.
 *
 * Kept in its own module (rather than inside the component file) so the client
 * component that renders the creative can import it without dragging the
 * whole slot component - and its server-side dependency graph - into the
 * browser bundle.
 */

export function buildAtOptionsDoc(args: {
  scriptSrc: string;
  zoneKey: string;
  width: number;
  height: number;
}): string {
  const scriptSrc = args.scriptSrc;
  const zoneKey = args.zoneKey;
  const width = args.width;
  const height = args.height;
  const safeSrc = scriptSrc.replace(/[<>"'`]/g, "");
  const safeKey = zoneKey.replace(/[^A-Za-z0-9_-]/g, "");
  const options = JSON.stringify({
    key: safeKey,
    format: "iframe",
    height,
    width,
    params: {},
  });
  return (
    "<!doctype html><html><head><meta charset=\"utf-8\">" +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    "<style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}" +
    "iframe{border:0;display:block}</style>" +
    "</head><body>" +
    // `window.atOptions = {...}` and NOT `var atOptions = {...}`: a var
    // declaration creates a NON-configurable global, and Adsterra's invocation
    // script does `delete window.atOptions` when it finishes — which throws on a
    // non-configurable property and takes the rest of their script down with it
    // ("Cannot delete property 'atOptions' of #<Window>").
    `<script>window.atOptions=${options};</script>` +
    `<script async data-cfasync="false" src="${safeSrc}"></script>` +
    "</body></html>"
  );
}
