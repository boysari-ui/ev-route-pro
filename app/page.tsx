"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Map from "@/components/Map";
import PWAInstallBanner from "@/components/PWAInstallBanner";

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".rv");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          (e.target as HTMLElement).style.opacity = "1";
          (e.target as HTMLElement).style.transform = "translateY(0)";
        }
      }),
      { threshold: 0.08 }
    );
    els.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(28px)";
      el.style.transition = "opacity 0.65s ease, transform 0.65s ease";
      io.observe(el);
    });
    return () => io.disconnect();
  }, []);
}

const G1 = "#059669";
const GRAY900 = "#111827";
const GRAY500 = "#6b7280";
const GRAY400 = "#9ca3af";
const GRAY200 = "#e5e7eb";
const GRAY50  = "#f9fafb";
const GREEN_LIGHT = "#d1fae5";
const BLUE  = "#1a73e8";

export default function Home() {
  const [showMap, setShowMap] = useState<boolean | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useReveal();

  useEffect(() => {
    const wasOnMap = localStorage.getItem("ev_on_map") === "true";
    const params = new URLSearchParams(window.location.search);
    const hasSharedRoute = params.get("from") && params.get("to");
    const isSuccess = params.get("success") === "true";

    // 결제 성공 후 돌아왔을 때
    if (isSuccess) {
      window.history.replaceState({}, "", "/");
      setShowSuccess(true);
      localStorage.setItem("ev_on_map", "true");
      setTimeout(() => {
        setShowSuccess(false);
        setShowMap(true);
      }, 3000);
      return;
    }

    setShowMap(!!(wasOnMap || hasSharedRoute));
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 결제 성공 화면
  if (showSuccess) return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #059669, #10b981)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{ textAlign: "center", color: "white", padding: 40 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Welcome to Pro Plus!</h1>
        <p style={{ fontSize: 16, opacity: 0.85, marginBottom: 4 }}>Your account is being upgraded...</p>
        <p style={{ fontSize: 13, opacity: 0.6 }}>Redirecting you now</p>
        <div style={{
          width: 40, height: 40, margin: "24px auto 0",
          border: "3px solid rgba(255,255,255,0.3)",
          borderTop: "3px solid white",
          borderRadius: "50%",
          animation: "spin 0.9s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  if (showMap === null) return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#059669,#10b981)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ fontSize:48 }}>⚡</div>
    </div>
  );

  if (showMap) return <Map />;

  const go = () => { localStorage.setItem("ev_on_map","true"); setShowMap(true); };

  const Eyebrow = ({ text }: { text: string }) => (
    <div style={{ display:"inline-flex", alignItems:"center", gap:8, color:G1, fontWeight:700, fontSize:"0.72rem", letterSpacing:"0.12em", textTransform:"uppercase" as const, marginBottom:12 }}>
      <span style={{ width:18, height:2, background:G1, borderRadius:1, display:"inline-block" }} />
      {text}
    </div>
  );

  return (
    <main style={{ fontFamily:"'Inter',system-ui,sans-serif", WebkitFontSmoothing:"antialiased", color:GRAY900 }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      {/* ── Responsive CSS ── */}
      <style>{`
        @keyframes floatBadge { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }

        .hero-grid { display:grid; grid-template-columns:1fr 1fr; gap:64px; align-items:center; }
        .hero-mockup { display:block; }
        .how-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; position:relative; }
        .how-line { display:block; }
        .feat-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; }
        .why-grid  { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
        .nav-pad   { padding:0 48px; }
        .section-pad { padding:88px 48px; }
        .hero-pad  { padding:88px 48px 60px; }
        .footer-pad { padding:28px 48px; }
        .hero-btns { display:flex; flex-direction:row; gap:12px; flex-wrap:wrap; }

        @media (max-width: 960px) {
          .hero-grid { grid-template-columns:1fr; gap:40px; }
          .hero-mockup { display:none; }
        }

        @media (max-width: 680px) {
          .hero-grid { grid-template-columns:1fr; }
          .hero-mockup { display:none; }
          .how-grid { grid-template-columns:1fr; gap:16px; }
          .how-line { display:none; }
          .feat-grid { grid-template-columns:1fr; }
          .why-grid  { grid-template-columns:1fr; }
          .nav-pad   { padding:0 20px; }
          .section-pad { padding:56px 20px; }
          .hero-pad  { padding:100px 20px 56px; }
          .footer-pad { padding:24px 20px; }
          .hero-btns { flex-direction:column; }
          .hero-btns button { width:100%; justify-content:center; }
        }
      `}</style>

      {/* ════ NAV ════ */}
      <nav className="nav-pad" style={{
        position:"fixed", top:0, left:0, right:0, zIndex:200,
        height:64, display:"flex", alignItems:"center", justifyContent:"space-between",
        background:"rgba(10,15,35,0.97)", backdropFilter:"blur(16px)",
        borderBottom:"1px solid rgba(255,255,255,0.07)",
        boxShadow:scrolled?"0 2px 20px rgba(0,0,0,0.2)":"none",
        transition:"box-shadow 0.3s",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <Image src="/ev-route-pro-logo.png" alt="EV Route Pro" width={52} height={52}
            style={{ borderRadius:9, objectFit:"cover", boxShadow:"0 2px 8px rgba(0,0,0,0.2)" }} />
          <div style={{ lineHeight:1 }}>
            <div style={{ fontWeight:800, fontSize:"1.05rem", letterSpacing:"-0.02em", color:"white" }}>EV Route Pro</div>
            <div style={{ fontSize:"0.6rem", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"rgba(255,255,255,0.6)", marginTop:2 }}>Australia</div>
          </div>
        </div>
        <button onClick={go} style={{ background:"white", color:G1, fontWeight:700, fontSize:"0.875rem", padding:"10px 22px", borderRadius:10, border:"none", cursor:"pointer", boxShadow:"0 2px 12px rgba(0,0,0,0.18)", whiteSpace:"nowrap" }}>
          Start Planning
        </button>
      </nav>

      {/* ════ HERO ════ */}
      <section className="hero-pad" style={{
        minHeight:"100vh", background:"linear-gradient(135deg,#0a0f23 0%,#0d1a2e 50%,#0f1f3d 100%)",
        display:"flex", alignItems:"center", position:"relative", overflow:"hidden",
      }}>
        {/* Stars */}
        {[[8,12],[15,35],[25,8],[40,55],[55,20],[70,40],[85,15],[92,60],[30,75],[60,80],[78,70],[45,90],[20,88],[88,85],[5,65],[50,5],[65,95],[35,45],[10,50],[80,30]].map(([x,y],i) => (
          <div key={i} style={{ position:"absolute", left:x+"%", top:y+"%", width:i%3===0?2:1.5, height:i%3===0?2:1.5, background:"white", borderRadius:"50%", opacity:0.3+(i%4)*0.15, pointerEvents:"none" }} />
        ))}
        <div style={{ position:"absolute", top:-100, right:-80, width:500, height:500, background:"radial-gradient(circle,rgba(16,185,129,0.14) 0%,transparent 70%)", borderRadius:"50%", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-100, left:-60, width:420, height:420, background:"radial-gradient(circle,rgba(59,130,246,0.12) 0%,transparent 70%)", borderRadius:"50%", pointerEvents:"none" }} />

        <div className="hero-grid" style={{ maxWidth:1160, margin:"0 auto", width:"100%", position:"relative", zIndex:1 }}>

          {/* Left */}
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:28 }}>
              <Image src="/ev-route-pro-logo.png" alt="EV Route Pro" width={80} height={80}
                style={{ borderRadius:14, objectFit:"cover", boxShadow:"0 8px 24px rgba(0,0,0,0.25)" }} />
              <div>
                <div style={{ color:"white", fontWeight:900, fontSize:"clamp(1.1rem,3vw,1.5rem)", letterSpacing:"-0.02em", lineHeight:1 }}>EV Route Pro</div>
              </div>
            </div>

            <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(16,185,129,0.15)", border:"1px solid rgba(16,185,129,0.3)", color:"#6ee7b7", fontSize:"0.75rem", fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase", padding:"5px 14px", borderRadius:100, marginBottom:20 }}>
              <span style={{ width:6, height:6, background:"#6ee7b7", borderRadius:"50%", display:"inline-block" }} />
              Smart EV Trip Planner for Australia
            </div>

            <h1 style={{ fontWeight:800, fontSize:"clamp(2.2rem, 4vw, 3.2rem)", lineHeight:1.08, letterSpacing:"-0.03em", color:"white", marginBottom:18 }}>
              Plan your EV road trip<br />
              <em style={{ fontStyle:"italic", color:"#6ee7b7" }}>in seconds</em>
            </h1>
            <p style={{ fontSize:"clamp(0.95rem,2vw,1.15rem)", lineHeight:1.65, color:"rgba(255,255,255,0.82)", marginBottom:10, maxWidth:440 }}>
              Get smart charging stops and open your route instantly in Google Maps.
            </p>
            <p style={{ fontSize:"0.88rem", color:"rgba(255,255,255,0.55)", marginBottom:36 }}>
              Plan your drive. Optimize charging. Arrive stress-free.
            </p>

            <div className="hero-btns" style={{ marginBottom:16 }}>
              <button onClick={go} style={{ display:"inline-flex", alignItems:"center", gap:9, background:"white", color:G1, fontWeight:700, fontSize:"1rem", padding:"15px 30px", borderRadius:12, border:"none", cursor:"pointer", boxShadow:"0 4px 20px rgba(0,0,0,0.2)" }}>
                ⚡ Start Planning
              </button>
              <button onClick={go} style={{ display:"inline-flex", alignItems:"center", gap:9, background:"rgba(255,255,255,0.07)", color:"white", fontWeight:600, fontSize:"0.95rem", padding:"15px 22px", borderRadius:12, border:"1.5px solid rgba(255,255,255,0.2)", cursor:"pointer" }}>
                🗺 Try example trip
                <span style={{ background:"rgba(16,185,129,0.2)", borderRadius:6, padding:"2px 9px", fontSize:"0.78rem", fontWeight:700 }}>Melbourne → Sydney</span>
              </button>
            </div>
            <p style={{ fontSize:"0.78rem", color:"rgba(255,255,255,0.4)" }}>Simple EV road trip planning for Australia.</p>
          </div>

          {/* Right — mockup (hidden on mobile) */}
          <div className="hero-mockup" style={{ position:"relative" }}>
            <div style={{ position:"absolute", top:-16, right:-10, zIndex:10, background:"white", borderRadius:12, boxShadow:"0 8px 24px rgba(0,0,0,0.14)", padding:"10px 16px", display:"flex", alignItems:"center", gap:10, border:`1px solid ${GRAY200}`, animation:"floatBadge 3s ease-in-out infinite" }}>
              <span style={{ fontSize:"1.2rem" }}>✅</span>
              <div>
                <div style={{ fontWeight:700, fontSize:"0.78rem", color:GRAY900 }}>Route ready!</div>
                <div style={{ fontSize:"0.67rem", color:GRAY500, marginTop:1 }}>Open in Google Maps</div>
              </div>
            </div>

            <div style={{ background:"white", borderRadius:22, overflow:"hidden", boxShadow:"0 24px 64px rgba(0,0,0,0.22)" }}>
              <div style={{ height:44, background:GRAY50, borderBottom:`1px solid ${GRAY200}`, display:"flex", alignItems:"center", padding:"0 16px", gap:10 }}>
                <div style={{ display:"flex", gap:5 }}>
                  {["#ff5f57","#febc2e","#28c840"].map((c,i)=><span key={i} style={{ width:10, height:10, borderRadius:"50%", background:c, display:"block" }}/>)}
                </div>
                <div style={{ flex:1, background:"white", border:`1px solid ${GRAY200}`, borderRadius:7, height:26, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.72rem", color:GRAY500, gap:5 }}>🔒 evroutepro.com</div>
                <div style={{ width:52 }}/>
              </div>

              <div style={{ height:220, background:"#e8f4e8", overflow:"hidden" }}>
                <svg viewBox="0 0 560 220" xmlns="http://www.w3.org/2000/svg" style={{ width:"100%", height:"100%", display:"block" }}>
                  <rect width="560" height="220" fill="#e8f4e8"/>
                  <rect x="0" y="0" width="200" height="100" fill="#dceedd"/>
                  <rect x="280" y="110" width="280" height="110" fill="#d5ead5"/>
                  <ellipse cx="490" cy="44" rx="70" ry="52" fill="#c8dff8" opacity="0.6"/>
                  <g stroke="#c5d8c5" strokeWidth="5" fill="none">
                    <path d="M 0 145 Q 120 135 220 155 Q 370 178 560 165"/>
                    <path d="M 55 0 Q 72 75 65 145"/>
                  </g>
                  <path d="M 46 182 C 115 170 178 125 256 96 C 334 67 414 60 504 46" stroke="white" strokeWidth="13" fill="none" strokeLinecap="round"/>
                  <path d="M 46 182 C 115 170 178 125 256 96 C 334 67 414 60 504 46" stroke="#059669" strokeWidth="3.5" fill="none" strokeDasharray="10 5" strokeLinecap="round">
                    <animate attributeName="stroke-dashoffset" from="0" to="-150" dur="3.5s" repeatCount="indefinite"/>
                  </path>
                  <path d="M 46 182 C 115 170 178 125 256 96 C 334 67 414 60 504 46" stroke="#059669" strokeWidth="10" fill="none" opacity="0.12" strokeLinecap="round"/>
                  <g transform="translate(46,182)">
                    <circle r="15" fill="#059669" opacity="0.12"><animate attributeName="r" values="15;23;15" dur="2.5s" repeatCount="indefinite"/></circle>
                    <circle r="9" fill="#059669"/><circle r="3.5" fill="white"/>
                  </g>
                  <g transform="translate(256,96)">
                    <circle r="12" fill="#f59e0b" opacity="0.15"><animate attributeName="r" values="12;18;12" dur="2.5s" begin="0.5s" repeatCount="indefinite"/></circle>
                    <circle r="7" fill="#f59e0b"/>
                    <text x="0" y="3" textAnchor="middle" fill="white" fontSize="7.5" fontWeight="bold">⚡</text>
                  </g>
                  <g transform="translate(414,60)">
                    <circle r="12" fill="#f59e0b" opacity="0.15"><animate attributeName="r" values="12;18;12" dur="2.5s" begin="1s" repeatCount="indefinite"/></circle>
                    <circle r="7" fill="#f59e0b"/>
                    <text x="0" y="3" textAnchor="middle" fill="white" fontSize="7.5" fontWeight="bold">⚡</text>
                  </g>
                  <g transform="translate(504,46)">
                    <circle r="15" fill="#dc2626" opacity="0.12"><animate attributeName="r" values="15;23;15" dur="2.5s" begin="1.2s" repeatCount="indefinite"/></circle>
                    <circle r="9" fill="#dc2626"/><circle r="3.5" fill="white"/>
                  </g>
                  <rect x="58" y="191" width="74" height="16" rx="4" fill="white" opacity="0.9"/>
                  <text x="95" y="203" textAnchor="middle" fill="#065f46" fontSize="8.5" fontFamily="Inter,sans-serif" fontWeight="700">Melbourne</text>
                  <rect x="448" y="52" width="56" height="16" rx="4" fill="white" opacity="0.9"/>
                  <text x="476" y="64" textAnchor="middle" fill="#991b1b" fontSize="8.5" fontFamily="Inter,sans-serif" fontWeight="700">Sydney</text>
                  <text x="548" y="215" textAnchor="end" fill="#aaa" fontSize="7" fontFamily="sans-serif">Google Maps</text>
                </svg>
              </div>

              <div style={{ padding:"14px 18px", borderTop:`1px solid ${GRAY200}`, display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                  <span style={{ color:"#16a34a", fontSize:"0.85rem" }}>●</span>
                  <div style={{ width:1.5, height:14, background:GRAY200 }}/>
                  <span style={{ color:"#dc2626", fontSize:"0.85rem" }}>●</span>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:"0.82rem", color:GRAY900 }}>Melbourne CBD</div>
                  <div style={{ fontWeight:700, fontSize:"0.82rem", color:GRAY900, marginTop:6 }}>Sydney CBD</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontWeight:800, fontSize:"0.85rem", color:GRAY900 }}>878 km</div>
                  <div style={{ fontSize:"0.7rem", color:GRAY500, marginTop:2 }}>2 charging stops</div>
                </div>
              </div>

              <div style={{ borderTop:`1px solid ${GRAY200}`, padding:"10px 18px 6px" }}>
                <div style={{ fontSize:"0.65rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.09em", color:GRAY400, marginBottom:9 }}>Charging stops</div>
                {[
                  { name:"Holbrook Supercharger", detail:"Arrive 21% · 35 min · 250kW", pct:80, color:"#10b981" },
                  { name:"Goulburn Fast Charge",  detail:"Arrive 18% · 28 min · 150kW", pct:75, color:"#f59e0b" },
                ].map((s)=>(
                  <div key={s.name} style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 0", borderBottom:`1px solid ${GRAY50}` }}>
                    <div style={{ width:28, height:28, borderRadius:8, background:GREEN_LIGHT, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.8rem", flexShrink:0 }}>⚡</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:"0.77rem", fontWeight:600, color:GRAY900 }}>{s.name}</div>
                      <div style={{ fontSize:"0.67rem", color:GRAY500, marginTop:1 }}>{s.detail}</div>
                    </div>
                    <div style={{ minWidth:52 }}>
                      <div style={{ width:52, height:5, background:GRAY200, borderRadius:3, overflow:"hidden", marginBottom:3 }}>
                        <div style={{ width:`${s.pct}%`, height:"100%", background:s.color, borderRadius:3 }}/>
                      </div>
                      <div style={{ fontSize:"0.67rem", fontWeight:700, color:GRAY500, textAlign:"right" }}>{s.pct}%</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ padding:"12px 18px 16px", borderTop:`1px solid ${GRAY200}` }}>
                <button onClick={go} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8, background:BLUE, color:"white", fontWeight:700, fontSize:"0.85rem", padding:11, borderRadius:9, border:"none", cursor:"pointer" }}>
                  <svg width="15" height="15" viewBox="0 0 18 18" fill="none"><path d="M9 0C5.69 0 3 2.69 3 6c0 4.5 6 12 6 12s6-7.5 6-12c0-3.31-2.69-6-6-6z" fill="white"/><circle cx="9" cy="6" r="2.2" fill={BLUE}/></svg>
                  Open in Google Maps
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════ HOW IT WORKS ════ */}
      <section className="section-pad">
        <div style={{ maxWidth:1160, margin:"0 auto" }}>
          <div className="rv"><Eyebrow text="How it works"/><h2 style={{ fontWeight:800, fontSize:"clamp(1.6rem,3vw,2.5rem)", letterSpacing:"-0.03em", color:GRAY900, marginBottom:48, lineHeight:1.18 }}>Three steps to your EV road trip</h2></div>
          <div className="how-grid">
            <div className="how-line" style={{ position:"absolute", top:27, left:"calc(16.66% + 20px)", right:"calc(16.66% + 20px)", height:1, background:"linear-gradient(90deg,#e5e7eb,#10b981,#e5e7eb)" }}/>
            {[
              { n:"1", title:"Enter your destination", desc:"Choose your start and destination to plan your EV trip. Enter your car model and current battery level." },
              { n:"2", title:"Get smart charging stops", desc:"We calculate the best charging stops based on your battery and route — automatically, in seconds." },
              { n:"3", title:"Open in Google Maps", desc:"Navigate instantly with Google Maps. One tap and you're ready to drive — no switching apps, no setup." },
            ].map((s,i)=>(
              <div key={s.n} className="rv" style={{ background:"white", border:`1.5px solid ${GRAY200}`, borderRadius:16, padding:28, position:"relative", zIndex:1, transitionDelay:`${i*0.08}s` }}>
                <div style={{ width:46, height:46, borderRadius:"50%", background:GREEN_LIGHT, border:"2px solid #a7f3d0", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:"1rem", color:G1, marginBottom:20 }}>{s.n}</div>
                <div style={{ fontWeight:700, fontSize:"1rem", color:GRAY900, marginBottom:8 }}>{s.title}</div>
                <p style={{ fontSize:"0.875rem", color:GRAY500, lineHeight:1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ FEATURES ════ */}
      <section className="section-pad" style={{ background:GRAY50 }}>
        <div style={{ maxWidth:1160, margin:"0 auto" }}>
          <div className="rv"><Eyebrow text="Features"/><h2 style={{ fontWeight:800, fontSize:"clamp(1.6rem,3vw,2.5rem)", letterSpacing:"-0.03em", color:GRAY900, marginBottom:48, lineHeight:1.18 }}>Everything you need for a<br/>stress-free EV road trip</h2></div>
          <div className="feat-grid">
            {[
              { icon:"⚡", bg:GREEN_LIGHT, title:"Smart charging stops",      desc:"Automatically find the best charging stations along your route based on speed, availability, and your battery level." },
              { icon:"🔋", bg:GREEN_LIGHT, title:"Battery arrival prediction", desc:"Know how much battery you'll have at each stop. No guesswork, no range anxiety." },
              { icon:"✏️", bg:GREEN_LIGHT, title:"Edit charging stops",        desc:"Add or remove charging stations directly on the map. Customise your route exactly the way you want it." },
              { icon:"🗺️", bg:GREEN_LIGHT,  title:"Google Maps navigation",     desc:"Open your full route instantly in Google Maps. Navigate using the app you already trust — one tap, ready to go." },
            ].map((f,i)=>(
              <div key={f.title} className="rv" style={{ background:"white", border:`1.5px solid ${GRAY200}`, borderRadius:16, padding:24, display:"flex", gap:16, transitionDelay:`${i*0.08}s` }}>
                <div style={{ width:44, height:44, borderRadius:11, background:f.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.2rem", flexShrink:0 }}>
                  {f.title === "Google Maps navigation" ? (
                    <Image src="/android-chrome-512x512.png" alt="Google Maps" width={28} height={28} style={{ borderRadius:6 }}/>
                  ) : f.icon}
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:"0.95rem", color:GRAY900, marginBottom:6 }}>{f.title}</div>
                  <p style={{ fontSize:"0.875rem", color:GRAY500, lineHeight:1.65 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ WHY ════ */}
      <section className="section-pad">
        <div style={{ maxWidth:1160, margin:"0 auto" }}>
          <div className="rv"><Eyebrow text="Why EV Route Pro"/><h2 style={{ fontWeight:800, fontSize:"clamp(1.6rem,3vw,2.5rem)", letterSpacing:"-0.03em", color:GRAY900, marginBottom:48, lineHeight:1.18 }}>Built for Australian EV drivers</h2></div>
          <div className="why-grid">
            {[
              { icon:"🚗", title:"Built for EV drivers",   desc:"Designed specifically for electric vehicle road trips. Every feature is made with EV drivers in mind." },
              { icon:"⚡", title:"Simple and fast",        desc:"No complicated settings. Plan your trip in seconds and get on the road without wasting time." },
              { icon:"🗺️", title:"Works with Google Maps", desc:"Open your route instantly in Google Maps. Navigate using the app you already know and trust." },
            ].map((w,i)=>(
              <div key={w.title} className="rv" style={{ border:`1.5px solid ${GRAY200}`, borderRadius:16, padding:28, transitionDelay:`${i*0.08}s` }}>
                {w.title === "Works with Google Maps" ? (
                  <Image src="/android-chrome-512x512.png" alt="Google Maps" width={40} height={40} style={{ borderRadius:8, marginBottom:14, display:"block" }}/>
                ) : (
                  <div style={{ fontSize:"1.8rem", marginBottom:14 }}>{w.icon}</div>
                )}
                <div style={{ fontWeight:700, fontSize:"1rem", color:GRAY900, marginBottom:7 }}>{w.title}</div>
                <p style={{ fontSize:"0.875rem", color:GRAY500, lineHeight:1.65 }}>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ CTA ════ */}
      <section className="section-pad" style={{ background:"linear-gradient(135deg,#0a0f23 0%,#0d1a2e 50%,#0f1f3d 100%)", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-80, right:-80, width:380, height:380, background:"radial-gradient(circle,rgba(16,185,129,0.14) 0%,transparent 70%)", borderRadius:"50%" }}/>
        <div style={{ position:"absolute", bottom:-80, left:-60, width:320, height:320, background:"radial-gradient(circle,rgba(59,130,246,0.12) 0%,transparent 70%)", borderRadius:"50%" }}/>
        {[[10,20],[25,8],[80,15],[90,70],[60,85],[40,90],[5,55],[70,10],[88,40],[50,5]].map(([x,y],i)=>(
          <div key={i} style={{ position:"absolute", left:x+"%", top:y+"%", width:i%2===0?2:1.5, height:i%2===0?2:1.5, background:"white", borderRadius:"50%", opacity:0.25+(i%3)*0.15, pointerEvents:"none" }}/>
        ))}
        <div className="rv" style={{ maxWidth:540, margin:"0 auto", position:"relative", zIndex:1 }}>
          <h2 style={{ fontWeight:800, fontSize:"clamp(1.6rem,3vw,2.3rem)", color:"white", marginBottom:14, letterSpacing:"-0.03em", lineHeight:1.18 }}>
            Ready to plan your EV road trip?
          </h2>
          <p style={{ fontSize:"1rem", color:"rgba(255,255,255,0.75)", lineHeight:1.65, marginBottom:32 }}>
            Start planning your trip now and open it instantly in Google Maps.
          </p>
          <button onClick={go} style={{ display:"inline-flex", alignItems:"center", gap:9, background:"white", color:G1, fontWeight:700, fontSize:"1rem", padding:"16px 36px", borderRadius:12, border:"none", cursor:"pointer", boxShadow:"0 4px 20px rgba(0,0,0,0.18)" }}>
            ⚡ Start Planning
          </button>
        </div>
      </section>

      {/* ════ FOOTER ════ */}
      <footer className="footer-pad" style={{ background:"white", borderTop:`1px solid ${GRAY200}`, display:"flex", flexDirection:"column", alignItems:"center", gap:12, textAlign:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
          <Image src="/ev-route-pro-logo.png" alt="EV Route Pro" width={48} height={48} style={{ borderRadius:7, objectFit:"cover" }}/>
          <span style={{ fontWeight:800, fontSize:"0.95rem", color:G1 }}>EV Route Pro</span>
        </div>
        <p style={{ fontSize:"0.8rem", color:GRAY400, maxWidth:480, lineHeight:1.6 }}>
          EV Route Pro is a simple EV road trip planner that helps drivers find charging stops and navigate with Google Maps.
        </p>
        <div style={{ display:"flex", gap:24 }}>
          {[["Privacy","/privacy"],["Terms","/terms"],["Contact","/contact"]].map(([label,href])=>(
            <Link key={label} href={href} style={{ fontSize:"0.8rem", color:GRAY400, textDecoration:"none" }}>{label}</Link>
          ))}
        </div>
      </footer>
      <PWAInstallBanner />
    </main>
  );
}
