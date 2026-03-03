'use client';
import { motion } from 'framer-motion';

/* ── Shared SVG defs ─────────────────────────────────────── */
function Defs() {
    return (
        <defs>
            {/* Aluminum frame */}
            <linearGradient id="alum-v" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d4d4d4" />
                <stop offset="30%" stopColor="#a8a8a8" />
                <stop offset="70%" stopColor="#c2c2c2" />
                <stop offset="100%" stopColor="#8a8a8a" />
            </linearGradient>
            <linearGradient id="alum-h" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#b8b8b8" />
                <stop offset="50%" stopColor="#e0e0e0" />
                <stop offset="100%" stopColor="#b0b0b0" />
            </linearGradient>
            <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#1a1a2e" />
                <stop offset="100%" stopColor="#0a0a14" />
            </linearGradient>
            <linearGradient id="screen-blue" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#1e1b4b" />
                <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="titanium-dark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3a3a3c" />
                <stop offset="40%" stopColor="#2c2c2e" />
                <stop offset="100%" stopColor="#1c1c1e" />
            </linearGradient>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#000" floodOpacity="0.7" />
            </filter>
            <filter id="glow-b">
                <feGaussianBlur stdDeviation="3" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            {/* Screen glossy sheen */}
            <linearGradient id="sheen" x1="0" y1="0" x2="0.4" y2="1">
                <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
            <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#d4a843" />
                <stop offset="50%" stopColor="#f0c060" />
                <stop offset="100%" stopColor="#b8882a" />
            </linearGradient>
            <linearGradient id="emerald" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#059669" />
                <stop offset="100%" stopColor="#065f46" />
            </linearGradient>
        </defs>
    );
}

