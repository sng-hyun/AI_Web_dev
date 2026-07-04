import Link from "next/link";
import DartScanForm from "./dart-scan-form";
import TelegramSettingsForm from "./telegram-settings-form";

const settings = [
  "Supabase 연결 정보",
  "DART API Key",
  "관리자 쓰기 키",
  "크론 실행 보안 키",
];

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <section className="bg-black px-6 py-8 text-white">
        <div className="mx-auto max-w-4xl">
          <Link className="text-sm font-bold text-white/60 hover:text-white" href="/">
            대시보드로 이동
          </Link>
          <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-5xl">
            설정 화면
          </h1>
          <p className="mt-4 text-base leading-7 text-white/70">
            민감한 키는 서버 환경변수로만 사용하고 클라이언트 컴포넌트에서
            가져오지 않습니다.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-4xl gap-6 px-6 py-10">
        <DartScanForm />
        <TelegramSettingsForm />

        <div className="grid gap-3">
          {settings.map((setting) => (
            <div
              className="flex items-center justify-between rounded-2xl border border-zinc-200 p-5"
              key={setting}
            >
              <span className="font-bold text-zinc-900">{setting}</span>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-black text-zinc-600">
                환경변수
              </span>
            </div>
          ))}
        </div>
      </section>

      <FooterNotice />
    </main>
  );
}

function FooterNotice() {
  return (
    <footer className="border-t border-zinc-200 px-6 py-8 text-center text-sm font-semibold text-zinc-600">
      본 서비스는 공시 기반 정보 제공용이며, 특정 종목의 매수·매도 권유가
      아닙니다.
    </footer>
  );
}
