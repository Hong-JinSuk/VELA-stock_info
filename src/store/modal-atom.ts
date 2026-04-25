import { Modal } from '@/types/modal';
import { atom } from 'jotai';

export const modalAtom = atom<Modal>({
  isOpen: false,
  type: null,
  data: null,
});