/* ══════════════════════ SMARTPHONE ═══════════════════════ */
export function SmartphoneMockup() {
    return (
        <svg width="180" height="360" viewBox="0 0 180 360" fill="none" xmlns="http://www.w3.org/2000/svg" filter="url(#shadow)">
            <Defs />
            {/* Body */}
            <rect x="4" y="4" width="172" height="352" rx="38" fill="url(#titanium-dark)" />
            {/* Outer ring highlight */}
            <rect x="4" y="4" width="172" height="352" rx="38" fill="none" stroke="url(#alum-v)" strokeWidth="2.5" />
            {/* Screen bezel inset */}
            <rect x="10" y="10" width="160" height="340" rx="34" fill="#111118" />
            {/* Screen */}
            <rect x="12" y="12" width="156" height="336" rx="32" fill="url(#screen-blue)" />
            {/* Glossy sheen on screen */}
            <rect x="12" y="12" width="80" height="336" rx="32" fill="url(#sheen)" />

            {/* Dynamic Island */}
            <rect x="58" y="24" width="64" height="18" rx="9" fill="#000" />
            <circle cx="104" cy="33" r="4.5" fill="#111" />
            <circle cx="106" cy="33" r="1.8" fill="#1a3a5c" opacity="0.6" />

            {/* Status bar */}
            <text x="24" y="50" fill="white" fontSize="9" fontWeight="600" fontFamily="sans-serif" opacity="0.9">9:41</text>
            {/* Battery */}
            <rect x="138" y="44" width="22" height="10" rx="2.5" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
            <rect x="160" y="47" width="2" height="4" rx="1" fill="rgba(255,255,255,0.5)" />
            <rect x="139.5" y="45.5" width="16" height="7" rx="2" fill="#22c55e" />
            {/* Signal dots */}
            {[127, 132, 137].map((x, i) => <rect key={x} x={x} y={48 - i * 1.5} width="3" height={4 + i * 1.5} rx="1" fill="white" opacity="0.7" />)}

            {/* App hero card */}
            <rect x="20" y="60" width="140" height="72" rx="14" fill="url(#gold)" opacity="0.9" />
            <text x="36" y="90" fill="white" fontSize="11" fontWeight="700" fontFamily="sans-serif">CBRIXI Store</text>
            <text x="36" y="106" fill="rgba(255,255,255,0.7)" fontSize="8" fontFamily="sans-serif">Today's top deals →</text>
            <circle cx="146" cy="88" r="14" fill="rgba(255,255,255,0.15)" />
            <text x="146" y="93" textAnchor="middle" fill="white" fontSize="14">⚡</text>

            {/* App grid */}
            {[
                ['#3b82f6', '#1d4ed8'], ['#8b5cf6', '#6d28d9'], ['#ec4899', '#be185d'], ['#f59e0b', '#d97706'],
                ['#22c55e', '#15803d'], ['#06b6d4', '#0e7490'], ['#ef4444', '#b91c1c'], ['#a855f7', '#7e22ce'],
                ['#14b8a6', '#0f766e'], ['#f97316', '#c2410c'], ['#6366f1', '#4338ca'], ['#84cc16', '#4d7c0f'],
            ].map(([a, b], i) => {
                const col = i % 4, row = Math.floor(i / 4);
                return (
                    <g key={i}>
                        <rect x={20 + col * 36} y={144 + row * 44} width="28" height="28" rx="8"
                            fill={`url(#app-${i})`} />
                        <defs>
                            <linearGradient id={`app-${i}`} x1="0" y1="0" x2="1" y2="1">
                                <stop stopColor={a} /><stop offset="1" stopColor={b} />
                            </linearGradient>
                        </defs>
                    </g>
                );
            })}

            {/* Notification card */}
            <rect x="20" y="242" width="140" height="52" rx="12" fill="rgba(255,255,255,0.06)" />
            <rect x="20" y="242" width="140" height="52" rx="12" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            <circle cx="38" cy="262" r="9" fill="url(#emerald)" />
            <text x="38" y="266" textAnchor="middle" fill="white" fontSize="9">✓</text>
            <text x="52" y="260" fill="white" fontSize="8" fontWeight="600" fontFamily="sans-serif">Order Shipped</text>
            <text x="52" y="272" fill="rgba(255,255,255,0.5)" fontSize="7" fontFamily="sans-serif">Your CBRIXI watch is on the way</text>
            <text x="148" y="260" fill="rgba(255,255,255,0.3)" fontSize="7" fontFamily="sans-serif" textAnchor="end">2m ago</text>

            {/* Home indicator */}
            <rect x="65" y="327" width="50" height="4" rx="2" fill="rgba(255,255,255,0.35)" />

            {/* Physical buttons */}
            <rect x="0" y="100" width="4" height="32" rx="2" fill="url(#alum-v)" />
            <rect x="0" y="144" width="4" height="24" rx="2" fill="url(#alum-v)" />
            <rect x="176" y="116" width="4" height="48" rx="2" fill="url(#alum-v)" />

            {/* Camera bump (back perspective hint via shadow at top) */}
            <ellipse cx="90" cy="360" rx="60" ry="8" fill="black" opacity="0.4" />
        </svg>
    );
}

