'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { PHOTOS } from './content';

/* ─────────────────────────────────────────────────────────────────────────────
   APPLE-STYLE ANIMATION PHILOSOPHY:
   • Scroll-driven reveals: elements animate exactly as you scroll past them
   • Spring physics: cubic-bezier(0.25, 0.46, 0.45, 0.94) — Apple's signature ease
   • Staggered text: characters/words appear in cascading waves
   • Sticky cinematic sections: content pins while background transforms
   • Momentum parallax: multi-layer depth on scroll
   • Scale + blur entrance: items scale from 0.88 + blur → 1 + sharp (like macOS Spring)
   • Opacity-led transitions: fade always leads, motion follows
───────────────────────────────────────────────────────────────────────────── */

// Apple spring easing
const SPRING = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";
const SPRING_BOUNCY = "cubic-bezier(0.34, 1.56, 0.64, 1)";
const DECEL = "cubic-bezier(0.0, 0.0, 0.2, 1)";

const CLIENTS = ["Vogue", "National Geographic", "Apple", "Rolex", "Dior", "CNN"];

/* ─── Global Styles ─────────────────────────────────────────────────────────── */
const GlobalStyles = () => (
	<style>{`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Bebas+Neue&family=DM+Serif+Display:ital@0;1&display=swap');
    *, *::before, *::after { box-sizing: border-box; }
    html { scroll-behavior: auto; }
    body { margin: 0; background: #000; overflow-x: hidden; }
    ::placeholder { color: rgba(255,255,255,0.2); }
    ::-webkit-scrollbar { width: 2px; }
    ::-webkit-scrollbar-track { background: #000; }
    ::-webkit-scrollbar-thumb { background: #A3FF12; border-radius: 2px; }

    /* Apple-style keyframes */
    @keyframes heroReveal {
      0%   { opacity: 0; transform: translateY(60px) scale(0.95); filter: blur(8px); }
      100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0px); }
    }
    @keyframes fadeUp {
      0%   { opacity: 0; transform: translateY(30px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    @keyframes scaleIn {
      0%   { opacity: 0; transform: scale(0.88); filter: blur(6px); }
      100% { opacity: 1; transform: scale(1); filter: blur(0px); }
    }
    @keyframes slideInLeft {
      0%   { opacity: 0; transform: translateX(-40px); }
      100% { opacity: 1; transform: translateX(0); }
    }
    @keyframes charReveal {
      0%   { opacity: 0; transform: translateY(100%) rotateX(-30deg); }
      100% { opacity: 1; transform: translateY(0) rotateX(0deg); }
    }
    @keyframes lineGrow {
      0%   { transform: scaleX(0); transform-origin: left; }
      100% { transform: scaleX(1); transform-origin: left; }
    }
    @keyframes counterUp {
      0%   { opacity: 0; transform: translateY(20px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    @keyframes glowPulse {
      0%, 100% { box-shadow: 0 0 20px rgba(163,255,18,0.15); }
      50%       { box-shadow: 0 0 40px rgba(163,255,18,0.35); }
    }
    @keyframes marqueeScroll {
      0%   { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    @keyframes scrollDot {
      0%   { opacity: 0; transform: translateY(0); }
      30%  { opacity: 1; }
      100% { opacity: 0; transform: translateY(20px); }
    }
    @keyframes shimmer {
      0%   { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    .apple-reveal {
      opacity: 0;
      transform: translateY(40px) scale(0.96);
      filter: blur(4px);
      transition: opacity 0.9s ${SPRING}, transform 0.9s ${SPRING}, filter 0.9s ${SPRING};
    }
    .apple-reveal.visible {
      opacity: 1;
      transform: translateY(0) scale(1);
      filter: blur(0px);
    }
    .apple-reveal-left {
      opacity: 0;
      transform: translateX(-50px);
      transition: opacity 0.8s ${SPRING}, transform 0.8s ${SPRING};
    }
    .apple-reveal-left.visible { opacity: 1; transform: translateX(0); }

    .apple-scale-reveal {
      opacity: 0;
      transform: scale(0.9);
      filter: blur(8px);
      transition: opacity 1s ${DECEL}, transform 1s ${DECEL}, filter 1s ${DECEL};
    }
    .apple-scale-reveal.visible { opacity: 1; transform: scale(1); filter: blur(0px); }

    .char-wrap { overflow: hidden; display: inline-block; }
    .char {
      display: inline-block;
      opacity: 0;
      transform: translateY(110%);
      transition: opacity 0.5s ${SPRING}, transform 0.5s ${SPRING};
    }
    .char.visible { opacity: 1; transform: translateY(0); }

    .img-hover-zoom {
      overflow: hidden;
    }
    .img-hover-zoom img {
      transition: transform 0.8s ${SPRING}, filter 0.5s ease;
      will-change: transform;
    }
    .img-hover-zoom:hover img {
      transform: scale(1.06);
      filter: brightness(0.72);
    }

    .neon-btn {
      position: relative;
      overflow: hidden;
      background: transparent;
      border: 1px solid #A3FF12;
      color: #A3FF12;
      cursor: pointer;
      transition: color 0.35s ease;
      z-index: 0;
    }
    .neon-btn::before {
      content: '';
      position: absolute; inset: 0;
      background: #A3FF12;
      transform: translateY(100%);
      transition: transform 0.35s ${SPRING};
      z-index: -1;
    }
    .neon-btn:hover::before { transform: translateY(0); }
    .neon-btn:hover { color: #000; }
    .neon-btn:active { transform: scale(0.97); }

    .nav-link {
      position: relative;
      background: none; border: none; cursor: pointer;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 12px; letter-spacing: 2.5px;
      text-transform: uppercase; transition: color 0.3s ease;
      padding-bottom: 4px;
    }
    .nav-link::after {
      content: '';
      position: absolute; bottom: 0; left: 0; right: 0;
      height: 1px; background: #A3FF12;
      transform: scaleX(0); transform-origin: right;
      transition: transform 0.35s ${SPRING};
    }
    .nav-link:hover::after, .nav-link.active::after {
      transform: scaleX(1); transform-origin: left;
    }
  `}</style>
);

/* ─── useScrollReveal hook ──────────────────────────────────────────────────── */
function useScrollReveal(threshold = 0.12) {
	const ref = useRef(null);
	const [visible, setVisible] = useState(false);
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const obs = new IntersectionObserver(([entry]) => {
			if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
		}, { threshold });
		obs.observe(el);
		return () => obs.disconnect();
	}, [threshold]);
	return [ref, visible];
}

