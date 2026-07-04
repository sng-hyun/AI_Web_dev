import Link from "next/link";
import UploadForm from "./upload-form";

export default function UploadPage() {
  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <section className="bg-black px-6 py-8 text-white">
        <div className="mx-auto max-w-4xl">
          <Link className="text-sm font-bold text-white/60 hover:text-white" href="/">
            대시보드로 이동
          </Link>
          <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-5xl">
            국민연금 기준 파일 업로드
          </h1>
          <p className="mt-4 text-base leading-7 text-white/70">
            첫 번째 시트의 발행기관, 발행기관명, 보고서 작성기준일, 지분율을
            읽어 기준 보유 데이터를 갱신합니다.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-10">
        <UploadForm />
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