/* ══════════════════════ SMARTWATCH ════════════════════════ */
export function SmartwatchMockup() {
    const now = new Date();
    const hh = now.getHours().toString().padStart(2, '0');
    const mm = now.getMinutes().toString().padStart(2, '0');
    return (
        <svg width="200" height="280" viewBox="0 0 200 280" fill="none" xmlns="http://www.w3.org/2000/svg" filter="url(#shadow)">
            <Defs />
            {/* Top band */}
            <path d="M72 60 Q72 16 100 16 Q128 16 128 60 L128 80 Q100 70 72 80 Z" fill="#1e3a5f" />
            <path d="M72 60 Q72 16 100 16 Q128 16 128 60" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            {/* Bottom band */}
            <path d="M72 210 L128 210 Q128 265 100 265 Q72 265 72 210 Z" fill="#1e3a5f" />
            {/* Watch case body */}
            <rect x="28" y="70" width="144" height="150" rx="44" fill="url(#titanium-dark)" />
            <rect x="28" y="70" width="144" height="150" rx="44" fill="none" stroke="url(#alum-h)" strokeWidth="2.5" />
            {/* Screen */}
            <rect x="34" y="76" width="132" height="138" rx="40" fill="url(#glass)" />
            {/* Inner glow */}
            <rect x="36" y="78" width="100" height="138" rx="38" fill="url(#sheen)" />
            {/* Digital crown */}
            <rect x="172" y="118" width="6" height="36" rx="3" fill="url(#alum-v)" />
            <rect x="172" y="118" width="6" height="36" rx="3" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />

            {/* Date */}
            <text x="100" y="103" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9" letterSpacing="1.5" fontFamily="sans-serif">MON 23 FEB</text>

            {/* Time */}
            <text x="100" y="138" textAnchor="middle" fill="white" fontSize="36" fontWeight="700" letterSpacing="-2" fontFamily="sans-serif">{hh}:{mm}</text>

            {/* Heart rate */}
            <rect x="48" y="148" width="104" height="28" rx="8" fill="rgba(239,68,68,0.12)" />
            <text x="62" y="166" fill="#ef4444" fontSize="13" fontFamily="sans-serif">♥</text>
            <text x="76" y="167" fill="#ef4444" fontSize="11" fontWeight="700" fontFamily="sans-serif">72 BPM</text>

            {/* Activity rings */}
            {([[50, 72, '#3b82f6', 0.78], [100, 72, '#22c55e', 0.55], [150, 72, '#f59e0b', 0.9]] as const).map(([cx, cy, c, pct]) => (
                <g key={cx}>
                    <circle cx={cx} cy={192} r={10} fill="none" stroke={`${c}30`} strokeWidth="4" />
                    <circle cx={cx} cy={192} r={10} fill="none" stroke={c} strokeWidth="4"
                        strokeDasharray={`${pct * 62.8} 62.8`} strokeLinecap="round"
                        transform={`rotate(-90 ${cx} 192)`} />
                </g>
            ))}
        </svg>
    );
}

