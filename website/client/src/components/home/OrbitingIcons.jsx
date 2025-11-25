// import { Book, Calendar, Coffee, FileText, Globe, Image, Info, Lightbulb, MessageSquare, Mic, Music, Play, Settings, Share2, Briefcase, Cpu } from "lucide-react";
// import botImage from "@/public/model.png";

// const outerIcons = [
//   { Icon: Mic, angle: 0 },
//   { Icon: Play, angle: 45 },
//   { Icon: Calendar, angle: 90 },
//   { Icon: Globe, angle: 135 },
//   { Icon: FileText, angle: 180 },
//   { Icon: Lightbulb, angle: 225 },
//   { Icon: Music, angle: 270 },
//   { Icon: Book, angle: 315 },
// ];

// const innerIcons = [
//   { Icon: Briefcase, angle: 22.5 },
//   { Icon: Cpu, angle: 67.5 },
//   { Icon: Share2, angle: 112.5 },
//   { Icon: Settings, angle: 157.5 },
//   { Icon: Info, angle: 202.5 },
//   { Icon: MessageSquare, angle: 247.5 },
//   { Icon: Coffee, angle: 292.5 },
//   { Icon: Image, angle: 337.5 },
// ];

// export default function OrbitingIcons() {
//   return (
//     <div className="relative w-full h-full flex items-center justify-center" style={{ perspective: "1000px" }}>
//       <div className="relative w-[650px] h-[650px] max-w-[95vw] max-h-[95vw]">
//         {/* Outer glow effect */}
//         <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/5 via-chart-2/5 to-primary/5 blur-3xl" />
        
//         {/* Outer orbital ring */}
//         <div className="absolute inset-0 flex items-center justify-center">
//           <div className="w-[90%] h-[90%] rounded-full border-2 border-dashed border-primary/20 animate-orbit" 
//                style={{ animationDuration: "80s" }} />
//         </div>
        
//         {/* Inner orbital ring */}
//         <div className="absolute inset-0 flex items-center justify-center">
//           <div className="w-[62%] h-[62%] rounded-full border-2 border-dashed border-chart-2/20 animate-orbit" 
//                style={{ animationDuration: "60s", animationDirection: "reverse" }} />
//         </div>
        
//         {/* Outer icons orbit */}
//         <div className="absolute inset-0 animate-orbit" style={{ animationDuration: "60s" }}>
//           {outerIcons.map((item, index) => {
//             const containerSize = 650;
//             const radius = containerSize * 0.45;
//             const angleRad = (item.angle * Math.PI) / 180;
//             const x = radius * Math.cos(angleRad - Math.PI / 2);
//             const y = radius * Math.sin(angleRad - Math.PI / 2);
            
//             return (
//               <div
//                 key={`outer-${index}`}
//                 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
//                 style={{
//                   transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
//                 }}
//               >
//                 <div 
//                   className="relative flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-primary/90 to-chart-2/80 shadow-lg shadow-primary/20 border border-primary/30 hover:scale-110 transition-transform duration-300"
//                   style={{
//                     animation: "orbit 60s linear infinite reverse",
//                     transform: "rotateX(10deg) rotateY(-10deg)",
//                   }}
//                 >
//                   <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent" />
//                   <item.Icon className="w-8 h-8 md:w-10 md:h-10 text-[#2563eb] relative z-10" strokeWidth={1.5} />
//                 </div>
//               </div>
//             );
//           })}
//         </div>
        
//         {/* Inner icons orbit */}
//         <div className="absolute inset-0 animate-orbit" style={{ animationDuration: "45s", animationDirection: "reverse" }}>
//           {innerIcons.map((item, index) => {
//             const containerSize = 650;
//             const radius = containerSize * 0.31;
//             const angleRad = (item.angle * Math.PI) / 180;
//             const x = radius * Math.cos(angleRad - Math.PI / 2);
//             const y = radius * Math.sin(angleRad - Math.PI / 2);
            
