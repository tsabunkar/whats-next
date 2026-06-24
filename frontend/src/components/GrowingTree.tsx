export default function GrowingTree({ stage }: { stage: number }) {
  const s = Math.max(0, Math.min(15, stage))
  const opacity = (min: number, max: number) => s >= max ? 1 : s <= min ? 0 : (s - min) / (max - min)

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 pointer-events-none z-0 w-[300px] h-[300px]" style={{ opacity: 0.25 }}>
      <svg viewBox="0 0 200 200" className="w-full h-full" style={{ overflow: 'visible' }}>
        {/* Ground */}
        <ellipse cx="100" cy="185" rx={20 + s * 3} ry="6" fill="#2a1a0a" opacity={opacity(0, 2)} />

        {/* Stage 0: Soil mound */}
        <ellipse cx="100" cy="185" rx="18" ry="4" fill="#3d2b1a" />

        {/* Stage 1-2: Roots */}
        <g opacity={opacity(1, 3)}>
          <path d="M100 180 Q85 185 75 190" stroke="#5c3a1e" strokeWidth="1.5" fill="none" opacity={opacity(1, 2)} />
          <path d="M100 180 Q115 185 125 190" stroke="#5c3a1e" strokeWidth="1.5" fill="none" opacity={opacity(1, 2)} />
          <path d="M100 180 Q90 190 82 195" stroke="#5c3a1e" strokeWidth="1" fill="none" opacity={opacity(2, 3)} />
          <path d="M100 180 Q110 190 118 195" stroke="#5c3a1e" strokeWidth="1" fill="none" opacity={opacity(2, 3)} />
        </g>

        {/* Stage 1: Seed */}
        <ellipse cx="100" cy="178" rx="3" ry="4" fill="#8B7355" opacity={opacity(0, 2)} />

        {/* Stage 2-3: Sprout stem */}
        <g opacity={opacity(2, 4)}>
          <line x1="100" y1="178" x2="100" y2={170 - s * 0.5} stroke="#4a8c3f" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Stage 3-4: First leaves */}
        <g opacity={opacity(3, 5)}>
          <ellipse cx="95" cy={170 - s * 0.3} rx="5" ry="3" fill="#5cb85c" transform={`rotate(-30 95 ${170 - s * 0.3})`} />
          <ellipse cx="105" cy={170 - s * 0.3} rx="5" ry="3" fill="#5cb85c" transform={`rotate(30 105 ${170 - s * 0.3})`} />
        </g>

        {/* Stage 4-6: Stem grows taller */}
        <g opacity={opacity(4, 7)}>
          <line x1="100" y1={170 - s * 0.5} x2="100" y2={150 - s * 1.2} stroke="#4a8c3f" strokeWidth={2 + s * 0.15} strokeLinecap="round" />
        </g>

        {/* Stage 5-6: More leaf pairs */}
        <g opacity={opacity(5, 6)}>
          <ellipse cx="92" cy={155 - s * 0.8} rx="6" ry="3.5" fill="#6bcf6b" transform={`rotate(-25 92 ${155 - s * 0.8})`} />
          <ellipse cx="108" cy={155 - s * 0.8} rx="6" ry="3.5" fill="#6bcf6b" transform={`rotate(25 108 ${155 - s * 0.8})`} />
        </g>
        <g opacity={opacity(6, 7)}>
          <ellipse cx="90" cy={143 - s * 1.1} rx="7" ry="4" fill="#7ad87a" transform={`rotate(-20 90 ${143 - s * 1.1})`} />
          <ellipse cx="110" cy={143 - s * 1.1} rx="7" ry="4" fill="#7ad87a" transform={`rotate(20 110 ${143 - s * 1.1})`} />
        </g>

        {/* Stage 7-10: Main trunk (thickens) */}
        <g opacity={opacity(7, 11)}>
          <rect x={98 - s * 0.2} y={120 - s * 1.5} width={4 + s * 0.3} height={65 + s * 1.5} rx="3" fill="#6b4226" />
        </g>

        {/* Stage 8-10: Lower branches */}
        <g opacity={opacity(8, 10)}>
          <line x1={100 - s * 0.2} y1={130 - s * 1} x2={80 - s * 0.5} y2={125 - s * 1} stroke="#6b4226" strokeWidth="3" strokeLinecap="round" />
          <line x1={100 + s * 0.2} y1={130 - s * 1} x2={120 + s * 0.5} y2={125 - s * 1} stroke="#6b4226" strokeWidth="3" strokeLinecap="round" />
        </g>

        {/* Stage 9-11: Mid branches */}
        <g opacity={opacity(9, 12)}>
          <line x1={100 - s * 0.2} y1={110 - s * 1.3} x2={75 - s * 0.5} y2={103 - s * 1.3} stroke="#6b4226" strokeWidth="2.5" strokeLinecap="round" />
          <line x1={100 + s * 0.2} y1={110 - s * 1.3} x2={125 + s * 0.5} y2={103 - s * 1.3} stroke="#6b4226" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* Stage 10-12: Upper branches */}
        <g opacity={opacity(10, 13)}>
          <line x1={100 - s * 0.2} y1={95 - s * 1.5} x2={78 - s * 0.3} y2={87 - s * 1.5} stroke="#6b4226" strokeWidth="2" strokeLinecap="round" />
          <line x1={100 + s * 0.2} y1={95 - s * 1.5} x2={122 + s * 0.3} y2={87 - s * 1.5} stroke="#6b4226" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Stage 8-10: Small branch leaves */}
        <g opacity={opacity(8, 10)}>
          <ellipse cx="78" cy={122 - s * 1} rx="8" ry="5" fill="#6bcf6b" transform="rotate(-15 78 122)" opacity={opacity(8, 10) * 0.7} />
          <ellipse cx="122" cy={122 - s * 1} rx="8" ry="5" fill="#6bcf6b" transform="rotate(15 122 122)" opacity={opacity(8, 10) * 0.7} />
        </g>

        {/* Stage 10-12: Mid branch leaves */}
        <g opacity={opacity(10, 12)}>
          <ellipse cx="72" cy={100 - s * 1.3} rx="10" ry="6" fill="#7ad87a" transform="rotate(-20 72 100)" opacity={opacity(10, 12) * 0.7} />
          <ellipse cx="128" cy={100 - s * 1.3} rx="10" ry="6" fill="#7ad87a" transform="rotate(20 128 100)" opacity={opacity(10, 12) * 0.7} />
        </g>

        {/* Stage 9-13: Canopy cloud clusters */}
        <g opacity={opacity(9, 14)}>
          <ellipse cx={100 - s * 0.5} cy={85 - s * 1.5} rx={12 + s * 0.5} ry={10 + s * 0.4} fill="#3a8c3f" opacity={0.6} />
          <ellipse cx={100 + s * 0.5} cy={80 - s * 1.5} rx={14 + s * 0.5} ry={11 + s * 0.4} fill="#4a9c4f" opacity={0.6} />
          <ellipse cx={100} cy={75 - s * 1.5} rx={16 + s * 0.5} ry={12 + s * 0.4} fill="#5cb85c" opacity={0.6} />
        </g>

        {/* Stage 12-15: Expanding canopy */}
        <g opacity={opacity(12, 15)}>
          <ellipse cx={90 - s * 0.2} cy={72 - s * 1.5} rx={15 + s * 0.4} ry={10 + s * 0.3} fill="#6bcf6b" opacity={0.5} />
          <ellipse cx={110 + s * 0.2} cy={70 - s * 1.5} rx={15 + s * 0.4} ry={10 + s * 0.3} fill="#7ad87a" opacity={0.5} />
          <ellipse cx={100} cy={65 - s * 1.5} rx={18 + s * 0.4} ry={13 + s * 0.3} fill="#8be88b" opacity={0.5} />
        </g>

        {/* Stage 14-15: Dense top canopy */}
        <g opacity={opacity(14, 15)}>
          <ellipse cx={90} cy={58 - s * 1.2} rx={14} ry={9} fill="#5cb85c" opacity={0.4} />
          <ellipse cx={110} cy={55 - s * 1.2} rx={14} ry={9} fill="#6bcf6b" opacity={0.4} />
          <ellipse cx={100} cy={50 - s * 1.2} rx={16} ry={11} fill="#7ad87a" opacity={0.4} />
        </g>

        {/* Stage 13-15: Fruits/flowers */}
        <g opacity={opacity(13, 15)}>
          <circle cx="85" cy={90 - s * 1.2} r="2.5" fill="#F5C518" opacity={0.8} />
          <circle cx="115" cy={85 - s * 1.2} r="2.5" fill="#F5C518" opacity={0.8} />
          <circle cx="95" cy={78 - s * 1.2} r="2" fill="#F5C518" opacity={0.7} />
          <circle cx="108" cy={72 - s * 1.2} r="2" fill="#F5C518" opacity={0.7} />
        </g>

        {/* Stage 15: Final glow */}
        {s >= 15 && (
          <circle cx="100" cy={40} r="30" fill="none" stroke="#F5C518" strokeWidth="1" opacity={0.4}>
            <animate attributeName="r" values="28;35;28" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0.6;0.3" dur="3s" repeatCount="indefinite" />
          </circle>
        )}
        {s >= 15 && (
          <circle cx="100" cy={40} r="20" fill="#F5C518" opacity={0.15}>
            <animate attributeName="r" values="18;25;18" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.1;0.25;0.1" dur="3s" repeatCount="indefinite" />
          </circle>
        )}

        {/* Sparkles at stages 14-15 */}
        {[14, 15].includes(s) && (
          <g>
            {[{x:75,y:65},{x:125,y:60},{x:90,y:50},{x:110,y:45},{x:100,y:35}].map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="1.5" fill="#F5C518" opacity={0}>
                <animate attributeName="opacity" values="0;0.8;0" dur={`${1.5 + i * 0.3}s`} repeatCount="indefinite" begin={`${i * 0.5}s`} />
              </circle>
            ))}
          </g>
        )}
      </svg>
    </div>
  )
}