/* ══════════════════════ SMART SPEAKER ═══════════════════ */
export function SpeakerMockup() {
    return (
        <svg width="180" height="300" viewBox="0 0 180 300" fill="none" xmlns="http://www.w3.org/2000/svg" filter="url(#shadow)">
            <Defs />
            <defs>
                <linearGradient id="spk-body" x1="0" y1="0" x2="1" y2="1">
                    <stop stopColor="#1a2e20" />
                    <stop offset="0.6" stopColor="#0f1e14" />
                    <stop offset="1" stopColor="#0c1a10" />
                </linearGradient>
                <linearGradient id="spk-top" x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="#2a402e" />
                    <stop offset="1" stopColor="#182418" />
                </linearGradient>
                <radialGradient id="spk-glow" cx="50%" cy="50%" r="50%">
                    <stop stopColor="#34d399" stopOpacity="0.6" />
                    <stop offset="1" stopColor="#34d399" stopOpacity="0" />
                </radialGradient>
            </defs>

            {/* Top dome */}
            <ellipse cx="90" cy="58" rx="68" ry="58" fill="url(#spk-top)" />
            <ellipse cx="90" cy="58" rx="68" ry="58" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <ellipse cx="90" cy="44" rx="50" ry="18" fill="url(#sheen)" />

            {/* Pulsing Siri-style orb */}
            <motion.circle cx="90" cy="54" r="28" fill="url(#spk-glow)"
                animate={{ r: [24, 30, 24], opacity: [0.5, 0.9, 0.5] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
            <circle cx="90" cy="54" r="16" fill="rgba(52,211,153,0.15)" stroke="rgba(52,211,153,0.5)" strokeWidth="1.5" />
            <circle cx="90" cy="54" r="8" fill="#34d399" />

            {/* Body cylinder */}
            <rect x="22" y="112" width="136" height="164" rx="8" fill="url(#spk-body)" />
            <rect x="22" y="112" width="136" height="164" rx="8" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />

            {/* Left sheen on body */}
            <rect x="22" y="112" width="40" height="164" rx="8" fill="rgba(255,255,255,0.03)" />

            {/* Fabric mesh grid */}
            {Array.from({ length: 20 }, (_, i) => (
                <line key={`h${i}`} x1="22" y1={118 + i * 8} x2="158" y2={118 + i * 8} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            ))}
            {Array.from({ length: 14 }, (_, i) => (
                <line key={`v${i}`} x1={28 + i * 10} y1="112" x2={28 + i * 10} y2="276" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
            ))}

            {/* LED strip at top */}
            <rect x="30" y="115" width="120" height="6" rx="3" fill="rgba(0,0,0,0.4)" />
            {Array.from({ length: 5 }, (_, i) => (
                <motion.circle key={i} cx={54 + i * 18} cy="118" r="3.5"
                    fill="#34d399"
                    animate={{ opacity: [0.3 + i * 0.15, 1, 0.3 + i * 0.15] }}
                    transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }} />
            ))}

            {/* Volume + / - */}
            <rect x="30" y="132" width="28" height="28" rx="8" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            <text x="44" y="150" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="14" fontWeight="300">+</text>
            <rect x="122" y="132" width="28" height="28" rx="8" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            <text x="136" y="150" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="16" fontWeight="300">−</text>

            {/* Waveform visualizer */}
            {[0.4, 0.7, 1, 0.8, 0.6, 0.9, 0.5, 0.7, 1, 0.6].map((h, i) => (
                <motion.rect key={i} x={38 + i * 10} y={185 + (1 - h) * 30} width="5" height={h * 30} rx="2.5"
                    fill={`rgba(52,211,153,${0.4 + h * 0.4})`}
                    animate={{ height: [h * 30, h * 40, h * 30], y: [185 + (1 - h) * 30, 185 + (1 - h) * 40, 185 + (1 - h) * 30] }}
                    transition={{ duration: 0.8 + i * 0.1, repeat: Infinity, ease: 'easeInOut', delay: i * 0.08 }} />
            ))}

            {/* Logo */}
            <text x="90" y="255" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="10" letterSpacing="4" fontFamily="sans-serif" fontWeight="600">CBRIXI</text>

            {/* Base */}
            <ellipse cx="90" cy="278" rx="68" ry="9" fill="#080e09" />
            <ellipse cx="90" cy="278" rx="60" ry="5" fill="#0a120a" />
        </svg>
    );
}