/* ─── AnimatedText: Apple char-by-char reveal ──────────────────────────────── */
function AnimatedText({ text, tag: Tag = "h1", style = {}, delay = 0, className = "", splitBy = "char" }) {
	const [ref, visible] = useScrollReveal(0.1);
	const items = splitBy === "word" ? text.split(" ") : text.split("");

	return (
		<Tag ref={ref} style={style} className={className}>
			{items.map((item, i) => (
				<span key={i} className="char-wrap">
          <span
			  className={`char ${visible ? "visible" : ""}`}
			  style={{ transitionDelay: `${delay + i * (splitBy === "word" ? 60 : 25)}ms` }}
		  >{item}{splitBy === "word" ? "\u00A0" : ""}</span>
        </span>
			))}
		</Tag>
	);
}

/* ─── ScrollLine: animated reveal line ─────────────────────────────────────── */
function RevealLine({ delay = 0 }) {
	const [ref, visible] = useScrollReveal();
	return (
		<div ref={ref} style={{
			height: 1, background: "rgba(255,255,255,0.12)", overflow: "hidden",
		}}>
			<div style={{
				height: "100%", background: "#A3FF12",
				transform: visible ? "scaleX(1)" : "scaleX(0)",
				transformOrigin: "left",
				transition: `transform 1.2s ${SPRING} ${delay}ms`,
			}} />
		</div>
	);
}

/* ─── Custom Cursor ─────────────────────────────────────────────────────────── */
function Cursor() {
	const ringRef = useRef(null);
	const dotRef = useRef(null);
	const labelRef = useRef(null);
	const pos = useRef({ x: -100, y: -100 });
	const target = useRef({ x: -100, y: -100 });
	const [label, setLabel] = useState("");

	useEffect(() => {
		const onMove = (e) => {
			target.current = { x: e.clientX, y: e.clientY };
			if (dotRef.current) dotRef.current.style.transform = `translate(${e.clientX - 4}px, ${e.clientY - 4}px)`;
		};
		window.addEventListener("mousemove", onMove);
		let raf;
		const animate = () => {
			pos.current.x += (target.current.x - pos.current.x) * 0.1;
			pos.current.y += (target.current.y - pos.current.y) * 0.1;
			if (ringRef.current) ringRef.current.style.transform = `translate(${pos.current.x - 20}px, ${pos.current.y - 20}px)`;
			raf = requestAnimationFrame(animate);
		};
		raf = requestAnimationFrame(animate);

		const expand = (e) => {
			if (ringRef.current) {
				ringRef.current.style.width = "56px";
				ringRef.current.style.height = "56px";
				ringRef.current.style.background = "rgba(163,255,18,0.1)";
				ringRef.current.style.borderColor = "#A3FF12";
			}
			const lbl = e.currentTarget.dataset.cursor;
			if (lbl) setLabel(lbl);
		};
		const shrink = () => {
			if (ringRef.current) {
				ringRef.current.style.width = "40px";
				ringRef.current.style.height = "40px";
				ringRef.current.style.background = "transparent";
			}
			setLabel("");
		};
		document.querySelectorAll("[data-cursor], a, button").forEach(el => {
			el.addEventListener("mouseenter", expand);
			el.addEventListener("mouseleave", shrink);
		});
		return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
	}, []);

	return (
		<>
			<div ref={dotRef} style={{ position: "fixed", top: 0, left: 0, width: 8, height: 8, background: "#A3FF12", borderRadius: "50%", pointerEvents: "none", zIndex: 9999, willChange: "transform" }} />
			<div ref={ringRef} style={{
				position: "fixed", top: 0, left: 0, width: 40, height: 40,
				border: "1.5px solid rgba(163,255,18,0.5)", borderRadius: "50%",
				pointerEvents: "none", zIndex: 9998, willChange: "transform",
				display: "flex", alignItems: "center", justifyContent: "center",
				transition: `width 0.4s ${SPRING}, height 0.4s ${SPRING}, background 0.3s ease, border-color 0.3s ease`,
			}}>
				{label && <span ref={labelRef} style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 8, letterSpacing: 1, color: "#A3FF12", textTransform: "uppercase", whiteSpace: "nowrap" }}>{label}</span>}
			</div>
		</>
	);
}

/* ─── Neon Button ───────────────────────────────────────────────────────────── */
function NeonButton({ children, onClick, small, style: extraStyle = {} }) {
	return (
		<button onClick={onClick} className="neon-btn" style={{
			fontFamily: "'Space Grotesk', sans-serif",
			fontSize: small ? 11 : 12, letterSpacing: 3,
			textTransform: "uppercase", fontWeight: 600,
			padding: small ? "10px 22px" : "15px 36px",
			...extraStyle,
		}}>{children}</button>
	);
}

/* ─── Navbar ────────────────────────────────────────────────────────────────── */
function Navbar({ page, setPage }) {
	const [scrolled, setScrolled] = useState(false);
	const [entered, setEntered] = useState(false);
	useEffect(() => {
		setTimeout(() => setEntered(true), 300);
		const fn = () => setScrolled(window.scrollY > 60);
		window.addEventListener("scroll", fn, { passive: true });
		return () => window.removeEventListener("scroll", fn);
	}, []);

	return (
		<nav style={{
			position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
			padding: "0 48px", height: 64,
			display: "flex", alignItems: "center", justifyContent: "space-between",
			background: scrolled ? "rgba(0,0,0,0.82)" : "transparent",
			backdropFilter: scrolled ? "blur(24px) saturate(180%)" : "none",
			WebkitBackdropFilter: scrolled ? "blur(24px) saturate(180%)" : "none",
			borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
			transition: `background 0.6s ${SPRING}, backdrop-filter 0.6s, border-color 0.6s`,
			opacity: entered ? 1 : 0,
			transform: entered ? "translateY(0)" : "translateY(-100%)",
		}}>
			<button onClick={() => setPage("home")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 5, color: "#A3FF12", transition: `opacity 0.3s` }}
					onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
					onMouseLeave={e => e.currentTarget.style.opacity = "1"}
			>ALEKSEI·LENS</button>
			<div style={{ display: "flex", gap: 40 }}>
				{["Portfolio", "About", "Contact"].map(l => (
					<button key={l} onClick={() => setPage(l.toLowerCase())}
							className={`nav-link ${page === l.toLowerCase() ? "active" : ""}`}
							style={{ color: page === l.toLowerCase() ? "#A3FF12" : "rgba(255,255,255,0.55)" }}
					>{l}</button>
				))}
			</div>
		</nav>
	);
}

