"use client"
import ChatModal from "@/components/ChatModal";

export default function ModalStandalone() {
  return (
    <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      backgroundImage: "url('/images/back.jpg')",
      backgroundSize: 'cover',       // makes the image cover the full screen
      backgroundPosition: 'center',  // centers the image
      backgroundRepeat: 'no-repeat', // prevents tiling
    }}
  >
    <ChatModal 
      isOpen={true}
      onClose={() => {}}
    />
  </div>
  
  );
}