/* ══════════════════════ LAPTOP ════════════════════════════ */
export function LaptopMockup() {
    return (
        <svg width="320" height="240" viewBox="0 0 320 240" fill="none" xmlns="http://www.w3.org/2000/svg" filter="url(#shadow)">
            <Defs />
            <defs>
                <linearGradient id="lid-face" x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="#2a2a2e" />
                    <stop offset="1" stopColor="#1c1c20" />
                </linearGradient>
                <linearGradient id="base-top" x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="#323236" />
                    <stop offset="1" stopColor="#252528" />
                </linearGradient>
                <linearGradient id="base-front" x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="#1a1a1e" />
                    <stop offset="1" stopColor="#111114" />
                </linearGradient>
                <linearGradient id="key-g" x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="#3a3a3e" />
                    <stop offset="1" stopColor="#2a2a2e" />
                </linearGradient>
                <linearGradient id="lscreen" x1="0" y1="0" x2="1" y2="1">
                    <stop stopColor="#0d1117" />
                    <stop offset="0.5" stopColor="#161b27" />
                    <stop offset="1" stopColor="#0d1117" />
                </linearGradient>
            </defs>

            {/* ── LID ── */}
            {/* Lid in 3/4 perspective – slight angle */}
            <path d="M20 8 L300 8 Q308 8 308 16 L308 148 Q308 156 300 156 L20 156 Q12 156 12 148 L12 16 Q12 8 20 8 Z" fill="url(#lid-face)" />
            <path d="M20 8 L300 8 Q308 8 308 16 L308 148 Q308 156 300 156 L20 156 Q12 156 12 148 L12 16 Q12 8 20 8 Z" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            {/* Lid inner screen recess */}
            <rect x="22" y="14" width="276" height="134" rx="5" fill="#080c12" />
            {/* Screen */}
            <rect x="24" y="16" width="272" height="130" rx="4" fill="url(#lscreen)" />
            {/* Screen sheen */}
            <rect x="24" y="16" width="140" height="130" rx="4" fill="url(#sheen)" />

            {/* Screen: VS Code–style UI */}
            {/* Sidebar */}
            <rect x="24" y="16" width="42" height="130" rx="0" fill="#161b22" />
            {[30, 46, 62, 78].map((y) =>
                <rect key={y} x="32" y={y} width="18" height="9" rx="2" fill="rgba(255,255,255,0.06)" />
            )}
            {/* Active sidebar icon */}
            <rect x="32" y="30" width="18" height="9" rx="2" fill="url(#screen-blue)" />

            {/* Editor area */}
            <rect x="66" y="16" width="230" height="14" rx="0" fill="#0d1117" />
            {/* Tabs */}
            {['Hero.tsx', 'Navbar.tsx', 'globals.css'].map((t, i) => (
                <g key={t}>
                    <rect x={66 + i * 72} y={16} width={70} height={14} fill={i === 0 ? "#1e2530" : "transparent"} />
                    <text x={70 + i * 72} y={26} fill={i === 0 ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.3)"} fontSize="6" fontFamily="monospace">{t}</text>
                </g>
            ))}
            {/* Code lines */}
            {[
                { x: 70, y: 42, w: 60, c: '#c792ea', t: 'import' },
                { x: 70, y: 52, w: 80, c: '#82aaff', t: 'export default' },
                { x: 70, y: 62, w: 40, c: '#c3e88d', t: '  return (' },
                { x: 70, y: 72, w: 100, c: '#89ddff', t: '    <Hero device=' },
                { x: 70, y: 82, w: 70, c: '#f78c6c', t: '      cycling' },
                { x: 70, y: 92, w: 50, c: '#a1c4fd', t: '    />' },
                { x: 70, y: 102, w: 30, c: '#c3e88d', t: '  )' },
                { x: 70, y: 112, w: 20, c: '#89ddff', t: '}' },
            ].map(({ x, y, w, c, t }) => (
                <text key={y} x={x} y={y} fill={c} fontSize="6" fontFamily="monospace">{t}</text>
            ))}
            {/* Line numbers */}
            {[40, 50, 60, 70, 80, 90, 100, 110].map((y, i) => (
                <text key={y} x="68" y={y + 2} fill="rgba(255,255,255,0.2)" fontSize="5.5" fontFamily="monospace" textAnchor="end">{i + 1}</text>
            ))}
            {/* Cursor blink */}
            <motion.rect x="114" y="107" width="1.5" height="8" fill="white"
                animate={{ opacity: [1, 1, 0, 0] }} transition={{ duration: 1.1, repeat: Infinity }} />

            {/* Camera notch */}
            <ellipse cx="160" cy="14" rx="5" ry="3.5" fill="#1a1a1e" />
            <circle cx="160" cy="14" r="2" fill="#111" />

            {/* ── HINGE ── */}
            <rect x="12" y="152" width="296" height="6" rx="1" fill="url(#alum-h)" opacity="0.7" />

            {/* ── BASE ── */}
            {/* Base top face (keyboard deck) */}
            <path d="M8 158 L312 158 L316 224 L4 224 Z" fill="url(#base-top)" />
            <path d="M8 158 L312 158 L316 224 L4 224 Z" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

            {/* Keyboard */}
            {Array.from({ length: 10 }, (_, row) =>
                Array.from({ length: row < 4 ? 13 : row === 4 ? 1 : 10 }, (_, col) => {
                    if (row === 4) return <rect key="space" x={80} y={163 + row * 11} width={160} height={8} rx="2" fill="url(#key-g)" stroke="rgba(0,0,0,0.4)" strokeWidth="0.5" />;
                    const kw = row === 3 ? 22 : 20;
                    const startX = row === 3 ? 28 : row === 0 ? 28 : 28;
                    return <rect key={`${row}-${col}`} x={startX + col * (kw + 2)} y={163 + row * 11} width={kw} height={8} rx="2" fill="url(#key-g)" stroke="rgba(0,0,0,0.4)" strokeWidth="0.5" />;
                })
            )}

            {/* Trackpad */}
            <rect x="110" y="196" width="100" height="22" rx="5" fill="#2a2a30" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />

            {/* Base front panel */}
            <path d="M4 224 L316 224 L318 232 Q318 238 312 238 L8 238 Q2 238 2 232 Z" fill="url(#base-front)" />
            <path d="M4 224 L316 224 L318 232 Q318 238 312 238 L8 238 Q2 238 2 232 Z" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

            {/* Logo on lid back (shown as subtle emboss) */}
            <text x="160" y="86" textAnchor="middle" fill="rgba(255,255,255,0.04)" fontSize="16" fontWeight="900" letterSpacing="4" fontFamily="sans-serif">◈</text>

            {/* Shadow under base */}
            <ellipse cx="160" cy="237" rx="148" ry="6" fill="black" opacity="0.5" />
        </svg>
    );
}

