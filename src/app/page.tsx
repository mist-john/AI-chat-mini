'use client';

import { useState } from 'react';
import Image from 'next/image';
import ChatModal from '../components/ChatModal';



export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false);



  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="w-full h-full"
          style={{
            background:
              "radial-gradient(circle at center, #000000 0%, #000000 70%, #f35d38 100%)",
          }}
        >
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
          <video
            className="shadow-2xl"
            width={600}   // fixed width
            height={400}  // fixed height
            style={{ minWidth: "600px", minHeight: "400px", borderRadius: "50%" }}
            autoPlay
            muted
            loop
            playsInline
          >
            <source
              src="https://video.wixstatic.com/video/b05468_a88514db02f54492983be2816df27b44/720p/mp4/file.mp4"
              type="video/mp4"
            />
          </video>

          <div className="absolute inset-0 flex items-center  top-1/2 justify-start">
            <h1 className="text-white text-[50px] font-bold text-bottom">
              YOUR ASYNC
              <br /> AI COMPANION
            </h1>
          </div>

          </div>
        

  
          <div className="absolute top-[20%] bottom-[40%] left-0 right-[85%]">
            <Image
            src="https://static.wixstatic.com/media/b05468_574332580d1d4c53898357fd07614cc4~mv2.png/v1/fill/w_244,h_401,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/u2926181799_httpss_mj_runf0v3QQmizkw_anime_girl_with_twin_tai_382abecb-8976-4856-a227-1a83.png"              alt="Anime girl left"
              fill
              className="object-contain"
              priority
            />
          </div>
  
          <div className="absolute top-0 bottom-[40%] left-[70%] right-0">
            <Image
              src="https://static.wixstatic.com/media/b05468_b789c69a875b482faad0c103cee1d215~mv2.png/v1/fill/w_460,h_493,al_c,lg_1,q_85,enc_avif,quality_auto/u2926181799_httpss_mj_runf0v3QQmizkw_anime_girl_with_twin_tai_aab79948-d7ad-483b-b224-ab1f.png"
              alt="Anime girl right"
              fill
              className="object-contain"
              priority
            />
          </div>
       
        </div>
  
        <div className="absolute top-0 bottom-0 left-[15%] w-[1px]" style={{ backgroundColor: "#ffffff" }}></div>
        <div className="absolute top-0 bottom-0 left-[50%] w-[1px]" style={{ backgroundColor: "#ffffff" }}></div>
        <div className="absolute top-0 bottom-0 left-[70%] w-[1px]" style={{ backgroundColor: "#ffffff" }}></div>
        <div className="absolute left-0 right-0 top-[20%] h-[1px]" style={{ backgroundColor: "#ffffff" }}></div>
        <div className="absolute left-0 right-0 top-[60%] h-[1px]" style={{ backgroundColor: "#ffffff" }}></div>
      </div>
  
      <div className="absolute right-[10%] top-[65%] flex flex-col gap-4 z-30">
          <button
          onClick={() => setIsChatOpen(true)}
          className="
            text-white font-bold py-3 px-8 border border-white
            bg-transparent
            transition-colors duration-300
            hover:bg-gradient-to-r from-red-500 to-orange-400
            active:bg-red-600
          "
        >
          CHAT WITH KOA
        </button>

        <button onClick={() => window.open('https://koasync.gitbook.io/koasync', '_blank')}
          className="
            text-white font-bold py-3 px-8 border border-white
            bg-transparent
            transition-colors duration-300
            hover:bg-gradient-to-r from-red-500 to-orange-400
            active:bg-red-600
          "
        >
          READ GITBOOK
        </button>
      </div>

  
      Chat Modal
      <ChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      
    </main>
  );
  

  
}
