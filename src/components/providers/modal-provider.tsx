'use client';

import { modalAtom } from '@/store/modal-atom';
import { useAtom } from 'jotai';
import { ConfirmModal } from '../modals/confirm-modal';
import SignupModal from '../modals/signup-modal';

export default function ModalProvider() {
  const [{ isOpen, type, data }, setModal] = useAtom(modalAtom);

  const closeModal = () => {
    setModal((prev) => ({
      ...prev,
      isOpen: false,
    }));
    setTimeout(() => {
      setModal((prev) => ({
        ...prev,
        data: null,
      }));
    }, 300);
  };

  return (
    <>
      <ConfirmModal
        isOpen={isOpen && type == 'confirm'}
        data={data}
        closeModal={closeModal}
      />
      <SignupModal
        isOpen={isOpen && type === 'login'}
        closeModal={closeModal}
      />
    </>
  );
}
