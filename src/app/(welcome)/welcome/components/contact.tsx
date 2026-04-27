import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ContactData, useContact } from '@/lib/queries/mail/use-contact';
import { FadeInView } from '@/motion/fade-in-view';
import { useState } from 'react';
import { toast } from 'sonner';

export function Contact() {
  const {
    postContact: { mutateAsync: sendMail },
  } = useContact();

  const [mailForm, setMailForm] = useState<ContactData>({
    author: '',
    authorEmail: '',
    title: '',
    content: '',
  });

  const handleChangeMailForm = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { id, value } = e.target;
    setMailForm((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSendMail = () => {
    if (
      !mailForm.author ||
      !mailForm.authorEmail ||
      !mailForm.title ||
      !mailForm.content
    ) {
      toast.warning('모든 항목을 입력해 주세요.');
      return;
    }
    toast.promise(sendMail(mailForm), {
      loading: '메일을 보내는 중입니다...',
      success: '메일을 성공적으로 보냈습니다! 📧',
      error: '메일 전송에 실패했습니다. 다시 시도해주세요.',
    });
  };

  return (
    <section
      id="contact"
      className="py-32 border-t border-black/10 dark:border-white/10 bg-slate-50/50 dark:bg-[#0c0e12]"
    >
      <div className="max-w-[1440px] mx-auto px-8">
        <FadeInView className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight mb-4">
            새로운 투자의 시작,
            <br />
            VELA와 함께하세요.
          </h2>
          <p className="text-muted-foreground text-lg">
            개선 사항이나 오류를 발견하시면 제보해 주세요. 검토 후 신속하게
            반영하겠습니다.
          </p>
        </FadeInView>

        <FadeInView delay={0.2} className="max-w-xl mx-auto">
          <Card variant="artistic" className="shadow-none">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl text-center font-bold">
                Contact <span className="text-sky-600">V.E.L.A</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="author">이름 (Name)</Label>
                    <Input
                      id="author"
                      value={mailForm.author}
                      onChange={handleChangeMailForm}
                      placeholder="홍길동"
                      className="bg-transparent border-black/10 dark:border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="authorEmail">이메일 (Email)</Label>
                    <Input
                      id="authorEmail"
                      value={mailForm.authorEmail}
                      onChange={handleChangeMailForm}
                      type="email"
                      placeholder="hello@example.com"
                      className="bg-transparent border-black/10 dark:border-white/10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">제목 (Title)</Label>
                  <Input
                    id="title"
                    value={mailForm.title}
                    onChange={handleChangeMailForm}
                    placeholder="[오류/건의] 제목"
                    className="bg-transparent border-black/10 dark:border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">문의 내용 (Message)</Label>
                  <Textarea
                    id="content"
                    value={mailForm.content}
                    onChange={handleChangeMailForm}
                    placeholder="문의하실 내용을 자유롭게 적어주세요."
                    className="min-h-[150px] bg-transparent border-black/10 dark:border-white/10 resize-none"
                  />
                </div>

                <Button
                  onClick={() => handleSendMail()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-base shadow-none cursor-pointer"
                >
                  Send
                </Button>
              </form>
            </CardContent>
          </Card>
        </FadeInView>
      </div>
    </section>
  );
}