/* ─── Hero with Apple-style cinematic entrance ──────────────────────────────── */
function Hero({ setPage }) {
	const [phase, setPhase] = useState(0); // 0=loading, 1=img, 2=text, 3=cta
	const parallaxRef = useRef(null);
	const scrollProgress = useRef(0);

	useEffect(() => {
		const t1 = setTimeout(() => setPhase(1), 100);
		const t2 = setTimeout(() => setPhase(2), 900);
		const t3 = setTimeout(() => setPhase(3), 1600);

		const onScroll = () => {
			const p = window.scrollY / window.innerHeight;
			scrollProgress.current = p;
			if (parallaxRef.current) {
				parallaxRef.current.style.transform = `translateY(${window.scrollY * 0.35}px) scale(${1 + p * 0.05})`;
			}
		};
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); window.removeEventListener("scroll", onScroll); };
	}, []);

	const words = ["PHOTOGRAPHY", "THAT", "TELLS", "STORIES"];

	return (
		<section style={{ position: "relative", height: "100vh", overflow: "hidden", background: "#000" }}>
			{/* Parallax image */}
			<div ref={parallaxRef} style={{ position: "absolute", inset: "-12%", willChange: "transform" }}>
				<img
					src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1800&q=85"
					alt="Hero"
					style={{
						width: "100%", height: "100%", objectFit: "cover",
						opacity: phase >= 1 ? 0.5 : 0,
						filter: phase >= 1 ? "blur(0px)" : "blur(12px)",
						transform: phase >= 1 ? "scale(1)" : "scale(1.08)",
						transition: `opacity 2s ${SPRING}, filter 1.5s ${SPRING}, transform 2s ${SPRING}`,
					}}
				/>
			</div>

			{/* Gradient vignette */}
			<div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 30%, rgba(0,0,0,0.6) 100%)" }} />
			<div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, transparent 40%, rgba(0,0,0,0.85) 100%)" }} />

			{/* Neon glow accent */}
			<div style={{ position: "absolute", bottom: "30%", left: "50%", transform: "translateX(-50%)", width: 300, height: 1, background: "linear-gradient(to right, transparent, rgba(163,255,18,0.4), transparent)", opacity: phase >= 2 ? 0.6 : 0, transition: "opacity 1s ease 1.8s" }} />

			{/* Hero content */}
			<div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 56px 88px" }}>
				{/* Eyebrow */}
				<div style={{
					fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, letterSpacing: 7,
					color: "#A3FF12", textTransform: "uppercase", marginBottom: 32,
					opacity: phase >= 2 ? 1 : 0,
					transform: phase >= 2 ? "translateY(0)" : "translateY(16px)",
					transition: `all 0.8s ${SPRING} 0.8s`,
				}}>Visual Storyteller · Est. 2012</div>

				{/* Big title — word by word */}
				<div style={{ overflow: "hidden" }}>
					<div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(68px, 11vw, 148px)", lineHeight: 0.88, letterSpacing: 2, userSelect: "none" }}>
						{words.map((word, i) => (
							<div key={word} style={{ overflow: "hidden", display: "inline-block", marginRight: i < 2 ? "0.25em" : 0 }}>
                <span style={{
					display: "inline-block",
					color: i === 2 ? "transparent" : "#fff",
					WebkitTextStroke: i === 2 ? "1px rgba(255,255,255,0.3)" : "none",
					fontStyle: i === 2 ? "italic" : "normal",
					opacity: phase >= 2 ? 1 : 0,
					transform: phase >= 2 ? "translateY(0)" : "translateY(105%)",
					transition: `opacity 0.7s ${SPRING} ${0.9 + i * 0.1}s, transform 0.7s ${SPRING} ${0.9 + i * 0.1}s`,
				}}>{word}</span>
								{i === 1 && <br />}
							</div>
						))}
					</div>
				</div>

				{/* CTA row */}
				<div style={{
					marginTop: 56, display: "flex", alignItems: "center", gap: 40,
					opacity: phase >= 3 ? 1 : 0,
					transform: phase >= 3 ? "translateY(0)" : "translateY(24px)",
					transition: `all 0.9s ${SPRING}`,
				}}>
					<NeonButton onClick={() => setPage("portfolio")}>View Portfolio</NeonButton>
					<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
						<div style={{ width: 32, height: 1, background: "rgba(255,255,255,0.25)" }} />
						<span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, letterSpacing: 3, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>40+ Countries</span>
					</div>
				</div>
			</div>

			{/* Scroll indicator — Apple style pill */}
			<div style={{ position: "absolute", bottom: 36, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, opacity: phase >= 3 ? 0.8 : 0, transition: "opacity 1s ease 2s" }}>
				<div style={{ width: 22, height: 36, border: "1.5px solid rgba(255,255,255,0.2)", borderRadius: 12, display: "flex", justifyContent: "center", paddingTop: 6 }}>
					<div style={{ width: 3, height: 8, background: "#A3FF12", borderRadius: 2, animation: "scrollDot 1.8s ease-in-out infinite" }} />
				</div>
			</div>
		</section>
	);
}

