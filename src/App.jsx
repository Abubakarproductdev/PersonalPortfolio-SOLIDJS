import { createEffect, createMemo, createSignal, For, lazy, onCleanup, onMount, Show, Suspense } from "solid-js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ScrollStack, { ScrollStackItem } from "./components/ScrollStack";
import Reveal from "./components/Reveal";
import { createScrollProgress } from "./hooks/createScrollProgress";
import {
  FRAME_COUNT,
  PHYSICS_TEXTURES,
  frameCache,
  findClosestLoadedFrame,
  hasInitiallyLoaded,
  setHasInitiallyLoaded,
  initFramesPreload,
  subscribePreload,
} from "./lib/homePreload";
import { projectCards, projectData } from "./data/projectData";

const PhysicsScene = lazy(() => import("./components/PhysicsScene"));
const ProjectScene = lazy(() => import("./components/ProjectScene"));

const bioContent = [
  { l: "I AM A", r: "MERN-STACK" },
  { l: "ENGINEER", r: "WITH A BS" },
  { l: "IN SOFTWARE", r: "ENGINEERING" },
  { l: "FROM CUST.", r: "I LIVE IN" },
  { l: "THE JS", r: "ECOSYSTEM," },
  { l: "BUT MY FOCUS", r: "HAS SHIFTED" },
  { l: "FROM BUILDING", r: "INTERFACES" },
  { l: "TO ARCHITECTING", r: "INTELLIGENT" },
  { l: "SYSTEMS.", r: "MY CORE" },
  { l: "FOUNDATION", r: "IS THE MERN" },
  { l: "STACK", r: "AND NEXT.JS." },
  { l: "I MANAGE", r: "EVERYTHING" },
  { l: "FROM COMPLEX", r: "STATE" },
  { l: "IN REACT", r: "AND TAILWIND" },
  { l: "STYLING", r: "TO BUILDING" },
  { l: "SCALABLE", r: "NODE AND" },
  { l: "EXPRESS", r: "BACKENDS" },
  { l: "POWERED", r: "BY MONGODB." },
  { l: "I FOCUS", r: "ON TOTAL" },
  { l: "OPTIMIZATION,", r: "UTILIZING" },
  { l: "CUSTOM", r: "HOOKS FOR" },
  { l: "REUSABILITY,", r: "MIDDLEWARE" },
  { l: "FOR ROBUST", r: "AUTH," },
  { l: "AND EFFICIENT", r: "INDEXING" },
  { l: "FOR DATABASE", r: "PERFORMANCE." },
  { l: "I BELIEVE", r: "THE NEXT" },
  { l: "GENERATION", r: "OF WEB APPS" },
  { l: "WON'T BE", r: "CRUD-BASED;" },
  { l: "THEY WILL", r: "BE AGENTIC." },
  { l: "I AM THE", r: "PERSON" },
  { l: "BUILDING", r: "THE BRIDGE" },
  { l: "TO GET", r: "US THERE." },
];

function routeFromLocation() {
  const pathname = window.location.pathname.replace(/\/$/, "") || "/";
  return pathname;
}

function Link(props) {
  return (
    <a
      href={props.href}
      class={props.class}
      onClick={(event) => {
        if (props.href?.startsWith("/")) {
          event.preventDefault();
          window.history.pushState({}, "", props.href);
          window.dispatchEvent(new PopStateEvent("popstate"));
          window.scrollTo(0, 0);
        }
      }}
    >
      {props.children}
    </a>
  );
}

export default function App() {
  const [route, setRoute] = createSignal(routeFromLocation());

  onMount(() => {
    const handlePopState = () => setRoute(routeFromLocation());
    window.addEventListener("popstate", handlePopState);
    onCleanup(() => window.removeEventListener("popstate", handlePopState));
  });

  const projectSlug = createMemo(() => {
    const match = route().match(/^\/portfolio\/([^/]+)$/);
    return match?.[1];
  });

  return (
    <Show
      when={projectSlug()}
      fallback={route() === "/contact" ? <ContactPage /> : <Home />}
    >
      {(slug) => <ProjectPage slug={slug()} />}
    </Show>
  );
}

