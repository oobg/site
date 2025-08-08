import { Layout } from "@src/shared/ui";
import { JsonGenerator } from "@src/features/json-generator";

function ToolsPage() {
    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 py-12 space-y-10">
                {/* Hero */}
                <section className="relative overflow-hidden glass border border-border rounded-2xl p-10 raven-shadow">
                    <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-accent/20 blur-3xl" />
                    <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-accent-hover/20 blur-3xl" />
                    <div className="relative">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-background-secondary/60 text-xs text-text-secondary backdrop-blur">
                            <span>🧰</span>
                            <span>Production-ready Utilities</span>
                        </div>
                        <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight text-gradient">개발을 아름답게 만드는 도구들</h1>
                        <p className="mt-3 text-text-secondary text-lg md:text-xl">상업용 수준의 UI와 생산성. 지금 바로 활용 가능한 생성 도구들.</p>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <span className="px-3 py-1 rounded-full text-xs border border-border bg-background-secondary/60">AI 프렌들리</span>
                            <span className="px-3 py-1 rounded-full text-xs border border-border bg-background-secondary/60">반응형</span>
                            <span className="px-3 py-1 rounded-full text-xs border border-border bg-background-secondary/60">경량/고성능</span>
                        </div>
                    </div>
                </section>

                {/* JSON Generator */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-accent-hover/20 border border-border">🧬</div>
                            <div>
                                <h2 className="text-2xl font-semibold">JSON 생성기</h2>
                                <p className="text-sm text-text-secondary">샘플 데이터부터 CSV/JSONL까지, 원하는 형식으로 빠르게.</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass border border-border rounded-2xl p-6 raven-shadow">
                        <JsonGenerator />
                    </div>
                </section>
            </div>
        </Layout>
    );
}

export default ToolsPage;