/* ─── Sticky Scroll Feature Section (Apple iPhone-style) ────────────────────── */
function StickyFeature({ setPage }) {
	const containerRef = useRef(null);
	const [progress, setProgress] = useState(0);

	const features = [
		{ label: "Landscape", img: PHOTOS[0].thumb, stat: "40+ Countries" },
		{ label: "Portraiture", img: PHOTOS[1].thumb, stat: "500+ Sessions" },
		{ label: "Fine Art", img: PHOTOS[2].thumb, stat: "12 Years" },
	];

	useEffect(() => {
		const onScroll = () => {
			const el = containerRef.current;
			if (!el) return;
			const { top, height } = el.getBoundingClientRect();
			const p = Math.max(0, Math.min(1, -top / (height - window.innerHeight)));
			setProgress(p);
		};
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	const activeIdx = Math.min(2, Math.floor(progress * 3));
	const subProgress = (progress * 3) % 1;

	return (
		<div ref={containerRef} style={{ height: "350vh", position: "relative" }}>
			<div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
				{/* Background image crossfade */}
				{features.map((f, i) => (
					<div key={i} style={{
						position: "absolute", inset: 0,
						opacity: i === activeIdx ? 0.4 : 0,
						transition: `opacity 0.8s ${SPRING}`,
					}}>
						<img src={f.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(30%)" }} />
						<div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.7))" }} />
					</div>
				))}

				{/* Center content */}
				<div style={{ position: "relative", textAlign: "center", zIndex: 2, maxWidth: 800 }}>
					<div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, letterSpacing: 6, color: "#A3FF12", textTransform: "uppercase", marginBottom: 24 }}>
						Specializations
					</div>
					{features.map((f, i) => (
						<div key={i} style={{
							position: "absolute", top: "50%", left: "50%",
							transform: `translate(-50%, -50%) translateY(${i === activeIdx ? 0 : i < activeIdx ? -60 : 60}px)`,
							opacity: i === activeIdx ? 1 : 0,
							transition: `all 0.7s ${SPRING}`,
							width: "100%", textAlign: "center",
						}}>
							<div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(64px, 12vw, 140px)", lineHeight: 0.88, color: "#fff", letterSpacing: 2 }}>{f.label}</div>
							<div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, letterSpacing: 4, color: "rgba(255,255,255,0.4)", marginTop: 16, textTransform: "uppercase" }}>{f.stat}</div>
						</div>
					))}
					<div style={{ height: 180 }} /> {/* spacer for absolute positioned items */}
				</div>

				{/* Progress dots */}
				<div style={{ position: "absolute", bottom: 48, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 10 }}>
					{features.map((_, i) => (
						<div key={i} style={{
							width: i === activeIdx ? 28 : 8, height: 8, borderRadius: 4,
							background: i === activeIdx ? "#A3FF12" : "rgba(255,255,255,0.2)",
							transition: `all 0.4s ${SPRING}`,
						}} />
					))}
				</div>
			</div>
		</div>
	);
}

/* ─── Photo Card ─────────────────────────────────────────────────────────────── */
function PhotoCard({ photo, idx, visible, onClick }) {
	const [hov, setHov] = useState(false);
	return (
		<div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
			 data-cursor="View"
			 style={{
				 position: "relative", overflow: "hidden", cursor: "none",
				 aspectRatio: photo.h === "tall" ? "3/4" : photo.h === "short" ? "4/3" : "1/1",
				 opacity: visible ? 1 : 0,
				 transform: visible ? "translateY(0) scale(1)" : "translateY(40px) scale(0.95)",
				 filter: visible ? "blur(0px)" : "blur(6px)",
				 transition: `opacity 0.8s ${SPRING} ${idx * 80}ms, transform 0.8s ${SPRING} ${idx * 80}ms, filter 0.8s ${SPRING} ${idx * 80}ms`,
			 }}>
			<img src={photo.thumb} alt={photo.title} style={{
				width: "100%", height: "100%", objectFit: "cover",
				transform: hov ? "scale(1.07)" : "scale(1)",
				filter: hov ? "brightness(0.6) saturate(0.8)" : "brightness(0.9)",
				transition: `transform 0.9s ${SPRING}, filter 0.5s ease`,
			}} />

			{/* Overlay */}
			<div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 55%)", opacity: hov ? 1 : 0, transition: `opacity 0.5s ease` }} />

			{/* Category tag */}
			<div style={{
				position: "absolute", top: 16, left: 16,
				fontFamily: "'Space Grotesk', sans-serif", fontSize: 9, letterSpacing: 3,
				color: "#A3FF12", textTransform: "uppercase",
				background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
				padding: "5px 10px",
				opacity: hov ? 1 : 0, transform: hov ? "translateY(0)" : "translateY(-8px)",
				transition: `all 0.4s ${SPRING} 0.05s`,
			}}>{photo.category}</div>

			{/* Bottom info */}
			<div style={{
				position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 20px 20px",
				transform: hov ? "translateY(0)" : "translateY(20px)",
				opacity: hov ? 1 : 0,
				transition: `all 0.45s ${SPRING}`,
			}}>
				<p style={{ margin: "0 0 4px", fontFamily: "'DM Serif Display', serif", fontSize: 20, fontStyle: "italic" }}>{photo.title}</p>
				<p style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: 1 }}>{photo.location}</p>
			</div>
		</div>
	);
}

/* ─── Marquee clients strip ──────────────────────────────────────────────────── */
function MarqueeClients() {
	const doubled = [...CLIENTS, ...CLIENTS, ...CLIENTS, ...CLIENTS];
	return (
		<div style={{ overflow: "hidden", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "28px 0", position: "relative" }}>
			<div style={{ display: "flex", gap: 80, animation: "marqueeScroll 18s linear infinite", width: "max-content" }}>
				{doubled.map((c, i) => (
					<span key={i} style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: 4, color: "rgba(255,255,255,0.12)", flexShrink: 0 }}>{c}</span>
				))}
			</div>
			{/* Fade edges */}
			<div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, #000 0%, transparent 15%, transparent 85%, #000 100%)", pointerEvents: "none" }} />
		</div>
	);
}

