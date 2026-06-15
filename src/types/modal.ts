// confirm 모달에 넘기는 데이터 형태 (confirm-modal에서 구조분해해 사용).
export type ConfirmModalData = {
  title: string;
  description?: string;
  onClick?: () => void;
  buttonText?: string;
};

type ModalData = ConfirmModalData | null;
type ModalType = 'login' | 'confirm' | null;

export type Modal = {
  isOpen: boolean;
  type: ModalType;
  data: ModalData;
};

export type ModalProps = {
  isOpen: boolean;
  closeModal: () => void;
  data?: Modal['data'];
};
