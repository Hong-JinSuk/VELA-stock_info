import { modalAtom } from '@/store/modal-atom';
import { Modal } from '@/types/modal';
import { useSetAtom } from 'jotai';

export default function useModal() {
  const setModal = useSetAtom(modalAtom);

  const openSignupModal = () => {
    setModal({
      isOpen: true,
      type: 'login',
      data: null,
    });
  };

  const openConfirmModal = (data: Modal['data']) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      data,
    });
  };

  return {
    openSignupModal,
    openConfirmModal,
  };
}