/* ─── Home Page ──────────────────────────────────────────────────────────────── */
function HomePage({ setPage, setSelectedPhoto }) {
	const [visibleCards, setVisibleCards] = useState([]);
	const cardRefs = useRef([]);
	const [aboutRef, aboutVisible] = useScrollReveal(0.15);
	const [statsRef, statsVisible] = useScrollReveal(0.2);

	useEffect(() => {
		const obs = new IntersectionObserver(entries => {
			entries.forEach(e => { if (e.isIntersecting) setVisibleCards(v => [...v, +e.target.dataset.idx]); });
		}, { threshold: 0.08 });
		cardRefs.current.forEach(r => r && obs.observe(r));
		return () => obs.disconnect();
	}, []);

	return (
		<div style={{ background: "#000", color: "#fff" }}>
			<Hero setPage={setPage} />

			{/* Sticky feature */}
			<StickyFeature setPage={setPage} />

			{/* Selected works */}
			<section style={{ padding: "120px 56px" }}>
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 72 }}>
					<div>
						<div className="apple-reveal" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, letterSpacing: 6, color: "#A3FF12", textTransform: "uppercase", marginBottom: 18 }}>Selected Works</div>
						<AnimatedText text="RECENT" tag="div" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(48px, 7vw, 96px)", lineHeight: 0.88, margin: 0 }} splitBy="char" />
						<AnimatedText text="PROJECTS" tag="div" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(48px, 7vw, 96px)", lineHeight: 0.88, margin: 0 }} delay={200} splitBy="char" />
					</div>
					<div className="apple-reveal" style={{ animationDelay: "200ms" }}>
						<NeonButton onClick={() => setPage("portfolio")} small>All Works →</NeonButton>
					</div>
				</div>

				<div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
					{PHOTOS.slice(0, 6).map((p, i) => (
						<div key={p.id} data-idx={i} ref={el => cardRefs.current[i] = el}>
							<PhotoCard photo={p} idx={i} visible={visibleCards.includes(i)} onClick={() => { setSelectedPhoto(p); setPage("project"); }} />
						</div>
					))}
				</div>
			</section>

			<RevealLine />

			{/* About teaser */}
			<section ref={aboutRef} style={{ padding: "120px 56px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 88, alignItems: "center" }}>
				<div>
					<div style={{
						fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, letterSpacing: 6, color: "#A3FF12", textTransform: "uppercase", marginBottom: 24,
						opacity: aboutVisible ? 1 : 0, transform: aboutVisible ? "translateY(0)" : "translateY(20px)",
						transition: `all 0.7s ${SPRING}`,
					}}>About the Artist</div>
					<div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(36px, 4vw, 54px)", lineHeight: 1.1, fontStyle: "italic", marginBottom: 32, overflow: "hidden" }}>
						{["Light is my", "language."].map((line, i) => (
							<div key={i} style={{ overflow: "hidden" }}>
								<div style={{
									opacity: aboutVisible ? 1 : 0, transform: aboutVisible ? "translateY(0)" : "translateY(100%)",
									transition: `all 0.8s ${SPRING} ${i * 120 + 100}ms`,
								}}>{line}</div>
							</div>
						))}
					</div>
					<p style={{
						fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, color: "rgba(255,255,255,0.45)", lineHeight: 1.95, marginBottom: 44, maxWidth: 460,
						opacity: aboutVisible ? 1 : 0, transform: aboutVisible ? "translateY(0)" : "translateY(24px)",
						transition: `all 0.9s ${SPRING} 0.4s`,
					}}>
						I'm Aleksei Voronov — a documentary and fine-art photographer based between Moscow and Tokyo. For over a decade I've chased light across five continents, turning fleeting moments into timeless images.
					</p>
					<div style={{ opacity: aboutVisible ? 1 : 0, transform: aboutVisible ? "scale(1)" : "scale(0.9)", transition: `all 0.7s ${SPRING_BOUNCY} 0.6s` }}>
						<NeonButton onClick={() => setPage("about")} small>Read More</NeonButton>
					</div>
				</div>

				<div style={{ position: "relative", opacity: aboutVisible ? 1 : 0, transform: aboutVisible ? "translateX(0) scale(1)" : "translateX(40px) scale(0.96)", filter: aboutVisible ? "blur(0)" : "blur(6px)", transition: `all 1s ${SPRING} 0.3s` }}>
					<img src="https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=600&q=80" alt="About" style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover" }} />
					<div style={{
						position: "absolute", bottom: -20, left: -20, background: "#A3FF12", padding: "18px 26px",
						animation: aboutVisible ? "glowPulse 3s ease-in-out infinite" : "none",
					}}>
						<p style={{ margin: 0, fontFamily: "'Bebas Neue', sans-serif", fontSize: 44, color: "#000", lineHeight: 1 }}>40+</p>
						<p style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "rgba(0,0,0,0.6)" }}>Countries</p>
					</div>
				</div>
			</section>

			{/* Stats bar */}
			<section ref={statsRef} style={{ padding: "0 56px 100px" }}>
				<div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
					{[["12", "Years Active"], ["40+", "Countries"], ["200+", "Projects"], ["15", "Awards"]].map(([n, l], i) => (
						<div key={l} style={{
							padding: "48px 0", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none",
							textAlign: "center",
							opacity: statsVisible ? 1 : 0, transform: statsVisible ? "translateY(0)" : "translateY(30px)",
							transition: `all 0.8s ${SPRING} ${i * 100}ms`,
						}}>
							<div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 72, color: "#A3FF12", lineHeight: 1, marginBottom: 8 }}>{n}</div>
							<div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, letterSpacing: 3, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>{l}</div>
						</div>
					))}
				</div>
			</section>

			<MarqueeClients />
			<Footer setPage={setPage} />
		</div>
	);
}

/* ─── Portfolio Page ─────────────────────────────────────────────────────────── */
function PortfolioPage({ setPage, setSelectedPhoto }) {
	const [filter, setFilter] = useState("All");
	const [visible, setVisible] = useState([]);
	const [titleRef, titleVisible] = useScrollReveal(0.1);
	const categories = ["All", ...Array.from(new Set(PHOTOS.map(p => p.category)))];
	const filtered = filter === "All" ? PHOTOS : PHOTOS.filter(p => p.category === filter);

	useEffect(() => {
		setVisible([]);
		filtered.forEach((_, i) => setTimeout(() => setVisible(v => [...v, i]), 60 + i * 80));
	}, [filter]);

	return (
		<div style={{ background: "#000", color: "#fff", minHeight: "100vh", paddingTop: 100 }}>
			<div ref={titleRef} style={{ padding: "56px 56px 64px" }}>
				<div style={{
					fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, letterSpacing: 6, color: "#A3FF12", textTransform: "uppercase", marginBottom: 18,
					opacity: titleVisible ? 1 : 0, transform: titleVisible ? "translateY(0)" : "translateY(16px)",
					transition: `all 0.7s ${SPRING}`,
				}}>Portfolio</div>
				<div style={{ overflow: "hidden", marginBottom: 40 }}>
					<div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(64px, 10vw, 128px)", lineHeight: 0.88, opacity: titleVisible ? 1 : 0, transform: titleVisible ? "translateY(0)" : "translateY(80px)", filter: titleVisible ? "blur(0)" : "blur(8px)", transition: `all 0.9s ${SPRING} 0.1s` }}>ALL WORKS</div>
				</div>
				{/* Filter pills */}
				<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
					{categories.map((c, i) => (
						<button key={c} onClick={() => setFilter(c)} style={{
							background: filter === c ? "#A3FF12" : "transparent",
							border: "1px solid", borderColor: filter === c ? "#A3FF12" : "rgba(255,255,255,0.15)",
							color: filter === c ? "#000" : "rgba(255,255,255,0.4)",
							fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, letterSpacing: 2,
							textTransform: "uppercase", padding: "8px 18px", cursor: "pointer",
							transition: `all 0.35s ${SPRING}`,
							transform: titleVisible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.9)",
							opacity: titleVisible ? 1 : 0,
							transitionDelay: `${0.3 + i * 0.05}s`,
						}}>{c}</button>
					))}
				</div>
			</div>

			<div style={{ padding: "0 56px 120px", columns: "3 280px", gap: 14 }}>
				{filtered.map((p, i) => (
					<div key={p.id}
						 onClick={() => { setSelectedPhoto(p); setPage("project"); }}
						 style={{
							 breakInside: "avoid", marginBottom: 14, cursor: "none", position: "relative", overflow: "hidden",
							 opacity: visible.includes(i) ? 1 : 0,
							 transform: visible.includes(i) ? "translateY(0) scale(1)" : "translateY(28px) scale(0.94)",
							 filter: visible.includes(i) ? "blur(0)" : "blur(4px)",
							 transition: `all 0.7s ${SPRING}`,
						 }}
						 data-cursor="Open"
					>
						<img src={p.thumb} alt={p.title} style={{ width: "100%", display: "block", transition: `transform 0.8s ${SPRING}, filter 0.5s ease` }}
							 onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.filter = "brightness(0.65)"; }}
							 onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.filter = "brightness(1)"; }}
						/>
					</div>
				))}
			</div>
			<Footer setPage={setPage} />
		</div>
	);
}

