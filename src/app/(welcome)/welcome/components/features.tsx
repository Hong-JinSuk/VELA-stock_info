import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FadeInView } from '@/motion/fade-in-view';
import { featuresData } from '../data/features-data';

export function Features() {
  return (
    <FadeInView>
      <section
        id="features"
        className="py-24 border-t border-border bg-[#F8FAFC]/80 dark:bg-[#0c0e12]"
      >
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="mb-16 max-w-2xl">
            <h2 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight mb-4">
              데이터의 홍수 속,
              <br />
              오직 가치 있는 정보만 남깁니다.
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              어지러운 차트와 숫자들은 전문가에게 맡기세요.
              <br /> 우리는 철저하게 정제된 인사이트만을 담백하게 전달합니다.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {featuresData.map((feature, idx) => (
              <FadeInView key={idx}>
                <Card
                  className="h-full border transition-colors shadow-sm"
                  variant="artistic"
                >
                  <CardHeader>
                    <div className="w-12 h-12 rounded bg-blue-500/10 flex items-center justify-center mb-4">
                      <div className="text-blue-500">{feature.icon}</div>
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.desc}
                    </p>
                  </CardContent>
                </Card>
              </FadeInView>
            ))}
          </div>
        </div>
      </section>
    </FadeInView>
  );
}
