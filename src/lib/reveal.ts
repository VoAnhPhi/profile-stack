/**
 * One shared IntersectionObserver for every scroll reveal on the page.
 *
 * Reveals are CSS transitions rather than GSAP timelines. They cost nothing per
 * frame, and the `prefers-reduced-motion` block in globals.css already neutralises
 * them - a JS timeline would need its own guard.
 *
 * Elements are unobserved once revealed. studiomodular.be is the cheapest site in
 * the reference set (6794 rAF calls per full scroll against sadumedia's 16593)
 * largely because it stops watching things it is done with.
 */

let observer: IntersectionObserver | null = null;

function reveal(element: Element) {
  element.setAttribute("data-inview", "true");
}

function getObserver(): IntersectionObserver {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        reveal(entry.target);
        observer?.unobserve(entry.target);
      }
    },
    {
      // Fires a little before the element is fully on screen, so the reveal has
      // finished by the time the reader's eye arrives.
      rootMargin: "0px 0px -10% 0px",
      // Zero, not a fraction. A threshold of 0.15 left the hero name permanently
      // invisible on a 390px viewport: each line sits inside an `overflow: hidden`
      // mask and starts translated 40px down, and at mobile type size that leaves
      // too little of the box intersecting to clear the fraction. Any intersection
      // at all is the right trigger, and rootMargin already handles the timing.
      threshold: 0,
    },
  );
  return observer;
}

export function observeReveal(element: Element | null): () => void {
  if (!element) return () => {};

  // Without IntersectionObserver, show the element rather than hide it forever.
  if (typeof IntersectionObserver === "undefined") {
    reveal(element);
    return () => {};
  }

  const io = getObserver();
  io.observe(element);

  // Safety net. The observer is the primary path and normally fires within a
  // frame, so this waits long enough not to steal the entrance animation - a
  // synchronous reveal here would flip the element to its final state before the
  // browser had painted the initial one, and nothing would transition. It only
  // acts on an element that is on screen and still hidden, which means the
  // observer failed, and permanently invisible content is the worse outcome.
  const safety = window.setTimeout(() => {
    if (element.getAttribute("data-inview") === "true") return;
    // "Has entered or already passed", not "is on screen". An instant jump - a
    // find-in-page hit, a restored scroll position - can carry an element from
    // below the fold to above it between two frames, and the observer sees
    // isIntersecting false at both, so it queues nothing.
    if (element.getBoundingClientRect().top < window.innerHeight) {
      reveal(element);
      io.unobserve(element);
    }
  }, 600);

  return () => {
    window.clearTimeout(safety);
    io.unobserve(element);
  };
}
