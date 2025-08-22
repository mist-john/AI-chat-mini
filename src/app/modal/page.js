import ChatModal from "@/components/ChatModal";

export default function ModalPage() {
    return (
      <div style={{ 
        background: 'transparent', 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <ChatModal />
      </div>
    );
  }