/* ─── Project Page ───────────────────────────────────────────────────────────── */
function ProjectPage({ photo, setPage }) {
	const [imgLoaded, setImgLoaded] = useState(false);
	const [contentVisible, setContentVisible] = useState(false);
	const parallaxRef = useRef(null);

	useEffect(() => {
		setImgLoaded(false); setContentVisible(false);
		const t = setTimeout(() => setImgLoaded(true), 100);
		const t2 = setTimeout(() => setContentVisible(true), 900);
		const onScroll = () => { if (parallaxRef.current) parallaxRef.current.style.transform = `translateY(${window.scrollY * 0.3}px)`; };
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => { clearTimeout(t); clearTimeout(t2); window.removeEventListener("scroll", onScroll); };
	}, [photo?.id]);

	if (!photo) return null;
	const related = PHOTOS.filter(p => p.id !== photo.id && p.category === photo.category).slice(0, 3);

	return (
		<div style={{ background: "#000", color: "#fff", minHeight: "100vh" }}>
			{/* Hero fullscreen */}
			<div style={{ position: "relative", height: "92vh", overflow: "hidden" }}>
				<div ref={parallaxRef} style={{ position: "absolute", inset: "-10%", willChange: "transform" }}>
					<img src={photo.src} alt={photo.title}
						 onLoad={() => setImgLoaded(true)}
						 style={{ width: "100%", height: "100%", objectFit: "cover",
							 opacity: imgLoaded ? 0.8 : 0,
							 transform: imgLoaded ? "scale(1)" : "scale(1.08)",
							 filter: imgLoaded ? "blur(0)" : "blur(16px)",
							 transition: `opacity 1.5s ${SPRING}, transform 1.8s ${SPRING}, filter 1.5s ${SPRING}`,
						 }} />
				</div>
				<div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 40%, rgba(0,0,0,0.85) 100%)" }} />

				<button onClick={() => setPage("portfolio")} style={{
					position: "absolute", top: 88, left: 56, background: "none",
					border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.55)",
					fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, letterSpacing: 3,
					textTransform: "uppercase", padding: "10px 20px", cursor: "pointer",
					transition: `all 0.35s ${SPRING}`,
					opacity: contentVisible ? 1 : 0, transform: contentVisible ? "translateX(0)" : "translateX(-20px)",
				}}
						onMouseEnter={e => { e.currentTarget.style.borderColor = "#A3FF12"; e.currentTarget.style.color = "#A3FF12"; }}
						onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}
				>← Back</button>

				<div style={{ position: "absolute", bottom: 72, left: 56 }}>
					<div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, letterSpacing: 5, color: "#A3FF12", textTransform: "uppercase", marginBottom: 16, opacity: contentVisible ? 1 : 0, transform: contentVisible ? "translateY(0)" : "translateY(20px)", transition: `all 0.7s ${SPRING} 0.1s` }}>{photo.category}</div>
					<div style={{ overflow: "hidden" }}>
						<div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(56px, 9vw, 120px)", lineHeight: 0.88, opacity: contentVisible ? 1 : 0, transform: contentVisible ? "translateY(0)" : "translateY(60px)", filter: contentVisible ? "blur(0)" : "blur(8px)", transition: `all 0.9s ${SPRING} 0.25s` }}>{photo.title}</div>
					</div>
				</div>
			</div>

			{/* Details */}
			<section style={{ padding: "88px 56px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 88 }}>
				<div className="apple-reveal">
					<h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 34, fontStyle: "italic", margin: "0 0 28px" }}>About this work</h3>
					<p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, color: "rgba(255,255,255,0.48)", lineHeight: 1.95 }}>
						This image was captured during golden hour, when light transforms the ordinary into the extraordinary. Every detail — the texture, the shadow, the breath of atmosphere — was carefully considered to create a visual narrative that lingers long after the moment passes.
					</p>
				</div>
				<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
					{[["Location", photo.location], ["Camera", photo.camera], ["Year", photo.year], ["Category", photo.category]].map(([k, v], i) => (
						<div key={k} className="apple-reveal" style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 24, transitionDelay: `${i * 80}ms` }}>
							<p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, letterSpacing: 3, color: "#A3FF12", textTransform: "uppercase", marginBottom: 10 }}>{k}</p>
							<p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, margin: 0 }}>{v}</p>
						</div>
					))}
				</div>
			</section>

			{related.length > 0 && (
				<section style={{ padding: "0 56px 120px" }}>
					<RevealLine />
					<div style={{ margin: "64px 0 32px", fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, letterSpacing: 5, color: "#A3FF12", textTransform: "uppercase" }}>Related Works</div>
					<div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
						{related.map(p => <PhotoCard key={p.id} photo={p} idx={0} visible={true} onClick={() => { setSelectedPhoto && setSelectedPhoto(p); }} />)}
					</div>
				</section>
			)}
			<Footer setPage={setPage} />
		</div>
	);
}