function Home() {
  const isReturning = hasInitiallyLoaded;
  const [isLoading, setIsLoading] = createSignal(!isReturning);
  const [isFramesLoaded, setIsFramesLoaded] = createSignal(isReturning);
  const [isComponentsLoaded, setIsComponentsLoaded] = createSignal(isReturning);
  const [isPhysicsLoaded, setIsPhysicsLoaded] = createSignal(isReturning);
  const [showPhysicsScene, setShowPhysicsScene] = createSignal(false);
  const [loadingProgress, setLoadingProgress] = createSignal(isReturning ? 100 : 0);
  const [loadingStatus, setLoadingStatus] = createSignal(isReturning ? "Ready" : "Preparing");
  const [isMobile, setIsMobile] = createSignal(false);
  let canvas;
  let container;
  let waveWrapper;
  let techSection;
  let drawFrame = 0;
  let currentFrameIndex = 0;
  let pendingFrameSource = null;
  let canvasMetrics = { width: 0, height: 0 };
  const scrollProgress = createScrollProgress(() => container);

  const resizeCanvas = () => {
    if (!canvas) return;
    const dpr = isMobile() ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
    const cssWidth = Math.max(1, Math.floor(window.innerWidth));
    const cssHeight = Math.max(1, Math.floor(window.innerHeight));
    const pixelWidth = Math.max(1, Math.floor(cssWidth * dpr));
    const pixelHeight = Math.max(1, Math.floor(cssHeight * dpr));

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
      canvas.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    canvasMetrics = { width: cssWidth, height: cssHeight };
  };

  const drawImage = (img) => {
    if (!canvas || !img) return;
    if (!canvasMetrics.width || !canvasMetrics.height) resizeCanvas();

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvasMetrics;
    const imgWidth = img.width || 1920;
    const imgHeight = img.height || 1080;
    const ratio = Math.max(width / imgWidth, height / imgHeight);
    const newWidth = imgWidth * ratio;
    const newHeight = imgHeight * ratio;
    const offsetX = (width - newWidth) / 2;
    const offsetY = (height - newHeight) / 2;

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, offsetX, offsetY, newWidth, newHeight);
  };

  const queueFrameDraw = (img) => {
    if (!img) return;
    pendingFrameSource = img;
    if (drawFrame) return;

    drawFrame = requestAnimationFrame(() => {
      drawFrame = 0;
      drawImage(pendingFrameSource);
    });
  };

  createEffect(() => {
    if (isLoading()) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      window.scrollTo(0, 0);
    } else {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }
  });

  createEffect(() => {
    if (isFramesLoaded() && isComponentsLoaded() && isPhysicsLoaded()) {
      setHasInitiallyLoaded(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
        window.scrollTo(0, 0);
      }, 150);
      onCleanup(() => clearTimeout(timer));
    }
  });

  createEffect(() => {
    const progress = scrollProgress();
    const nextFrameIndex = Math.min(FRAME_COUNT - 1, Math.max(0, Math.floor(progress * (FRAME_COUNT - 1))));
    currentFrameIndex = nextFrameIndex;
    const frame = findClosestLoadedFrame(currentFrameIndex);
    if (frame) queueFrameDraw(frame);
  });

  onMount(() => {
    gsap.registerPlugin(ScrollTrigger);
    let cancelled = false;
    const mobileQuery = window.matchMedia("(max-width: 767px), (pointer: coarse)");
    const updateMobileState = () => setIsMobile(mobileQuery.matches);
    updateMobileState();
    if (typeof mobileQuery.addEventListener === "function") {
      mobileQuery.addEventListener("change", updateMobileState);
    } else {
      mobileQuery.addListener?.(updateMobileState);
    }

    const fallbackTimer = setTimeout(() => {
      setIsFramesLoaded(true);
      setIsComponentsLoaded(true);
      setIsPhysicsLoaded(true);
      setLoadingProgress(100);
      setLoadingStatus("Ready");
    }, 3000);

    setShowPhysicsScene(!mobileQuery.matches);
    if (mobileQuery.matches) {
      setIsPhysicsLoaded(true);
    }

    const preloadComponentChunks = async () => {
      setLoadingStatus("Loading interface");
      await Promise.all([
        import("./components/ProjectScene"),
        mobileQuery.matches ? Promise.resolve() : import("./components/PhysicsScene"),
      ]);

      if (!cancelled) {
        setIsComponentsLoaded(true);
      }
    };

    const unsubscribe = subscribePreload(({ progress, done }) => {
      if (cancelled) return;
      if (done) setIsFramesLoaded(true);
      setLoadingProgress((prev) => Math.max(prev, progress));
    });

    initFramesPreload((firstFrame) => {
      if (cancelled) return;
      queueFrameDraw(firstFrame);
      setLoadingProgress(25);
      setIsFramesLoaded(true);
    }).catch(() => {
      if (!cancelled) setIsFramesLoaded(true);
    });

    preloadComponentChunks().catch(() => {
      if (!cancelled) setIsComponentsLoaded(true);
    });

    const handleResize = () => {
      resizeCanvas();
      const img = findClosestLoadedFrame(currentFrameIndex);
      if (img) queueFrameDraw(img);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    if (hasInitiallyLoaded) {
      const existing = findClosestLoadedFrame(0);
      if (existing) queueFrameDraw(existing);
    }

    const ctx = gsap.context(() => {
      const leftColumn = waveWrapper.querySelector(".wave-column-left");
      const rightColumn = waveWrapper.querySelector(".wave-column-right");
      const leftTexts = gsap.utils.toArray(leftColumn.querySelectorAll(".animated-text"));
      const rightTexts = gsap.utils.toArray(rightColumn.querySelectorAll(".animated-text"));
      const leftQuickSetters = leftTexts.map((text) => gsap.quickTo(text, "x", { duration: 0.6, ease: "power4.out" }));
      const rightQuickSetters = rightTexts.map((text) => gsap.quickTo(text, "x", { duration: 0.6, ease: "power4.out" }));
      const leftRange = { minX: 0, maxX: 0 };
      const rightRange = { minX: 0, maxX: 0 };
      const wavePhaseStep = 0.5;
      const waveSpeed = 0.8;
      const waveAmplitude = 0.5;

      const calculateRanges = () => {
        const maxLeftTextWidth = Math.max(...leftTexts.map((text) => text.offsetWidth));
        const maxRightTextWidth = Math.max(...rightTexts.map((text) => text.offsetWidth));
        leftRange.maxX = Math.max(0, leftColumn.offsetWidth - maxLeftTextWidth) * waveAmplitude;
        rightRange.maxX = Math.max(0, rightColumn.offsetWidth - maxRightTextWidth) * waveAmplitude;
      };

      const setInitialPositions = (texts, range, multiplier) => {
        texts.forEach((text, index) => {
          const initialPhase = wavePhaseStep * index - Math.PI / 2;
          const initialProgress = (Math.sin(initialPhase) + 1) / 2;
          gsap.set(text, { x: (range.minX + initialProgress * range.maxX) * multiplier });
        });
      };

      calculateRanges();
      setInitialPositions(leftTexts, leftRange, 1);
      setInitialPositions(rightTexts, rightRange, -1);
      window.addEventListener("resize", calculateRanges);

      ScrollTrigger.create({
        trigger: waveWrapper,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          const closestIndex = Math.min(
            leftTexts.length - 1,
            Math.max(0, Math.floor(self.progress * leftTexts.length)),
          );

          const updateColumn = (texts, setters, range, multiplier) => {
            texts.forEach((text, index) => {
              const phase = wavePhaseStep * index + waveSpeed * self.progress * Math.PI * 2 - Math.PI / 2;
              const cycleProgress = (Math.sin(phase) + 1) / 2;
              setters[index]((range.minX + cycleProgress * range.maxX) * multiplier);

              if (index === closestIndex && text.dataset.focused !== "true") {
                text.dataset.focused = "true";
                gsap.to(text, {
                  scale: 1.05,
                  color: "white",
                  opacity: 1,
                  duration: 0.2,
                  overwrite: "auto",
                });
              } else if (index !== closestIndex && text.dataset.focused !== "false") {
                text.dataset.focused = "false";
                gsap.to(text, {
                  scale: 1,
                  color: "#4d4d4d",
                  opacity: 0.4,
                  duration: 0.2,
                  overwrite: "auto",
                });
              }
            });
          };

          updateColumn(leftTexts, leftQuickSetters, leftRange, 1);
          updateColumn(rightTexts, rightQuickSetters, rightRange, -1);
        },
      });

      return () => window.removeEventListener("resize", calculateRanges);
    }, waveWrapper);

    onCleanup(() => {
      cancelled = true;
      clearTimeout(fallbackTimer);
      unsubscribe();
      if (typeof mobileQuery.removeEventListener === "function") {
        mobileQuery.removeEventListener("change", updateMobileState);
      } else {
        mobileQuery.removeListener?.(updateMobileState);
      }
      window.removeEventListener("resize", handleResize);
      if (drawFrame) cancelAnimationFrame(drawFrame);
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      ctx.revert();
    });
  });

  createEffect(() => {
    if (!isLoading()) {
      requestAnimationFrame(() => ScrollTrigger.refresh());
    }
  });

  const landingOpacity = () => {
    const progress = scrollProgress();
    if (progress <= 0) return 1;
    if (progress >= 0.08) return 0;
    return 1 - progress / 0.08;
  };
  return (
    <div class="font-portfolio min-h-screen overflow-x-hidden bg-black">
      <Show when={isLoading()}>
        <div
          class={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#050505] ${
            isFramesLoaded() && isComponentsLoaded() && isPhysicsLoaded() ? "loading-exit" : ""
          }`}
        >
          <div class="relative flex items-center justify-center">
            <div class="loader-ring absolute h-40 w-40 rounded-full border-[1px] border-white/10 border-t-white/80 md:h-56 md:w-56" />
            <div class="loader-ring-reverse absolute h-32 w-32 rounded-full border-[1px] border-white/5 border-r-white/30 border-b-white/30 md:h-48 md:w-48" />
            <div class="loader-pulse absolute h-2 w-2 rounded-full bg-white md:h-3 md:w-3" />
          </div>
          <div class="loader-text mt-12 text-xs font-light tracking-[0.5em] text-white/60 uppercase md:text-sm">
            {loadingStatus()}
          </div>
          <div class="mt-6 h-px w-56 overflow-hidden bg-white/10 md:w-72">
            <div class="h-full bg-white/70 transition-[width] duration-300" style={{ width: `${loadingProgress()}%` }} />
          </div>
          <div class="mt-4 text-[10px] font-light tracking-[0.4em] text-white/35 uppercase">{loadingProgress()}%</div>
        </div>
      </Show>

      <div class="pointer-events-none fixed top-0 left-0 z-0 h-screen w-full overflow-hidden">
        <canvas ref={canvas} class="absolute top-0 left-0 z-0 h-full w-full object-cover" />
        <div class="absolute top-0 left-0 z-10 flex h-full w-full flex-col items-center justify-end px-4 pb-18 text-white md:pb-32">
          <div style={{ opacity: landingOpacity() }} class="text-center">
            <h1 class="text-[clamp(2rem,11vw,4.5rem)] font-light tracking-[0.14em] uppercase md:text-7xl md:tracking-widest">
              Muhammad Abubakar
            </h1>
            <p class="mt-3 text-xs tracking-[0.26em] text-gray-400 md:mt-4 md:text-sm md:tracking-[0.3em]">Software Engineer</p>
          </div>
        </div>
      </div>

      <main ref={container} class="relative z-10 flex w-full flex-col justify-center overflow-hidden pt-[105vh] pb-[4vh] md:pt-[110vh] md:pb-[10vh]">
        <div class="pointer-events-none sticky top-16 z-[200] mb-8 w-full text-center text-[10px] font-light tracking-[0.38em] text-white/50 md:top-20 md:mb-10 md:text-sm md:tracking-[0.5em]">
          01 / BIO
        </div>
        <div ref={waveWrapper} class="dual-wave-wrapper relative flex w-full gap-2 px-3 md:gap-[10vw] md:px-[10vw]">
          <div class="wave-column wave-column-left relative z-[100] flex flex-1 flex-col items-start gap-[0.75vh] text-[clamp(0.62rem,4vw,2rem)] leading-none font-light md:gap-[1vh] md:text-[clamp(0.75rem,3vw,2rem)]">
            <For each={bioContent}>{(line) => <div class="animated-text w-max origin-left text-[#4d4d4d] uppercase opacity-40">{line.l}</div>}</For>
          </div>
          <div class="wave-column wave-column-right relative z-[100] flex flex-1 flex-col items-end gap-[0.75vh] text-right text-[clamp(0.62rem,4vw,2rem)] leading-none font-light md:gap-[1vh] md:text-[clamp(0.75rem,3vw,2rem)]">
            <For each={bioContent}>{(line) => <div class="animated-text w-max origin-right text-[#4d4d4d] uppercase opacity-40">{line.r}</div>}</For>
          </div>
        </div>
      </main>

     

      <div ref={techSection} class="relative z-40 h-[64vh] min-h-[440px] w-full  bg-black md:h-screen">
        <div class="pointer-events-none absolute top-8 left-1/2 z-50 w-full -translate-x-1/2 text-center text-[10px] font-light tracking-[0.38em] text-white/50 md:top-20 md:text-sm md:tracking-[0.5em]">
          02 / TECH STACK
        </div>
        <Show
          when={!isMobile()}
          fallback={<MobileTechStack />}
        >
          <Show when={showPhysicsScene()}>
            <Suspense fallback={null}>
              <PhysicsScene onLoaded={() => setIsPhysicsLoaded(true)} />
            </Suspense>
          </Show>
        </Show>
      </div>

      <section class="relative z-30 flex w-full flex-col items-center bg-black pt-6 pb-20 text-white md:pt-15 md:pb-32">
        <div class="mb-8 w-full text-center text-[10px] font-light tracking-[0.38em] text-white/50 md:mb-16 md:text-sm md:tracking-[0.5em]">
          03 / PROJECTS
        </div>
        <div class="flex w-full justify-center">
          <ScrollStack useWindowScroll={true}>
            <For each={projectCards}>{(project) => <ProjectCard project={project} />}</For>
          </ScrollStack>
        </div>
      </section>

      <section class="relative z-[9999] flex min-h-[50vh] w-full flex-col items-center justify-center border-t border-white/5 bg-black px-4 pt-10 pb-20 text-white">
        <div class="mb-10 text-center text-xs font-light tracking-[0.5em] text-white/50 md:mb-16 md:text-sm">04 / CONTACT</div>
        <h2 class="cursor-pointer text-center text-4xl font-extralight tracking-widest text-white/90 uppercase transition-colors hover:text-white md:text-8xl">
          Let's Talk.
        </h2>
        <a href="mailto:sshaiy2255@gmail.com" class="mt-8 break-all text-center text-xs font-light tracking-widest text-white/60 uppercase transition-colors hover:text-white md:text-sm">
          sshaiy2255@gmail.com
        </a>
        <div class="mt-12 flex flex-wrap justify-center gap-6 text-xs tracking-widest text-white/60 uppercase md:mt-16 md:gap-10 md:text-sm">
          <a href="https://www.linkedin.com/in/muhammad-abubakar-industrial-designer/" target="_blank" rel="noopener noreferrer" class="cursor-pointer transition-colors hover:text-white">
            LinkedIn
          </a>
          <a href="https://github.com/Abubakarproductdev" target="_blank" rel="noopener noreferrer" class="cursor-pointer transition-colors hover:text-white">
            GitHub
          </a>
        </div>
      </section>
    </div>
  );
}

function ProjectCard(props) {
  const project = props.project;

  return (
    <ScrollStackItem>
      <Link href={`/portfolio/${project.slug}`} class="group mx-auto flex min-h-[58vh] w-[92vw] max-w-6xl cursor-pointer flex-col overflow-hidden rounded-xl border border-white/8 bg-[#111111] transition-all duration-700 hover:border-white/20 md:h-[65vh] md:w-[80vw] md:flex-row md:rounded-2xl md:border-transparent">
        <div class="relative h-44 w-full shrink-0 border-b border-white/10 md:hidden">
          <img src={project.image} alt={project.title} loading="lazy" decoding="async" class="h-full w-full object-cover opacity-60 grayscale transition-all duration-700 group-hover:opacity-100 group-hover:grayscale-0" />
        </div>
        <div class="flex flex-1 flex-col justify-center p-5 md:p-12">
          <h2 class="mb-2 text-2xl font-light tracking-[0.16em] text-white/90 uppercase transition-colors duration-700 group-hover:text-white md:mb-4 md:text-6xl md:tracking-widest">
            {project.title}
          </h2>
          <p class="mb-5 text-xs leading-relaxed font-light tracking-wider text-neutral-400 md:mb-10 md:text-lg">{project.subtitle}</p>
          <div class="mt-auto flex flex-col gap-3.5 md:gap-6">
            <TechLine label="Backend" value={project.backend} />
            <TechLine label="Frontend" value={project.frontend} />
          </div>
        </div>
        <div class="relative hidden flex-1 border-l border-white/10 md:block">
          <img src={project.image} alt={project.title} loading="lazy" decoding="async" class="h-full w-full object-cover opacity-50 grayscale transition-all duration-700 group-hover:opacity-100 group-hover:grayscale-0" />
        </div>
      </Link>
    </ScrollStackItem>
  );
}

function TechLine(props) {
  return (
    <div>
      <p class="mb-1 text-[10px] tracking-[0.2em] text-neutral-600 uppercase md:mb-2 md:text-sm">{props.label}</p>
      <p class="text-xs leading-relaxed font-light tracking-wider text-neutral-300 md:text-base">{props.value}</p>
    </div>
  );
}

function MobileTechStack() {
  const techNames = ["Next.js", "React", "Python", "JavaScript", "HTML", "Tailwind", "Node.js", "Express", "MongoDB"];

  return (
    <div class="flex h-full w-full items-center justify-center px-4 pt-14">
      <div class="mobile-tech-grid w-full max-w-sm">
        <For each={PHYSICS_TEXTURES}>
          {(src, index) => (
            <div class="mobile-tech-cell">
              <img src={src} alt={techNames[index()]} loading="lazy" class="h-12 w-12 rounded-full object-cover" />
              <span>{techNames[index()]}</span>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}

function ProjectPage(props) {
  const data = () => projectData[props.slug] || projectData.sivo;
  const [isMobileProject, setIsMobileProject] = createSignal(false);
  let container;
  const scrollProgress = createScrollProgress(() => container);
  const yHero = () => scrollProgress() * 300;
  const opacityHero = () => (scrollProgress() <= 0.2 ? 1 - scrollProgress() / 0.2 : 0);

  onMount(() => {
    const mobileQuery = window.matchMedia("(max-width: 767px), (pointer: coarse)");
    const updateMobileState = () => setIsMobileProject(mobileQuery.matches);
    updateMobileState();

    if (typeof mobileQuery.addEventListener === "function") {
      mobileQuery.addEventListener("change", updateMobileState);
      onCleanup(() => mobileQuery.removeEventListener("change", updateMobileState));
    } else {
      mobileQuery.addListener?.(updateMobileState);
      onCleanup(() => mobileQuery.removeListener?.(updateMobileState));
    }
  });

  return (
    <div ref={container} class="font-portfolio min-h-screen overflow-x-hidden bg-black text-white">
      <Show when={!isMobileProject()}>
        <div class="pointer-events-none fixed inset-0 z-0 opacity-40">
          <Suspense fallback={null}>
            <ProjectScene />
          </Suspense>
        </div>
      </Show>

      <nav class="fixed top-0 left-0 z-50 flex w-full items-center justify-between p-6 mix-blend-difference md:p-10">
        <Link href="/" class="text-xs tracking-[0.3em] uppercase transition-opacity hover:opacity-50">
          Back
        </Link>
        <div class="text-xs tracking-[0.3em] text-white/50 uppercase">Case Study</div>
      </nav>

      <main class="relative z-10 w-full">
        <section class="flex min-h-[100svh] flex-col items-start justify-center px-5 py-24 md:h-screen md:px-[10vw] md:py-0">
          <div style={{ transform: `translateY(${yHero()}px)`, opacity: opacityHero() }} class="w-full max-w-5xl shrink-0">
            <div class="fade-in mb-8 overflow-hidden" style={{ "animation-delay": "0.2s" }}>
              <h1 class="text-[clamp(2.8rem,16vw,5rem)] leading-[0.92] font-light tracking-tight uppercase md:text-8xl lg:text-[10vw]">{data().title}</h1>
            </div>
            <div class="fade-in-up mb-8 h-[1px] w-full bg-white/20" style={{ "animation-delay": "0.5s" }} />
            <p class="fade-in text-sm font-light tracking-widest text-gray-400 uppercase md:text-xl" style={{ "animation-delay": "0.7s" }}>
              {data().subtitle}
            </p>
            <div class="fade-in mt-12 flex flex-col gap-7 md:mt-16 md:flex-row md:flex-wrap md:gap-12" style={{ "animation-delay": "0.9s" }}>
              <TechLine label="Backend" value={data().tech.backend} />
              <TechLine label="Frontend" value={data().tech.frontend} />
              <div>
                <p class="mb-2 text-[10px] tracking-[0.2em] text-neutral-600 uppercase">Source Code</p>
                <a href={data().github} target="_blank" rel="noopener noreferrer" class="text-sm font-light tracking-wider text-neutral-300 underline decoration-white/30 underline-offset-4 transition-colors hover:text-white">
                  View on GitHub
                </a>
              </div>
            </div>
          </div>
        </section>

        <CaseSection index="01" title="Overview" tone="bg-black/80 backdrop-blur-md">
          {data().description}
        </CaseSection>
        <CaseSection index="03" title="The Hardest Path" tone="bg-black/90">
          {data().hardestPath}
        </CaseSection>
        <CaseSection index="04" title="Challenges" tone="bg-[#050505]">
          {data().challenges}
        </CaseSection>
        <CaseSection index="05" title="Solutions" tone="bg-black">
          {data().MySolutions}
        </CaseSection>

        <Show when={data().hasDemo}>
          <section class="border-t border-white/5 bg-[#050505] px-6 py-24 md:px-[10vw]">
            <Reveal class="mx-auto max-w-5xl">
              <h3 class="mb-10 text-xs tracking-[0.5em] text-white/50 uppercase">06 / Demo Video</h3>
              <div class="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
                <video src="/videos/demo.mp4" autoplay loop muted playsinline class="h-full w-full object-contain opacity-80 transition-opacity duration-500 hover:opacity-100" />
              </div>
            </Reveal>
          </section>
        </Show>

        <section class="flex justify-center px-6 py-40 text-center">
          <Link href="/" class="group cursor-pointer">
            <Reveal>
              <h2 class="text-3xl font-extralight tracking-widest text-white/50 uppercase transition-colors duration-500 group-hover:text-white md:text-6xl">
                Back to Projects
              </h2>
              <div class="mx-auto mt-8 h-[1px] w-0 bg-white transition-all duration-500 group-hover:w-32" />
            </Reveal>
          </Link>
        </section>
      </main>
    </div>
  );
}

function CaseSection(props) {
  return (
    <section class={`border-t border-white/5 px-6 py-24 md:px-[10vw] ${props.tone || "bg-black"}`}>
      <Reveal class="mx-auto max-w-4xl">
        <h3 class="mb-10 text-xs tracking-[0.5em] text-white/50 uppercase">
          {props.index} / {props.title}
        </h3>
        <p class="whitespace-pre-line text-base leading-relaxed font-light text-gray-300 md:text-lg">{props.children}</p>
      </Reveal>
    </section>
  );
}

function ContactPage() {
  return (
    <div class="min-h-screen bg-[#0a0a0a]">
      <ScrollStack
        useWindowScroll={true}
        itemDistance={1000}
        itemStackDistance={30}
        stackPosition="20%"
        baseScale={0.85}
        rotationAmount={0}
        blurAmount={0}
      >
        <ScrollStackItem itemClassName="bg-neutral-900 border border-neutral-800 text-white flex flex-col justify-center items-center text-center">
          <h2 class="mb-4 text-4xl font-bold">Card 1</h2>
          <p class="text-neutral-400">This is the first card in the stack</p>
        </ScrollStackItem>
        <ScrollStackItem itemClassName="bg-neutral-800 border border-neutral-700 text-white flex flex-col justify-center items-center text-center">
          <h2 class="mb-4 text-4xl font-bold">Card 2</h2>
          <p class="text-neutral-400">This is the second card in the stack</p>
        </ScrollStackItem>
        <ScrollStackItem itemClassName="bg-neutral-700 border border-neutral-600 text-white flex flex-col justify-center items-center text-center">
          <h2 class="mb-4 text-4xl font-bold">Card 3</h2>
          <p class="text-neutral-400">This is the third card in the stack</p>
        </ScrollStackItem>
      </ScrollStack>
    </div>
  );
}
