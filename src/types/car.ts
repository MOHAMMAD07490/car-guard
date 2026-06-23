export interface CarProfile {
  id: string;
  ownerName: string;
  carNumber: string;
  phoneNumber: string;
  carModel?: string;
  carColor?: string;
  createdAt: number;
}

export interface AlertMessage {
  id: string;
  carId: string;
  message: string;
  alertType: 'parking' | 'lights' | 'emergency' | 'general';
  senderNote?: string;
  timestamp: number;
  read: boolean;
}