/* ─── About Page ─────────────────────────────────────────────────────────────── */
function AboutPage({ setPage }) {
	const [heroRef, heroVisible] = useScrollReveal(0.05);
	const [imgRef, imgVisible] = useScrollReveal(0.15);
	const [statsRef, statsVisible] = useScrollReveal(0.2);
	const stats = [["12", "Years"], ["40+", "Countries"], ["200+", "Projects"], ["15", "Awards"]];

	return (
		<div style={{ background: "#000", color: "#fff", minHeight: "100vh", paddingTop: 100 }}>
			<div style={{ padding: "56px 56px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 88, alignItems: "start" }}>
				<div ref={heroRef}>
					<div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, letterSpacing: 6, color: "#A3FF12", textTransform: "uppercase", marginBottom: 28, opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(20px)", transition: `all 0.7s ${SPRING}` }}>The Photographer</div>
					<div style={{ overflow: "hidden", marginBottom: 40 }}>
						{["ALEKSEI", "VORONOV"].map((w, i) => (
							<div key={w} style={{ overflow: "hidden" }}>
								<div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(64px, 10vw, 120px)", lineHeight: 0.88, opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(100%)", transition: `all 0.8s ${SPRING} ${i * 120}ms` }}>{w}</div>
							</div>
						))}
					</div>
					<p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 21, fontStyle: "italic", color: "rgba(255,255,255,0.6)", lineHeight: 1.65, marginBottom: 36, opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(24px)", transition: `all 0.8s ${SPRING} 0.4s` }}>
						"Photography is not about capturing what exists — it's about revealing what has never been seen before."
					</p>
					{["Born in Saint Petersburg, raised on light. I began photographing at 16, obsessed with the way a single frame could compress an entire world. After studying Fine Arts in Vienna and photojournalism in New York, I turned my lens toward places where civilization meets wilderness.",
						"My work has been featured in National Geographic, Vogue, and the New York Times. I've shot campaigns for Apple, Rolex, and Dior — always seeking that precise intersection of emotion and light."
					].map((p, i) => (
						<p key={i} style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, color: "rgba(255,255,255,0.42)", lineHeight: 1.95, marginBottom: 28, opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(24px)", transition: `all 0.9s ${SPRING} ${0.5 + i * 0.15}s` }}>{p}</p>
					))}
				</div>

				<div ref={imgRef} style={{ position: "relative", opacity: imgVisible ? 1 : 0, transform: imgVisible ? "translateY(0) scale(1)" : "translateY(50px) scale(0.93)", filter: imgVisible ? "blur(0)" : "blur(8px)", transition: `all 1.1s ${SPRING} 0.2s` }}>
					<img src="https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=600&q=80" alt="Aleksei" style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover" }} />
					<div style={{ position: "absolute", top: 28, right: -20, background: "#1a1a1a", border: "1px solid rgba(163,255,18,0.18)", padding: "22px 28px" }}>
						<p style={{ margin: "0 0 4px", fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, color: "#A3FF12", lineHeight: 1 }}>2012</p>
						<p style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, letterSpacing: 2, color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>Est.</p>
					</div>
				</div>
			</div>

			<div ref={statsRef} style={{ padding: "80px 56px 0", display: "grid", gridTemplateColumns: "repeat(4,1fr)", borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: 80 }}>
				{stats.map(([n, l], i) => (
					<div key={n} style={{ padding: "44px 0", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none", textAlign: "center", opacity: statsVisible ? 1 : 0, transform: statsVisible ? "translateY(0) scale(1)" : "translateY(30px) scale(0.9)", filter: statsVisible ? "blur(0)" : "blur(4px)", transition: `all 0.8s ${SPRING} ${i * 110}ms` }}>
						<div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 76, color: "#A3FF12", lineHeight: 1, marginBottom: 8 }}>{n}</div>
						<div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, letterSpacing: 3, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>{l}</div>
					</div>
				))}
			</div>

			<section style={{ padding: "80px 56px 120px", borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: 64 }}>
				<div className="apple-reveal" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, letterSpacing: 6, color: "#A3FF12", textTransform: "uppercase", marginBottom: 48 }}>Clients & Publications</div>
				<div style={{ display: "flex", flexWrap: "wrap", gap: 48 }}>
					{CLIENTS.map((c, i) => (
						<span key={c} className="apple-reveal" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 38, letterSpacing: 3, color: "rgba(255,255,255,0.12)", transition: `color 0.4s ${SPRING}`, cursor: "default", transitionDelay: `${i * 60}ms` }}
							  onMouseEnter={e => e.target.style.color = "#fff"}
							  onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.12)"}
						>{c}</span>
					))}
				</div>
			</section>
			<Footer setPage={setPage} />
		</div>
	);
}

