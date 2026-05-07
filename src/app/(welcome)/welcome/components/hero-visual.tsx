import { motion } from 'motion/react';

export default function HeroVisual() {
  return (
    // vela(돛, 방향) 느낌
    <div className="hidden lg:flex p-8 lg:p-0 items-center justify-center relative bg-[radial-gradient(circle_at_70%_30%,#e2e8f0_0%,#F8FAFC_100%)] dark:bg-[radial-gradient(circle_at_70%_30%,#1E293B_0%,#0F1115_100%)] border-t lg:border-t-0 border-black/10 dark:border-white/10 overflow-hidden min-h-[500px] h-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1 w-full max-w-md lg:max-w-none relative flex justify-center items-center"
      >
        {/* Abstract visual: Sailing Scene */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[450px] h-[450px] flex items-center justify-center relative">
            {/* Subtle background orbits / Nautical Compass */}
            <div className="absolute w-[85%] h-[85%] rounded-full border border-black/[0.04] dark:border-white/[0.04] border-dashed"></div>
            <div className="absolute w-[55%] h-[55%] rounded-full border border-black/[0.04] dark:border-white/[0.04]"></div>

            <svg
              width="100%"
              height="100%"
              viewBox="0 0 400 400"
              className="absolute inset-0 !overflow-visible"
            >
              <defs>
                <filter
                  id="glow-star"
                  x="-50%"
                  y="-50%"
                  width="200%"
                  height="200%"
                >
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Subtle translucent gradients for the sails */}
                <linearGradient
                  id="sail-gradient-left"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient
                  id="sail-gradient-right"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1" />
                </linearGradient>
              </defs>

              {/* BACKGROUND CONSTELLATION (Top Right) */}
              <g
                stroke="#3B82F6"
                strokeWidth="1"
                className="opacity-30 dark:opacity-50"
              >
                {/* Constellation Lines */}
                <motion.line
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, delay: 0.2 }}
                  x1="328"
                  y1="30"
                  x2="365"
                  y2="45"
                />
                <motion.line
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, delay: 0.4 }}
                  x1="328"
                  y1="30"
                  x2="312"
                  y2="68"
                />
                <motion.line
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, delay: 0.6 }}
                  x1="365"
                  y1="45"
                  x2="350"
                  y2="75"
                />
                <motion.line
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, delay: 0.8 }}
                  x1="312"
                  y1="68"
                  x2="350"
                  y2="75"
                />
                <motion.line
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, delay: 1.0 }}
                  x1="350"
                  y1="75"
                  x2="380"
                  y2="98"
                />

                {/* Star Dots */}
                <g filter="url(#glow-star)">
                  <motion.circle
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{
                      delay: 1.2,
                      scale: { repeat: Infinity, duration: 2 },
                    }}
                    cx="328"
                    cy="30"
                    r="3.5"
                    fill="#3B82F6"
                  />
                  <motion.circle
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.3 }}
                    cx="328"
                    cy="30"
                    r="1"
                    fill="#fff"
                  />
                  <motion.circle
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.4 }}
                    cx="365"
                    cy="45"
                    r="2"
                    fill="#3B82F6"
                  />
                  <motion.circle
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.5 }}
                    cx="312"
                    cy="68"
                    r="2"
                    fill="#3B82F6"
                  />
                  <motion.circle
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.6 }}
                    cx="350"
                    cy="75"
                    r="2.5"
                    fill="#3B82F6"
                  />
                  <motion.circle
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.7 }}
                    cx="380"
                    cy="98"
                    r="1.5"
                    fill="#3B82F6"
                  />
                </g>
              </g>

              {/* OCEAN WAVES (Bottom) - Layered slightly over the hull bottom */}
              <motion.g
                stroke="#3B82F6"
                strokeWidth="1.5"
                fill="none"
                className="opacity-30 dark:opacity-40"
                animate={{ x: [0, -30, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 8,
                  ease: 'easeInOut',
                }}
              >
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, delay: 0.8 }}
                  d="M -50 295 Q 50 320 150 295 T 350 295 T 550 295"
                />
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, delay: 1.0 }}
                  d="M -10 320 Q 90 340 190 320 T 390 320 T 590 320"
                />
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, delay: 1.2 }}
                  d="M -80 345 Q 20 365 120 345 T 320 345 T 520 345"
                />
              </motion.g>

              {/* MAIN SAILBOAT (Center) */}
              <motion.g
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.5, delay: 0.2 }}
              >
                <motion.g
                  animate={{
                    x: [-8, 8, -8],
                    y: [-6, 6, -6],
                    rotate: [-2, 2, -2],
                  }}
                  style={{ transformOrigin: '195px 295px' }}
                  transition={{
                    x: { repeat: Infinity, duration: 9, ease: 'easeInOut' },
                    y: { repeat: Infinity, duration: 4, ease: 'easeInOut' },
                    rotate: {
                      repeat: Infinity,
                      duration: 6,
                      ease: 'easeInOut',
                    },
                  }}
                >
                  {/* Mast */}
                  <motion.line
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: 0.6 }}
                    x1="195"
                    y1="70"
                    x2="195"
                    y2="295"
                    stroke="#3B82F6"
                    strokeWidth="2"
                    className="opacity-80"
                  />

                  {/* Single Sail */}
                  <motion.path
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, delay: 0.8 }}
                    d="M 210 80 Q 350 170 280 255 L 210 255 Z"
                    stroke="#3B82F6"
                    strokeWidth="1.5"
                    className="opacity-90 fill-[url(#sail-gradient-right)]"
                  />

                  {/* Hull (Line art with subtle gradient to match sails) */}
                  <motion.path
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 1.2 }}
                    d="M 60 275 Q 195 295 330 275 L 280 320 L 110 320 Z"
                    stroke="#3B82F6"
                    strokeWidth="1.5"
                    className="fill-[url(#sail-gradient-right)] dark:fill-[#2A508C] stroke-[#3B82F6] opacity-90 transition-colors duration-300"
                  />
                </motion.g>
              </motion.g>
            </svg>

            {/* Floating ambient particles */}
            <motion.div
              animate={{
                y: [-15, 15, -15],
                x: [0, 10, 0],
                opacity: [0.2, 0.6, 0.2],
              }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="absolute w-[3px] h-[3px] bg-blue-500 rounded-full top-[15%] left-[25%]"
            />
            <motion.div
              animate={{
                y: [15, -15, 15],
                x: [0, -10, 0],
                opacity: [0.1, 0.5, 0.1],
              }}
              transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
              className="absolute w-[2px] h-[2px] bg-blue-400 rounded-full bottom-[20%] right-[15%]"
            />
            <motion.div
              animate={{ y: [-10, 10, -10], opacity: [0.3, 0.7, 0.3] }}
              transition={{
                repeat: Infinity,
                duration: 3.5,
                ease: 'easeInOut',
              }}
              className="absolute w-[2.5px] h-[2.5px] bg-blue-400 rounded-full top-[35%] right-[25%]"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// 기존 Default Logo
// <div className="p-8 lg:p-0 flex items-center justify-center relative bg-[radial-gradient(circle_at_70%_30%,#e2e8f0_0%,#F8FAFC_100%)] dark:bg-[radial-gradient(circle_at_70%_30%,#1E293B_0%,#0F1115_100%)] border-t lg:border-t-0 border-black/10 dark:border-white/10 overflow-hidden min-h-[500px]">
//   <motion.div
//     initial={{ opacity: 0, scale: 0.95 }}
//     animate={{ opacity: 1, scale: 1 }}
//     transition={{ duration: 1.5, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
//     className="flex-1 w-full max-w-md lg:max-w-none relative flex justify-center items-center"
//   >
//     <div className="absolute inset-0 flex items-center justify-center">
//       <div className="w-[400px] h-[400px] rounded-full border border-black/10 dark:border-white/10 flex items-center justify-center relative">
//         <div className="w-[70%] h-[70%] rounded-full border border-blue-500/40 relative" />

//         {/* 데이터 포인트 시뮬레이션 */}
//         <div className="absolute w-[6px] h-[6px] bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,1)] top-[20%] right-[20%]" />
//         <div className="absolute w-[6px] h-[6px] bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,1)] bottom-[30%] left-[10%]" />
//         <div className="absolute w-[6px] h-[6px] bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,1)] top-[50%] -right-[3px]" />

//         <svg
//           width="300"
//           height="200"
//           viewBox="0 0 300 200"
//           className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none !overflow-visible"
//         >
//           <path
//             d="M0,150 Q75,140 150,100 T300,20"
//             fill="none"
//             stroke="#3B82F6"
//             strokeWidth="2"
//             opacity="0.6"
//           />
//         </svg>
//       </div>
//     </div>
//   </motion.div>
// </div>
