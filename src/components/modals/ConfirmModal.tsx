import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Modal } from '@/types/modal';

type Props = {
  isOpen: boolean;
  closeModal: () => void;
  data: Modal['data'];
};

export function ConfirmModal({ isOpen, closeModal, data }: Props) {
  if (!data) return null;

  const { title, description, onClick, buttonText } = data;

  return (
    <AlertDialog open={isOpen} onOpenChange={closeModal}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={closeModal}>취소</AlertDialogCancel>
          <AlertDialogAction onClick={onClick}>
            {buttonText || '확인'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
