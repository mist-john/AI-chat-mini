import ChatModal from "@/components/ChatModal";

import { useState } from 'react';
import YourModalComponent from '../../components/YourModalComponent'; // Adjust the path

export default function ModalStandalone() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <ChatModal 
        isOpen={true}
        onClose={() => {}}
      />
    </div>
  );
}