/* ══════════════════════ AI GLASSES ════════════════════════ */
export function AIGlassesMockup() {
    return (
        <svg width="310" height="200" viewBox="0 0 310 200" fill="none" xmlns="http://www.w3.org/2000/svg" filter="url(#shadow)">
            <Defs />
            <defs>
                <linearGradient id="frame-g" x1="0" y1="0" x2="1" y2="0.3">
                    <stop stopColor="#c8c8cc" />
                    <stop offset="0.4" stopColor="#e8e8ec" />
                    <stop offset="1" stopColor="#a8a8b0" />
                </linearGradient>
                <linearGradient id="lens-l" x1="0" y1="0" x2="1" y2="1">
                    <stop stopColor="rgba(60,90,180,0.45)" />
                    <stop offset="1" stopColor="rgba(20,40,120,0.65)" />
                </linearGradient>
                <linearGradient id="lens-r" x1="0" y1="0" x2="1" y2="1">
                    <stop stopColor="rgba(60,80,170,0.45)" />
                    <stop offset="1" stopColor="rgba(20,35,110,0.65)" />
                </linearGradient>
                <filter id="lens-blur">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="0.3" />
                </filter>
                <linearGradient id="hud-g" x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="rgba(96,165,250,0.9)" />
                    <stop offset="1" stopColor="rgba(168,85,247,0.9)" />
                </linearGradient>
            </defs>

            {/* Left temple arm */}
            <path d="M12 88 Q8 88 6 92 L4 140 Q4 148 10 148 L24 148 Q30 148 30 140 L28 92 Q28 88 24 88 Z" fill="url(#frame-g)" />
            <path d="M12 88 Q8 88 6 92 L4 140 Q4 148 10 148 L24 148 Q30 148 30 140 L28 92 Q28 88 24 88 Z" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />

            {/* Right temple arm */}
            <path d="M298 88 Q302 88 304 92 L306 140 Q306 148 300 148 L286 148 Q280 148 280 140 L282 92 Q282 88 286 88 Z" fill="url(#frame-g)" />

            {/* Camera + LED on right arm */}
            <circle cx="290" cy="100" r="4" fill="#1c1c1e" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <circle cx="290" cy="100" r="2" fill="#2a2a4a" />
            <motion.circle cx="298" cy="100" r="2.5" fill="#3b82f6"
                animate={{ opacity: [0.5, 1, 0.5], r: [2, 3, 2] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }} />

            {/* Sensor strip on left arm */}
            <rect x="8" y="112" width="16" height="3" rx="1.5" fill="rgba(52,211,153,0.4)" />
            <motion.rect x="8" y="112" width="16" height="3" rx="1.5" fill="rgba(52,211,153,0.6)"
                animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} />

            {/* Main frame bridge */}
            <path d="M28 82 L130 76 Q155 72 180 76 L282 82 L282 100 Q282 108 274 108 L180 104 Q155 108 130 104 L36 108 Q28 108 28 100 Z" fill="url(#frame-g)" />
            <path d="M28 82 L130 76 Q155 72 180 76 L282 82 L282 100 Q282 108 274 108 L180 104 Q155 108 130 104 L36 108 Q28 108 28 100 Z" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.75" />

            {/* Nose bridge */}
            <path d="M130 104 Q142 116 155 116 Q168 116 180 104" fill="none" stroke="url(#frame-g)" strokeWidth="4" strokeLinecap="round" />

            {/* LEFT LENS */}
            <path d="M36 82 L130 76 Q130 104 130 104 L36 108 Q28 108 28 100 L28 82 Z" fill="url(#lens-l)" />
            {/* Lens reflection */}
            <path d="M40 80 L90 76 Q90 88 40 90 Z" fill="rgba(255,255,255,0.08)" />
            {/* Left HUD overlay */}
            <g opacity="0.85">
                <rect x="40" y="82" width="56" height="20" rx="4" fill="rgba(0,0,0,0.3)" />
                <text x="44" y="91" fill="#60a5fa" fontSize="6" fontWeight="700" fontFamily="monospace">AI VISION</text>
                <text x="44" y="99" fill="rgba(255,255,255,0.7)" fontSize="5" fontFamily="monospace">◉ Object: Watch</text>
                {/* mini graph */}
                {[0, 2, 4, 5, 3, 5, 4, 2].map((h, i) => (
                    <rect key={i} x={71 + i * 4} y={95 - h} width="2.5" height={h} rx="0.5" fill="#60a5fa" opacity="0.7" />
                ))}
            </g>

            {/* RIGHT LENS */}
            <path d="M180 76 L274 82 L282 82 L282 100 Q282 108 274 108 L180 104 Z" fill="url(#lens-r)" />
            {/* Right lens reflection */}
            <path d="M200 76 L260 80 Q260 90 200 90 Z" fill="rgba(255,255,255,0.07)" />
            {/* Right HUD overlay */}
            <g opacity="0.85">
                <rect x="188" y="82" width="80" height="20" rx="4" fill="rgba(0,0,0,0.3)" />
                <text x="192" y="91" fill="#a855f7" fontSize="6" fontWeight="700" fontFamily="monospace">CBRIXI AI</text>
                {/* Scanning line */}
                <motion.line x1="192" y1="96" x2="260" y2="96" stroke="#a855f7" strokeWidth="1" opacity="0.6"
                    animate={{ y1: [84, 100, 84], y2: [84, 100, 84] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} />
                <text x="192" y="100" fill="rgba(255,255,255,0.6)" fontSize="5" fontFamily="monospace">Scanning… 98%</text>
            </g>

            {/* Thin LED strip along top of frame */}
            <motion.path d="M50 79 L130 74 Q155 70 180 74 L260 79"
                fill="none" strokeWidth="1.5" strokeLinecap="round"
                stroke="url(#hud-g)"
                animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2.5, repeat: Infinity }} />

            {/* Ground shadow */}
            <ellipse cx="155" cy="170" rx="110" ry="10" fill="black" opacity="0.35" />
        </svg>
    );
}