//             return (
//               <div
//                 key={`inner-${index}`}
//                 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
//                 style={{
//                   transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
//                 }}
//               >
//                 <div 
//                   className="relative flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-chart-2/90 to-primary/80 shadow-md shadow-chart-2/20 border border-chart-2/30 hover:scale-110 transition-transform duration-300"
//                   style={{
//                     animation: "orbit 45s linear infinite",
//                     transform: "rotateX(-8deg) rotateY(8deg)",
//                   }}
//                 >
//                   <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 to-transparent" />
//                   <item.Icon className="w-7 h-7 md:w-8 md:h-8 text-[#2563eb] relative z-10" strokeWidth={1.5} />
//                 </div>
//               </div>
//             );
//           })}
//         </div>
        
//         {/* Center bot with enhanced 3D effect */}
//         <div className="absolute inset-0 flex items-center justify-center">
//           <div className="relative">
//             <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-chart-2/20 blur-2xl scale-150" />
//             <img 
//               src={botImage} 
//               alt="EduBot AI Assistant" 
//               className="w-56 h-56 md:w-64 md:h-64 object-contain animate-float relative z-10 drop-shadow-2xl"
//               style={{ filter: "drop-shadow(0 10px 30px rgba(59, 130, 246, 0.3))" }}
//             />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

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
      <div className="relative h-[650px] w-[650px] max-h-[95vw] max-w-[95vw]">
        {/* Outer glow effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/5 via-chart-2/5 to-primary/5 blur-3xl" />

        {/* Outer orbital ring */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="h-[90%] w-[90%] rounded-full border-2 border-dashed border-primary/20 animate-orbit"
            style={{ animationDuration: "80s" }}
          />
        </div>

        {/* Inner orbital ring */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="h-[62%] w-[62%] rounded-full border-2 border-dashed border-chart-2/20 animate-orbit"
            style={{ animationDuration: "60s", animationDirection: "reverse" }}
          />
        </div>

        {/* Outer icons orbit */}
        <div className="absolute inset-0 animate-orbit" style={{ animationDuration: "60s" }}>
          {outerIcons.map((item, index) => {
            const containerSize = 650;
            const radius = containerSize * 0.45;
            const angleRad = (item.angle * Math.PI) / 180;
            const x = radius * Math.cos(angleRad - Math.PI / 2);
            const y = radius * Math.sin(angleRad - Math.PI / 2);

            return (
              <div
                key={`outer-${index}`}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                }}
              >
                <div
                  className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/90 to-chart-2/80 shadow-lg shadow-primary/20 border border-primary/30 hover:scale-110 transition-transform duration-300"
                  style={{
                    animation: "orbit 60s linear infinite reverse",
                    transform: "rotateX(10deg) rotateY(-10deg)",
                  }}
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent" />
                  <item.Icon
                    className="relative h-8 w-8 md:h-10 md:w-10 text-[#2563eb]"
                    strokeWidth={1.5}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Inner icons orbit */}
        <div
          className="absolute inset-0 animate-orbit"
          style={{ animationDuration: "45s", animationDirection: "reverse" }}
        >
          {innerIcons.map((item, index) => {
            const containerSize = 650;
            const radius = containerSize * 0.31;
            const angleRad = (item.angle * Math.PI) / 180;
            const x = radius * Math.cos(angleRad - Math.PI / 2);
            const y = radius * Math.sin(angleRad - Math.PI / 2);

            return (
              <div
                key={`inner-${index}`}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                }}
              >
                <div
                  className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-chart-2/90 to-primary/80 shadow-md shadow-chart-2/20 border border-chart-2/30 hover:scale-110 transition-transform duration-300"
                  style={{
                    animation: "orbit 45s linear infinite",
                    transform: "rotateX(-8deg) rotateY(8deg)",
                  }}
                >
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 to-transparent" />
                  <item.Icon
                    className="relative h-7 w-7 md:h-8 md:w-8 text-[#2563eb]"
                    strokeWidth={1.5}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Center 3D bot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Glow تحت البوت */}
            <div className="absolute inset-0 scale-150 rounded-full bg-gradient-to-br from-primary/20 to-chart-2/20 blur-2xl" />

            {/* هنا الموديل 3D */}
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
              className="relative z-10 h-64 w-64 md:h-72 md:w-72"
              style={{ filter: "drop-shadow(0 10px 30px rgba(59,130,246,0.35))" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
