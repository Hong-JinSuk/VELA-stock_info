'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Textarea } from '@/components/ui/textarea';
import { useContact } from '@/lib/services/mail/use-contact';
import { Mail } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { toast } from 'sonner';

const TITLE = '개발자에게 메일보내기';

// 이메일은 로그인 계정 값으로 고정(수정 불가)이라 편집 폼에선 제외한다.
type DraftForm = { author: string; title: string; content: string };
const EMPTY: DraftForm = { author: '', title: '', content: '' };

// 사이드바 하단(Admin 위) 진입점. 클릭 시 문의 폼 다이얼로그를 띄워 개발자에게 메일 발송.
// 로그인 유저에게만 노출. 이메일은 로그인 계정으로 자동 고정(수정 불가). 이름은 name→nickname
// 순으로 채우고 하나라도 있으면 잠금, 둘 다 없을 때만 직접 입력. 발송은 useContact → POST /mail.
export function NavDeveloperMail() {
  const { data: session } = useSession();
  const {
    postContact: { mutateAsync: sendMail, isPending },
  } = useContact();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<DraftForm>(EMPTY);

  const user = session?.user;
  const email = user?.email ?? ''; // 발송에 쓰는 고정 이메일(로그인 계정)
  // 이름: name → nickname 순. 하나라도 있으면 잠금(고정), 둘 다 없을 때만 직접 입력 허용.
  const defaultName = user?.name || user?.nickname || '';
  const nameLocked = defaultName !== '';
  const author = nameLocked ? defaultName : form.author;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleSend = async () => {
    if (!author || !email || !form.title || !form.content) {
      toast.warning('모든 항목을 입력해 주세요.');
      return;
    }
    const req = sendMail({
      author,
      authorEmail: email,
      title: form.title,
      content: form.content,
    });
    toast.promise(req, {
      loading: '메일을 보내는 중입니다...',
      success: '메일을 성공적으로 보냈습니다! 📧',
      error: '메일 전송에 실패했습니다. 다시 시도해주세요.',
    });
    try {
      await req;
      setForm(EMPTY);
      setOpen(false);
    } catch {
      // 실패 시 다이얼로그 유지(재시도). 에러 토스트는 위 toast.promise가 처리.
    }
  };

  // 로그인하지 않은 유저에겐 노출하지 않는다.
  if (!user) return null;

  return (
    <SidebarGroup className="mt-auto">
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu className="gap-y-1.5">
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setOpen(true)}
              className="w-full flex items-center py-4 px-3 rounded-xl transition-all text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent dark:text-white dark:hover:text-white cursor-pointer"
            >
              <Mail />
              <span>{TITLE}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>{TITLE}</DialogTitle>
            <DialogDescription className="break-keep">
              개선 사항이나 오류를 제보해 주세요. 검토 후 신속하게 반영하겠습니다.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="author">이름</Label>
                <Input
                  id="author"
                  value={author}
                  onChange={handleChange}
                  readOnly={nameLocked}
                  tabIndex={nameLocked ? -1 : undefined}
                  aria-readonly={nameLocked}
                  placeholder="홍길동"
                  className={
                    nameLocked
                      ? 'cursor-not-allowed bg-muted text-muted-foreground'
                      : undefined
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="authorEmail">이메일</Label>
                <Input
                  id="authorEmail"
                  type="email"
                  value={email}
                  readOnly
                  tabIndex={-1}
                  aria-readonly
                  title="로그인 계정 이메일로 자동 전송됩니다"
                  className="cursor-not-allowed bg-muted text-muted-foreground"
                />
              </div>
            </div>
            <p className="-mt-2 text-[11px] text-muted-foreground/60 break-keep">
              {nameLocked
                ? '이름과 이메일은 로그인 계정 정보로 자동 입력되며 수정할 수 없어요.'
                : '이메일은 로그인 계정으로 자동 입력되며 수정할 수 없어요.'}
            </p>
            <div className="space-y-2">
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                value={form.title}
                onChange={handleChange}
                placeholder="[오류/건의] 제목"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">내용</Label>
              <Textarea
                id="content"
                value={form.content}
                onChange={handleChange}
                placeholder="문의하실 내용을 자유롭게 적어주세요."
                className="min-h-[140px] resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">취소</Button>
            </DialogClose>
            <Button onClick={handleSend} disabled={isPending}>
              {isPending ? '보내는 중...' : '보내기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarGroup>
  );
}
