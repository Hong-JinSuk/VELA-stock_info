type ModalData = any | null;
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
