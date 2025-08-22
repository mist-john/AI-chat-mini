"use client"
import ChatModal from "@/components/ChatModal";

export default function ModalStandalone() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      backgroundColor: 'transparent' // or just delete this line
    }}>
      <ChatModal 
        isOpen={true}
        onClose={() => {}}
      />
    </div>
  );
}
