'use client';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useEmail } from '@/lib/services/auth/use-email';
import { SignupData, useSignup } from '@/lib/services/auth/use-signup';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

type Props = {
  isOpen: boolean;
  closeModal: () => void;
};

const passwordRegex =
  /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+|~={}\[\]:";'<>?,./]).{8,20}$/;

export default function SignupModal({ isOpen, closeModal }: Props) {
  // Step 상태 (1, 2, 3)
  const [current, setCurrent] = useState(1);
  const count = 3;

  // 폼 및 검증 상태
  const [signupForm, setSignupForm] = useState<SignupData>({
    email: '',
    name: '',
    password: '',
  });
  const [verifiedEmailNumber, setVerifiedEmailNumber] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({
    password: '',
    confirm: '',
  });

  const { duplicateEmail, sendCode, verifyCode } = useEmail();
  const { signup } = useSignup();

  // --- 상태 초기화 및 모달 닫기 ---
  const onClose = () => {
    setSignupForm({ email: '', name: '', password: '' });
    setVerifiedEmailNumber('');
    setConfirmPassword('');
    setErrors({ password: '', confirm: '' });
    setCurrent(1);
    closeModal();
  };

  const handleChangeSignupForm = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { id, value } = e.target;
    setSignupForm((prev) => ({ ...prev, [id]: value }));
  };

  // --- Step 1: 이메일 인증 로직 ---
  const handleSendCode = () => {
    if (!signupForm.email) {
      toast.warning('이메일을 입력해주세요.');
      return;
    }

    toast.promise(
      duplicateEmail.mutateAsync(signupForm.email).then((res) => {
        if (res.result) throw new Error('이미 사용 중인 이메일입니다.');
        return sendCode.mutateAsync(signupForm.email);
      }),
      {
        loading: '인증 코드를 발송 중입니다...',
        success: '인증 코드가 발송되었습니다! 📧',
        error: (e: Error) => e.message,
      },
    );
  };

  const handleVerifyCode = () => {
    if (!verifiedEmailNumber) {
      toast.warning('인증 코드를 입력해주세요.');
      return;
    }

    toast.promise(
      verifyCode.mutateAsync({
        email: signupForm.email,
        code: verifiedEmailNumber,
      }),
      {
        loading: '인증 코드를 확인 중입니다...',
        success: () => {
          setTimeout(() => handleNext(), 800);
          return '이메일 인증이 완료되었습니다! ✅';
        },
        error: '인증에 실패했습니다. 다시 시도해주세요.',
      },
    );
  };

  // --- Step 2: 비밀번호 검증 로직 ---
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChangeSignupForm(e);
    if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
  };

  const handlePasswordBlur = () => {
    if (signupForm.password && !passwordRegex.test(signupForm.password)) {
      setErrors((p) => ({
        ...p,
        password: '영문, 숫자, 특수문자를 포함하여 8~20자로 입력해주세요.',
      }));
    } else {
      setErrors((p) => ({ ...p, password: '' }));
    }
  };

  const handleConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (errors.confirm) setErrors((prev) => ({ ...prev, confirm: '' }));
  };

  const handleStep2Next = () => {
    const isPwValid = passwordRegex.test(signupForm.password);
    const isConfirmValid = signupForm.password === confirmPassword;

    setErrors({
      password: isPwValid
        ? ''
        : '영문, 숫자, 특수문자를 포함하여 8~20자로 입력해주세요.',
      confirm: isConfirmValid ? '' : '비밀번호가 일치하지 않습니다.',
    });

    if (isPwValid && isConfirmValid) handleNext();
  };

  // -- Step 3: 회원 가입 --
  const handleSignup = async () => {
    toast.promise(signup.mutateAsync(signupForm), {
      loading: '회원 가입 중입니다...',
      success: () => {
        onClose();
        return '회원 가입에 성공했습니다! 👍';
      },
      error: (e: Error) => e.message,
    });
  };

  // --- 슬라이드 제어 ---
  const handleNext = () => {
    if (current < count) setCurrent((prev) => prev + 1);
  };
  const handlePrev = () => {
    if (current > 1) setCurrent((prev) => prev - 1);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-[400px] p-6 transition-all overflow-hidden">
        <AlertDialogHeader className="flex flex-row items-center justify-between space-y-0">
          <AlertDialogTitle className="text-xl font-serif">
            Create Account
          </AlertDialogTitle>
          <Button variant={'none'} onClick={onClose} className="w-8 h-8 p-0">
            <X className="w-5 h-5" />
          </Button>
        </AlertDialogHeader>
        <AlertDialogDescription className="hidden"></AlertDialogDescription>

        <div className="py-4 relative min-h-[320px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {current === 1 && (
                <div className="space-y-4 p-1">
                  <h3 className="font-medium text-center">Welcome! 👋</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    먼저 사용하실 이메일 주소를 입력해 주세요.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="email">이메일 (Email)</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="email"
                        type="email"
                        value={signupForm.email}
                        onChange={handleChangeSignupForm}
                      />
                      <Button
                        variant="outline"
                        onClick={handleSendCode}
                        className="w-14"
                      >
                        Send
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="verify">
                      인증번호 (Certification number)
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="verify"
                        value={verifiedEmailNumber}
                        onChange={(e) => setVerifiedEmailNumber(e.target.value)}
                      />
                      <Button
                        onClick={handleVerifyCode}
                        variant="outline"
                        className="w-14"
                      >
                        Verify
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {current === 2 && (
                <div className="space-y-6 p-1">
                  <div className="text-center">
                    <h3 className="font-medium">Security 🔒</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      안전한 비밀번호를 설정해 주세요.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">비밀번호 (password)</Label>
                      <Input
                        id="password"
                        type="password"
                        value={signupForm.password}
                        onChange={handlePasswordChange}
                        onBlur={handlePasswordBlur}
                        placeholder="영문, 숫자, 특수문자 조합 8~20자"
                        className={cn(
                          errors.password &&
                            'border-destructive focus-visible:ring-destructive',
                        )}
                      />
                      {errors.password && (
                        <p className="text-[11px] font-medium text-destructive ml-1">
                          {errors.password}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        비밀번호 확인 (verify password)
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={handleConfirmChange}
                        placeholder="비밀번호를 다시 입력해주세요"
                        className={cn(
                          errors.confirm &&
                            'border-destructive focus-visible:ring-destructive',
                        )}
                      />
                      {errors.confirm && (
                        <p className="text-[11px] font-medium text-destructive ml-1">
                          {errors.confirm}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {current === 3 && (
                <div className="space-y-4 p-1">
                  <h3 className="font-medium text-center">Profile</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    마지막으로 닉네임을 설정합니다.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="name">이름 (name)</Label>
                    <Input
                      id="name"
                      value={signupForm.name}
                      onChange={handleChangeSignupForm}
                      placeholder="사용하실 이름을 입력해 주세요."
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Dots 인디케이터 */}
          <div className="flex justify-center gap-1.5 mt-6">
            {Array.from({ length: count }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  current === i + 1 ? 'w-6 bg-primary' : 'w-1.5 bg-muted',
                )}
              />
            ))}
          </div>
        </div>

        <AlertDialogFooter className="flex-row gap-2 sm:justify-between items-center mt-2">
          {current > 1 && (
            <Button variant="ghost" onClick={handlePrev}>
              Prev
            </Button>
          )}
          {current === 2 && (
            <Button onClick={handleStep2Next} className="ml-auto">
              Next Step
            </Button>
          )}
          {current === count && (
            <Button
              onClick={handleSignup}
              className="bg-emerald-600 hover:bg-emerald-700 ml-auto"
            >
              Create & Get Started
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// 'use client';

// import {
//   AlertDialog,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from '@/components/ui/alert-dialog';
// import { useEmail } from '@/hooks/use-email';
// import { SignupData } from '@/lib/queries/auth/use-signup';
// import { cn } from '@/lib/utils';
// import { X } from 'lucide-react';
// import { useEffect, useState } from 'react';
// import { toast } from 'sonner';
// import { Button } from '../ui/button';
// import {
//   Carousel,
//   CarouselApi,
//   CarouselContent,
//   CarouselItem,
// } from '../ui/carousel';
// import { Input } from '../ui/input';
// import { Label } from '../ui/label';

// type Props = {
//   isOpen: boolean;
//   closeModal: () => void;
// };

// // 정규식: 영문, 숫자, 특수문자 조합 8~20자
// const passwordRegex =
//   /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+|~={}\[\]:";'<>?,./]).{8,20}$/;

// export default function SignupModal({ isOpen, closeModal }: Props) {
//   // Carousel 상태
//   const [api, setApi] = useState<CarouselApi>();
//   const [current, setCurrent] = useState(0);
//   const [count, setCount] = useState(0);

//   // 폼 및 검증 상태
//   const [signupForm, setSignupForm] = useState<SignupData>({
//     email: '',
//     name: '',
//     password: '',
//   });
//   const [verifiedEmailNumber, setVerifiedEmailNumber] = useState<string>('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [errors, setErrors] = useState({
//     password: '',
//     confirm: '',
//   });

//   const { duplicateEmail, sendCode, verifyCode } = useEmail();

//   // --- 상태 초기화 및 모달 닫기 ---
//   const onClose = () => {
//     setSignupForm({ email: '', name: '', password: '' });
//     setVerifiedEmailNumber('');
//     setConfirmPassword('');
//     setErrors({ password: '', confirm: '' });
//     closeModal();
//   };

//   const handleChangeSignupForm = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
//   ) => {
//     const { id, value } = e.target;
//     setSignupForm((prev) => ({ ...prev, [id]: value }));
//   };

//   const handleKeyDown = (e: React.KeyboardEvent) => {
//     if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
//       console.log('test');
//       e.stopPropagation();
//       e.preventDefault();
//       e.nativeEvent.stopImmediatePropagation();
//     }
//   };

//   // --- Step 1: 이메일 인증 로직 ---
//   const handleSendCode = () => {
//     if (!signupForm.email) {
//       toast.warning('이메일을 입력해주세요.');
//       return;
//     }

//     toast.promise(
//       duplicateEmail.mutateAsync(signupForm.email).then((res) => {
//         if (res.result) throw new Error('이미 사용 중인 이메일입니다.');
//         return sendCode.mutateAsync(signupForm.email);
//       }),
//       {
//         loading: '인증 코드를 발송 중입니다...',
//         success: '인증 코드가 발송되었습니다! 📧',
//         error: (e) => e.message,
//       },
//     );
//   };

//   const handleVerifyCode = () => {
//     if (!verifiedEmailNumber) {
//       toast.warning('인증 코드를 입력해주세요.');
//       return;
//     }

//     toast.promise(
//       verifyCode.mutateAsync({
//         email: signupForm.email,
//         code: verifiedEmailNumber,
//       }),
//       {
//         loading: '인증 코드를 확인 중입니다...',
//         success: () => {
//           setTimeout(() => handleNext(), 800); // 0.8초 딜레이 후 부드럽게 이동
//           return '이메일 인증이 완료되었습니다! ✅';
//         },
//         error: '인증에 실패했습니다. 다시 시도해주세요.',
//       },
//     );
//   };

//   // --- Step 2: 비밀번호 검증 로직 ---

//   // 1) 비밀번호 입력 중: 값만 업데이트 (에러가 떠있었다면 타이핑 시점에 숨겨줌)
//   const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     handleChangeSignupForm(e);
//     if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
//   };

//   // 2) 비밀번호 포커스 아웃 (Blur): 이때 정규식 검증
//   const handlePasswordBlur = () => {
//     if (signupForm.password && !passwordRegex.test(signupForm.password)) {
//       setErrors((p) => ({
//         ...p,
//         password: '영문, 숫자, 특수문자를 포함하여 8~20자로 입력해주세요.',
//       }));
//     } else {
//       setErrors((p) => ({ ...p, password: '' }));
//     }
//   };

//   // 3) 확인란 입력 중: 값 업데이트 및 에러 숨김
//   const handleConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setConfirmPassword(e.target.value);
//     if (errors.confirm) setErrors((prev) => ({ ...prev, confirm: '' }));
//   };

//   // 4) Next Step 클릭: 전체 검증 후 통과 시 이동
//   const handleStep2Next = () => {
//     const isPwValid = passwordRegex.test(signupForm.password);
//     const isConfirmValid = signupForm.password === confirmPassword;

//     setErrors({
//       password: isPwValid
//         ? ''
//         : '영문, 숫자, 특수문자를 포함하여 8~20자로 입력해주세요.',
//       confirm: isConfirmValid ? '' : '비밀번호가 일치하지 않습니다.',
//     });

//     if (isPwValid && isConfirmValid) handleNext();
//   };

//   // --- Carousel 제어 ---
//   const handleNext = () => api?.scrollNext();
//   const handlePrev = () => api?.scrollPrev();

//   useEffect(() => {
//     if (!api) return;
//     setCount(api.scrollSnapList().length);
//     setCurrent(api.selectedScrollSnap() + 1);
//     api.on('select', () => {
//       setCurrent(api.selectedScrollSnap() + 1);
//     });
//   }, [api]);

//   return (
//     <AlertDialog open={isOpen} onOpenChange={onClose}>
//       <AlertDialogContent className="max-w-[400px] p-6 transition-all">
//         <AlertDialogHeader className="flex items-center justify-between">
//           <AlertDialogTitle className="text-xl font-serif">
//             Create Account
//           </AlertDialogTitle>
//           <Button variant={'none'} onClick={onClose} className="w-8 h-8 p-0">
//             <X className="w-5 h-5" />
//           </Button>
//         </AlertDialogHeader>
//         <AlertDialogDescription className="hidden"></AlertDialogDescription>

//         <div className="py-4">
//           <Carousel
//             setApi={setApi}
//             className="w-full"
//             opts={{ watchDrag: false }}
//           >
//             <CarouselContent>
//               {/* Step 1: 이메일 */}
//               <CarouselItem>
//                 <div className="space-y-4 p-1">
//                   <h3 className="font-medium text-center">Welcome! 👋</h3>
//                   <p className="text-sm text-muted-foreground text-center">
//                     먼저 사용하실 이메일 주소를 입력해 주세요.
//                   </p>
//                   <div className="space-y-2">
//                     <Label htmlFor="email">이메일 (Email)</Label>
//                     <div className="flex items-center space-x-2">
//                       <Input
//                         id="email"
//                         type="email"
//                         value={signupForm.email}
//                         onChange={handleChangeSignupForm}
//                         onKeyDown={handleKeyDown}
//                         onKeyDownCapture={handleKeyDown}
//                       />
//                       <Button
//                         variant="outline"
//                         onClick={handleSendCode}
//                         className="w-14"
//                       >
//                         Send
//                       </Button>
//                     </div>
//                   </div>
//                   <div className="space-y-2">
//                     <Label htmlFor="verify">
//                       인증번호 (Certification number)
//                     </Label>
//                     <div className="flex items-center space-x-2">
//                       <Input
//                         id="verify"
//                         value={verifiedEmailNumber}
//                         onChange={(e) => setVerifiedEmailNumber(e.target.value)}
//                         onKeyDown={handleKeyDown}
//                       />
//                       <Button
//                         onClick={handleVerifyCode}
//                         variant="outline"
//                         className="w-14"
//                       >
//                         Verify
//                       </Button>
//                     </div>
//                   </div>
//                 </div>
//               </CarouselItem>

//               {/* Step 2: 보안 (비밀번호) */}
//               <CarouselItem>
//                 <div className="space-y-6 p-1">
//                   <div className="text-center">
//                     <h3 className="font-medium">Security 🔒</h3>
//                     <p className="text-sm text-muted-foreground mt-1">
//                       안전한 비밀번호를 설정해 주세요.
//                     </p>
//                   </div>

//                   <div className="space-y-4">
//                     {/* 비밀번호 */}
//                     <div className="space-y-2">
//                       <Label htmlFor="password">비밀번호 (password)</Label>
//                       <Input
//                         id="password"
//                         type="password"
//                         value={signupForm.password}
//                         onChange={handlePasswordChange}
//                         onBlur={handlePasswordBlur}
//                         placeholder="영문, 숫자, 특수문자 조합 8~20자"
//                         className={cn(
//                           errors.password &&
//                             'border-destructive focus-visible:ring-destructive',
//                         )}
//                       />
//                       {errors.password && (
//                         <p className="text-[11px] font-medium text-destructive ml-1">
//                           {errors.password}
//                         </p>
//                       )}
//                     </div>

//                     {/* 비밀번호 확인 */}
//                     <div className="space-y-2">
//                       <Label htmlFor="confirmPassword">
//                         비밀번호 확인 (verify password)
//                       </Label>
//                       <Input
//                         id="confirmPassword"
//                         type="password"
//                         value={confirmPassword}
//                         onChange={handleConfirmChange}
//                         placeholder="비밀번호를 다시 입력해주세요"
//                         className={cn(
//                           errors.confirm &&
//                             'border-destructive focus-visible:ring-destructive',
//                         )}
//                       />
//                       {errors.confirm && (
//                         <p className="text-[11px] font-medium text-destructive ml-1">
//                           {errors.confirm}
//                         </p>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               </CarouselItem>

//               {/* Step 3: 프로필 */}
//               <CarouselItem>
//                 <div className="space-y-4 p-1">
//                   <h3 className="font-medium text-center">Profile</h3>
//                   <p className="text-sm text-muted-foreground text-center">
//                     마지막으로 닉네임을 설정합니다.
//                   </p>
//                   <div className="h-32 bg-secondary/50 rounded-lg flex items-center justify-center">
//                     Step 3 Content
//                   </div>
//                 </div>
//               </CarouselItem>
//             </CarouselContent>
//           </Carousel>

//           {/* Dots 인디케이터 */}
//           <div className="flex justify-center gap-1.5 mt-6">
//             {Array.from({ length: count }).map((_, i) => (
//               <div
//                 key={i}
//                 className={cn(
//                   'h-1.5 rounded-full transition-all duration-300',
//                   current === i + 1 ? 'w-6 bg-primary' : 'w-1.5 bg-muted',
//                 )}
//               />
//             ))}
//           </div>
//         </div>

//         <AlertDialogFooter className="flex-row gap-2 sm:justify-between items-center mt-2">
//           {/* 이전 버튼 */}
//           {current > 1 && (
//             <Button variant="ghost" onClick={handlePrev}>
//               Prev
//             </Button>
//           )}

//           {/* Step 2 전용 다음 버튼 */}
//           {current === 2 && (
//             <Button onClick={handleStep2Next} className="ml-auto">
//               Next Step
//             </Button>
//           )}

//           {/* 완료 버튼 */}
//           {current === count && (
//             <Button
//               onClick={onClose}
//               className="bg-emerald-600 hover:bg-emerald-700 ml-auto"
//             >
//               Get Started
//             </Button>
//           )}
//         </AlertDialogFooter>
//       </AlertDialogContent>
//     </AlertDialog>
//   );
// }
