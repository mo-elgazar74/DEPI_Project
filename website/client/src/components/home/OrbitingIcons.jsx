import {
  Book,
  Calendar,
  Coffee,
  FileText,
  Globe,
  Image as ImageIcon,
  Info,
  Lightbulb,
  MessageSquare,
  Mic,
  Music,
  Play,
  Settings,
  Share2,
  Briefcase,
  Cpu,
} from "lucide-react";

import d_model from "@/public/3d.glb";
import modeltwo from "@/public/model2.glb";
const outerIcons = [
  { Icon: Mic, angle: 0 },
  { Icon: Play, angle: 45 },
  { Icon: Calendar, angle: 90 },
  { Icon: Globe, angle: 135 },
  { Icon: FileText, angle: 180 },
  { Icon: Lightbulb, angle: 225 },
  { Icon: Music, angle: 270 },
  { Icon: Book, angle: 315 },
];

const innerIcons = [
  { Icon: Briefcase, angle: 22.5 },
  { Icon: Cpu, angle: 67.5 },
  { Icon: Share2, angle: 112.5 },
  { Icon: Settings, angle: 157.5 },
  { Icon: Info, angle: 202.5 },
  { Icon: MessageSquare, angle: 247.5 },
  { Icon: Coffee, angle: 292.5 },
  { Icon: ImageIcon, angle: 337.5 },
];

// const BOT_MODEL_SRC = "/3d.glb"; // حط اسم ملفك هنا

export default function OrbitingIcons() {
  return (  
    <div
      className="relative flex h-full w-full items-center justify-center"
      style={{ perspective: "1000px" }}
    >
      {/* Container: 400px on mobile, 700px on desktop */}
      <div className="relative h-[400px] w-[400px] lg:h-[700px] lg:w-[700px] max-h-[95vw] max-w-[95vw]">
        {/* Enhanced outer glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-blue-500/10 blur-3xl" />

        {/* Enhanced outer orbital ring - 360px on mobile (90% of 400px), 630px on desktop */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="h-[360px] w-[360px] lg:h-[630px] lg:w-[630px] rounded-full border-[2px] lg:border-[3px] border-blue-400/70 animate-orbit shadow-2xl"
            style={{ 
              animationDuration: "80s",
              boxShadow: "0 0 20px rgba(59, 130, 246, 0.4), 0 0 40px rgba(59, 130, 246, 0.2), inset 0 0 20px rgba(59, 130, 246, 0.1)"
            }}
          />
        </div>

        {/* Enhanced inner orbital ring - 248px on mobile (62% of 400px), 434px on desktop */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="h-[248px] w-[248px] lg:h-[434px] lg:w-[434px] rounded-full border-[2px] lg:border-[3px] border-blue-400/70 animate-orbit shadow-2xl"
            style={{ 
              animationDuration: "60s", 
              animationDirection: "reverse",
              boxShadow: "0 0 20px rgba(59, 130, 246, 0.4), 0 0 40px rgba(59, 130, 246, 0.2), inset 0 0 20px rgba(59, 130, 246, 0.1)"
            }}
          />
        </div>

        {/* Outer icons orbit - positioned exactly on the ring */}
        <div className="absolute inset-0 animate-orbit" style={{ animationDuration: "60s" }}>
          {outerIcons.map((item, index) => {
            // Outer ring radius is 315px (630px / 2)
            const radius = 315;
            const angleRad = (item.angle * Math.PI) / 180;
            const x = radius * Math.cos(angleRad - Math.PI / 2);
            const y = radius * Math.sin(angleRad - Math.PI / 2);

            return (
              <div
                key={`outer-${index}`}
                className="absolute left-1/2 top-1/2 mobile-orbit-outer"
                style={{
                  '--x-mobile': `${x * 0.57}px`,
                  '--y-mobile': `${y * 0.57}px`,
                  '--x-desktop': `${x}px`,
                  '--y-desktop': `${y}px`,
                  transform: `translate(calc(-50% + var(--x-mobile)), calc(-50% + var(--y-mobile)))`,
                }}
              >
                <div
                  className="relative flex h-12 w-12 lg:h-20 lg:w-20 items-center justify-center hover:scale-125 transition-transform duration-300"
                  style={{
                    animation: "orbit 60s linear infinite reverse",
                  }}
                >
                  <item.Icon
                    className="h-7 w-7 lg:h-12 lg:w-12 text-[#004a6e] drop-shadow-2xl hover:text-blue-100 transition-colors"
                    strokeWidth={2}
                    style={{ filter: "drop-shadow(0 0 8px #63b7dfff) drop-shadow(0 0 8px #63b7dfff)" }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Inner icons orbit - positioned exactly on the ring */}
        <div
          className="absolute inset-0 animate-orbit"
          style={{ animationDuration: "45s", animationDirection: "reverse" }}
        >
          {innerIcons.map((item, index) => {
            // Inner ring radius is 217px (434px / 2)
            const radius = 217;
            const angleRad = (item.angle * Math.PI) / 180;
            const x = radius * Math.cos(angleRad - Math.PI / 2);
            const y = radius * Math.sin(angleRad - Math.PI / 2);

            return (
              <div
                key={`inner-${index}`}
                className="absolute left-1/2 top-1/2 mobile-orbit-inner"
                style={{
                  '--x-mobile': `${x * 0.57}px`,
                  '--y-mobile': `${y * 0.57}px`,
                  '--x-desktop': `${x}px`,
                  '--y-desktop': `${y}px`,
                  transform: `translate(calc(-50% + var(--x-mobile)), calc(-50% + var(--y-mobile)))`,
                }}
              >
                <div
                  className="relative flex h-10 w-10 lg:h-16 lg:w-16 items-center justify-center hover:scale-125 transition-transform duration-300"
                  style={{
                    animation: "orbit 45s linear infinite",
                  }}
                >
                  <item.Icon
                    className="h-6 w-6 lg:h-10 lg:w-10 text-[#004a6e] drop-shadow-2xl hover:text-purple-100 transition-colors"
                    strokeWidth={2}
                    style={{ filter: "drop-shadow(0 0 8px #63b7dfff) drop-shadow(0 0 8px #63b7dfff)" }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Center 3D bot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Enhanced glow */}
            <div className="absolute inset-0 scale-150 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-3xl" />

            {/* 3D Model - responsive sizing */}
            <model-viewer
              src={d_model}
              auto-rotate
              auto-rotate-delay="500"
              rotation-per-second="30deg"
              camera-controls
              disable-zoom
              shadow-intensity="0.6"
              exposure="1.0"
              environment-image="neutral"
              className="relative z-10"
              style={{ 
                width: '200px',
                height: '200px',
                filter: "drop-shadow(0 10px 30px rgba(59,130,246,0.35))"
              }}
            />
            <style dangerouslySetInnerHTML={{__html: `
              @media (min-width: 1024px) {
                .mobile-orbit-outer,
                .mobile-orbit-inner {
                  transform: translate(calc(-50% + var(--x-desktop)), calc(-50% + var(--y-desktop))) !important;
                }
                model-viewer {
                  width: 300px !important;
                  height: 300px !important;
                }
              }
            `}} />
          </div>
        </div>
      </div>
    </div>
  );
}