/* ─── Contact Page ───────────────────────────────────────────────────────────── */
function ContactPage({ setPage }) {
	const [form, setForm] = useState({ name: "", email: "", message: "" });
	const [sent, setSent] = useState(false);
	const [focused, setFocused] = useState(null);
	const [titleRef, titleVisible] = useScrollReveal(0.05);
	const [formRef, formVisible] = useScrollReveal(0.1);

	const inp = (f) => ({
		background: "transparent", border: "none",
		borderBottom: `1px solid ${focused === f ? "#A3FF12" : "rgba(255,255,255,0.1)"}`,
		color: "#fff", fontFamily: "'Space Grotesk', sans-serif", fontSize: 16,
		padding: "16px 0", width: "100%", outline: "none",
		transition: `border-color 0.4s ${SPRING}`,
	});

	return (
		<div style={{ background: "#000", color: "#fff", minHeight: "100vh", paddingTop: 100 }}>
			<div ref={titleRef} style={{ padding: "56px 56px 80px" }}>
				<div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, letterSpacing: 6, color: "#A3FF12", textTransform: "uppercase", marginBottom: 18, opacity: titleVisible ? 1 : 0, transform: titleVisible ? "translateY(0)" : "translateY(16px)", transition: `all 0.7s ${SPRING}` }}>Contact</div>
				<div style={{ overflow: "hidden" }}>
					{["LET'S", "WORK", "TOGETHER"].map((w, i) => (
						<div key={w} style={{ overflow: "hidden" }}>
							<div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(64px, 10vw, 128px)", lineHeight: 0.88, opacity: titleVisible ? 1 : 0, transform: titleVisible ? "translateY(0)" : "translateY(100%)", filter: titleVisible ? "blur(0)" : "blur(6px)", transition: `all 0.8s ${SPRING} ${i * 100 + 100}ms` }}>{w}</div>
						</div>
					))}
				</div>
			</div>

			<div ref={formRef} style={{ padding: "0 56px 120px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 120 }}>
				<div style={{ opacity: formVisible ? 1 : 0, transform: formVisible ? "translateX(0)" : "translateX(-40px)", transition: `all 0.9s ${SPRING} 0.2s` }}>
					{sent ? (
						<div style={{ padding: 48, border: "1px solid rgba(163,255,18,0.2)", background: "rgba(163,255,18,0.03)", animation: "scaleIn 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards" }}>
							<p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 52, color: "#A3FF12", margin: "0 0 16px" }}>MESSAGE SENT</p>
							<p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, color: "rgba(255,255,255,0.45)" }}>Thank you for reaching out. I'll be in touch within 24 hours.</p>
						</div>
					) : (
						<div>
							{[["name", "Your Name", "text", "John Doe"], ["email", "Email Address", "email", "hello@example.com"]].map(([f, l, t, ph]) => (
								<div key={f} style={{ marginBottom: 44 }}>
									<label style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, letterSpacing: 3, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", display: "block", marginBottom: 8 }}>{l}</label>
									<input type={t} value={form[f]} placeholder={ph} onChange={e => setForm({ ...form, [f]: e.target.value })} onFocus={() => setFocused(f)} onBlur={() => setFocused(null)} style={inp(f)} />
								</div>
							))}
							<div style={{ marginBottom: 52 }}>
								<label style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, letterSpacing: 3, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Message</label>
								<textarea value={form.message} placeholder="Tell me about your project..." onChange={e => setForm({ ...form, message: e.target.value })} onFocus={() => setFocused("message")} onBlur={() => setFocused(null)} style={{ ...inp("message"), resize: "none", height: 140 }} />
							</div>
							<NeonButton onClick={() => setSent(true)}>Send Message</NeonButton>
						</div>
					)}
				</div>

				<div style={{ opacity: formVisible ? 1 : 0, transform: formVisible ? "translateX(0)" : "translateX(40px)", transition: `all 0.9s ${SPRING} 0.35s` }}>
					{[["Email", "aleksei@lens.studio"], ["Based in", "Tokyo · Moscow · Remote"]].map(([k, v]) => (
						<div key={k} style={{ marginBottom: 56 }}>
							<p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, letterSpacing: 3, color: "#A3FF12", textTransform: "uppercase", marginBottom: 12 }}>{k}</p>
							<p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, fontStyle: "italic", margin: 0 }}>{v}</p>
						</div>
					))}
					<div>
						<p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, letterSpacing: 3, color: "#A3FF12", textTransform: "uppercase", marginBottom: 20 }}>Social</p>
						{[["Instagram", "@aleksei.lens"], ["Telegram", "@alekseilens"], ["Behance", "aleksei-voronov"]].map(([p, h], i) => (
							<div key={p} style={{ marginBottom: 0, display: "flex", justifyContent: "space-between", padding: "16px 0", overflow: "hidden", position: "relative" }}
								 onMouseEnter={e => { const line = e.currentTarget.querySelector(".hover-line"); if (line) line.style.transform = "scaleX(1)"; }}
								 onMouseLeave={e => { const line = e.currentTarget.querySelector(".hover-line"); if (line) line.style.transform = "scaleX(0)"; }}
							>
								<div className="hover-line" style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: "rgba(163,255,18,0.3)", transform: "scaleX(0)", transformOrigin: "left", transition: `transform 0.4s ${SPRING}` }} />
								<span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, color: "rgba(255,255,255,0.3)" }}>{p}</span>
								<span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, color: "rgba(255,255,255,0.6)" }}>{h}</span>
							</div>
						))}
					</div>
				</div>
			</div>
			<Footer setPage={setPage} />
		</div>
	);
}

/* ─── Footer ─────────────────────────────────────────────────────────────────── */
function Footer({ setPage }) {
	const [ref, visible] = useScrollReveal(0.1);
	return (
		<footer ref={ref} style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "36px 56px", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: `all 0.8s ${SPRING}` }}>
			<button onClick={() => setPage("home")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 5, color: "#A3FF12" }}>ALEKSEI·LENS</button>
			<p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.15)", margin: 0 }}>© 2024 All rights reserved</p>
			<div style={{ display: "flex", gap: 32 }}>
				{["Portfolio", "About", "Contact"].map(l => (
					<button key={l} onClick={() => setPage(l.toLowerCase())} className="nav-link"
							style={{ color: "rgba(255,255,255,0.25)" }}
					>{l}</button>
				))}
			</div>
		</footer>
	);
}

/* ─── Page Transition (Apple-style: fade + scale) ───────────────────────────── */
function PageTransition({ children, pageKey }) {
	const [state, setState] = useState("visible");
	const prevKey = useRef(pageKey);

	useEffect(() => {
		if (prevKey.current !== pageKey) {
			setState("exit");
			const t = setTimeout(() => { setState("enter"); prevKey.current = pageKey; const t2 = setTimeout(() => setState("visible"), 50); return () => clearTimeout(t2); }, 300);
			return () => clearTimeout(t);
		}
	}, [pageKey]);

	return (
		<div style={{
			opacity: state === "exit" ? 0 : 1,
			transform: state === "exit" ? "scale(0.98) translateY(10px)" : state === "enter" ? "scale(0.99) translateY(6px)" : "scale(1) translateY(0)",
			filter: state === "exit" ? "blur(4px)" : "blur(0px)",
			transition: state === "exit" ? `all 0.3s ${SPRING}` : state === "visible" ? `all 0.5s ${SPRING}` : "none",
		}}>{children}</div>
	);
}

/* ─── App ────────────────────────────────────────────────────────────────────── */
export default function App() {
	const [page, setPage] = useState("home");
	const [selectedPhoto, setSelectedPhoto] = useState(null);

	const navigate = useCallback((p) => {
		window.scrollTo({ top: 0, behavior: "instant" });
		setTimeout(() => setPage(p), 50);
	}, []);

	// Re-apply .apple-reveal observer after page changes
	useEffect(() => {
		const obs = new IntersectionObserver(entries => {
			entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); } });
		}, { threshold: 0.1 });
		const els = document.querySelectorAll(".apple-reveal, .apple-reveal-left, .apple-scale-reveal");
		els.forEach(el => { el.classList.remove("visible"); obs.observe(el); });
		return () => obs.disconnect();
	}, [page]);

	return (
		<div style={{ background: "#000", minHeight: "100vh", cursor: "none" }}>
			<GlobalStyles />
			<Cursor />
			<Navbar page={page} setPage={navigate} />
			<PageTransition pageKey={page}>
				{page === "home" && <HomePage setPage={navigate} setSelectedPhoto={setSelectedPhoto} />}
				{page === "portfolio" && <PortfolioPage setPage={navigate} setSelectedPhoto={setSelectedPhoto} />}
				{page === "project" && <ProjectPage photo={selectedPhoto} setPage={navigate} setSelectedPhoto={setSelectedPhoto} />}
				{page === "about" && <AboutPage setPage={navigate} />}
				{page === "contact" && <ContactPage setPage={navigate} />}
			</PageTransition>
		</div>
	);
}