/* ══════════════════════ EARBUDS ═══════════════════════════ */
export function EarbudsMockup() {
    return (
        <svg width="200" height="240" viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg" filter="url(#shadow)">
            <Defs />
            <defs>
                <linearGradient id="case-g" x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="#2e2e32" />
                    <stop offset="0.6" stopColor="#1e1e22" />
                    <stop offset="1" stopColor="#161618" />
                </linearGradient>
                <linearGradient id="bud-g" x1="0" y1="0" x2="1" y2="1">
                    <stop stopColor="#3a3a3e" />
                    <stop offset="1" stopColor="#1e1e22" />
                </linearGradient>
            </defs>

            {/* Case body */}
            <rect x="20" y="40" width="160" height="170" rx="28" fill="url(#case-g)" />
            <rect x="20" y="40" width="160" height="170" rx="28" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
            {/* Case lid line */}
            <line x1="24" y1="108" x2="176" y2="108" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
            {/* Hinge detail */}
            <rect x="78" y="106" width="44" height="4" rx="2" fill="rgba(255,255,255,0.08)" />
            {/* Top sheen */}
            <rect x="20" y="40" width="90" height="170" rx="28" fill="url(#sheen)" />

            {/* LEFT bud recess */}
            <ellipse cx="70" cy="74" rx="28" ry="30" fill="#111114" />
            <ellipse cx="70" cy="74" rx="28" ry="30" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

            {/* RIGHT bud recess */}
            <ellipse cx="130" cy="74" rx="28" ry="30" fill="#111114" />
            <ellipse cx="130" cy="74" rx="28" ry="30" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

            {/* LEFT earbud */}
            <g transform="translate(70,64) rotate(12)">
                <ellipse cx="0" cy="0" rx="16" ry="18" fill="url(#bud-g)" />
                <ellipse cx="0" cy="0" rx="16" ry="18" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                {/* speaker grille */}
                <circle cx="0" cy="-2" r="9" fill="rgba(0,0,0,0.5)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                {[0, 1, 2, 3, 4, 5].map(i => <circle key={i} cx={Math.cos(i / 6 * Math.PI * 2) * 5} cy={Math.sin(i / 6 * Math.PI * 2) * 5 - 2} r="1.2" fill="rgba(255,255,255,0.08)" />)}
                {/* Touch area */}
                <motion.circle cx="0" cy="11" r="5" fill="rgba(59,130,246,0.2)" stroke="rgba(59,130,246,0.5)" strokeWidth="0.75"
                    animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} />
                {/* stem */}
                <rect x="-4" y="17" width="8" height="16" rx="4" fill="url(#bud-g)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
            </g>

            {/* RIGHT earbud */}
            <g transform="translate(130,64) rotate(-12)">
                <ellipse cx="0" cy="0" rx="16" ry="18" fill="url(#bud-g)" />
                <ellipse cx="0" cy="0" rx="16" ry="18" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                <circle cx="0" cy="-2" r="9" fill="rgba(0,0,0,0.5)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                {[0, 1, 2, 3, 4, 5].map(i => <circle key={i} cx={Math.cos(i / 6 * Math.PI * 2) * 5} cy={Math.sin(i / 6 * Math.PI * 2) * 5 - 2} r="1.2" fill="rgba(255,255,255,0.08)" />)}
                <motion.circle cx="0" cy="11" r="5" fill="rgba(59,130,246,0.2)" stroke="rgba(59,130,246,0.5)" strokeWidth="0.75"
                    animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity, delay: 0.4 }} />
                <rect x="-4" y="17" width="8" height="16" rx="4" fill="url(#bud-g)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
            </g>

            {/* Charging strip */}
            <rect x="40" y="175" width="120" height="14" rx="7" fill="rgba(0,0,0,0.3)" />
            <motion.rect x="41" y="176" width="60" height="12" rx="6" fill="url(#hud-g)"
                animate={{ width: [10, 90, 10] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }} />
            <defs>
                <linearGradient id="hud-g" x1="0" y1="0" x2="1" y2="0">
                    <stop stopColor="#a855f7" /><stop offset="1" stopColor="#3b82f6" />
                </linearGradient>
            </defs>
            <text x="100" y="185" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="7" fontFamily="sans-serif">Charging · 68%</text>

            {/* Logo */}
            <text x="100" y="210" textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="9" letterSpacing="4" fontFamily="sans-serif" fontWeight="600">CBRIXI</text>

            {/* Shadow */}
            <ellipse cx="100" cy="228" rx="75" ry="8" fill="black" opacity="0.4" />
        </svg>
    );
}
