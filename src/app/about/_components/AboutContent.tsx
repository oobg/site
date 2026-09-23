import { Eyebrow } from '@components/ui/Eyebrow';
import styles from './AboutContent.module.css';

/* 소개 본문. 주인이 확정한 원고를 그대로 옮긴다 — 문장을 다듬거나 줄이지 않는다.
   강조(<strong>)도 원고의 굵은 구간 그대로다.
   요즘 관심 있는 것의 제목은 카테고리로 잇지 않는다. 카테고리 slug는 API 데이터라
   상수로 박으면 이름이 바뀌는 순간 조용히 깨진 링크가 된다. */
export function AboutContent() {
  return (
    <article className={styles.about}>
      <h1 className={styles.title}>소개</h1>

      <p className={styles.lead}>프론트엔드 개발을 하고 있습니다.</p>
      <p className={styles.body}>
        화면을 만드는 일을 좋아하지만, 화면만 잘 만드는 것으로는 충분하지 않다고 생각합니다. 왜 이
        기능이 필요한지, 사용자는 어떤 순서로 쓰는지, 나중에 기능이 늘어나도 지금의 구조를 계속
        가져갈 수 있는지를 같이 보는 편입니다.
      </p>
      <p className={styles.body}>
        처음부터 웹 개발만 해온 것은 아닙니다. 다른 종류의 시스템을 만들다가 웹으로 넘어왔고,
        그래서인지 눈에 보이는 결과보다{' '}
        <strong>어떤 입력이 들어왔을 때 어떻게 동작해야 하는지</strong>를 먼저 생각하는 습관이
        있습니다.
      </p>
      <p className={styles.body}>
        예측하기 어려운 동작이나 이유 없이 복잡한 구조를 별로 좋아하지 않습니다. 반대로 단순하지만
        규칙이 분명하고, 시간이 지나도 설명할 수 있는 코드를 좋아합니다.
      </p>
      <p className={styles.body}>
        이곳에는 일을 하면서 알게 된 것뿐 아니라, 그렇게 판단한 이유도 같이 남기려고 합니다.
      </p>

      <section className={styles.block} aria-labelledby="about-work">
        <Eyebrow as="h2" id="about-work">
          일하는 방식
        </Eyebrow>

        <div className={styles.item}>
          <h3 className={styles.itemTitle}>실제로 어떻게 쓰이는지부터 봅니다</h3>
          <p className={styles.body}>
            기술적으로 깔끔한 구조가 항상 좋은 구조라고 생각하지 않습니다.
          </p>
          <p className={styles.body}>
            사용자가 실제로 어떤 순서로 일을 하는지, 어디에서 반복해서 멈추는지, 지금 해결하려는
            문제가 정말 코드의 문제인지부터 확인하려고 합니다.
          </p>
          <p className={styles.body}>처음 예상했던 문제와 실제 문제가 다른 경우가 꽤 많았습니다.</p>
          <p className={styles.body}>그래서 가능하면 구현부터 시작하기보다 먼저 흐름을 봅니다.</p>
        </div>

        <div className={styles.item}>
          <h3 className={styles.itemTitle}>반복되는 판단은 규칙으로 남깁니다</h3>
          <p className={styles.body}>프로젝트가 커질수록 사람이 기억해야 하는 것이 많아집니다.</p>
          <p className={styles.body}>
            처음에는 모두 알고 있던 규칙도 시간이 지나면 조금씩 달라집니다. 컴포넌트를 어떻게
            만들어야 하는지, 어떤 표현을 써야 하는지, 어떤 구조를 피해야 하는지도 마찬가지입니다.
          </p>
          <p className={styles.body}>
            그래서 반복해서 설명해야 하는 것은 문서나 코드, 디자인 토큰, 검사 도구 같은 형태로
            남겨두는 편입니다.
          </p>
          <p className={styles.body}>
            좋은 규칙은 기억을 잘하는 사람에게 의존하지 않아야 한다고 생각합니다.
          </p>
        </div>

        <div className={styles.item}>
          <h3 className={styles.itemTitle}>AI가 만든 결과도 그냥 믿지는 않습니다</h3>
          <p className={styles.body}>요즘은 구현, 조사, 문서 작성 대부분에서 AI를 사용합니다.</p>
          <p className={styles.body}>
            확실히 빠릅니다. 혼자였다면 오래 걸렸을 탐색도 훨씬 짧은 시간 안에 할 수 있습니다.
          </p>
          <p className={styles.body}>대신 결과를 그대로 가져다 쓰지는 않으려고 합니다.</p>
          <p className={styles.body}>
            그럴듯한 설명이 실제 코드와 맞지 않을 때도 있고, 이미 버린 방향을 다시 제안할 때도
            있습니다. 결국 실제 화면을 보고, 코드를 읽고, 문서를 다시 확인하는 과정은 여전히
            필요합니다.
          </p>
          <p className={styles.body}>
            그래서 AI를 정답을 주는 도구보다는{' '}
            <strong>검토할 재료를 빠르게 만들어 주는 도구</strong>에 가깝게 사용하고 있습니다.
          </p>
        </div>

        <div className={styles.item}>
          <h3 className={styles.itemTitle}>일단 만들어 보고, 필요하면 다시 설계합니다</h3>
          <p className={styles.body}>
            처음부터 모든 경우를 예상해서 완벽한 구조를 만들기는 어렵다고 생각합니다.
          </p>
          <p className={styles.body}>
            되돌리기 어려운 결정이 아니라면 우선 작게 만들어 봅니다. 실제로 동작하는 것을 보고 나면
            처음에는 보이지 않던 문제가 훨씬 잘 보입니다.
          </p>
          <p className={styles.body}>
            반대로 구조가 계속 발목을 잡는다고 느껴지면 그때는 억지로 이어가기보다 다시 설계하는
            편입니다.
          </p>
          <p className={styles.body}>
            혼자 오래 붙잡는다고 항상 답이 나오는 것도 아니어서, 제가 모르는 영역은 그 영역을 더 잘
            아는 사람의 판단을 적극적으로 참고합니다.
          </p>
        </div>
      </section>

      <section className={styles.block} aria-labelledby="about-interests">
        <Eyebrow as="h2" id="about-interests">
          요즘 관심 있는 것
        </Eyebrow>

        <div className={styles.item}>
          <h3 className={styles.itemTitle}>디자인 시스템</h3>
          <p className={styles.body}>
            컴포넌트를 많이 만드는 것보다, 여러 사람이 화면을 만들어도 제품이 하나의 규칙 안에서
            움직이게 만드는 방법에 관심이 있습니다.
          </p>
          <p className={styles.body}>
            색상이나 간격 같은 시각적 규칙뿐 아니라 컴포넌트의 책임, 인터랙션, 문구처럼 쉽게
            흐트러지는 부분까지 어디까지 시스템으로 만들 수 있을지 계속 실험하고 있습니다.
          </p>
        </div>

        <div className={styles.item}>
          <h3 className={styles.itemTitle}>AI와 일하는 구조</h3>
          <p className={styles.body}>
            AI를 많이 사용할수록 모델 자체보다{' '}
            <strong>
              전에 무엇을 결정했고, 무엇을 시도했고, 무엇을 버렸는지를 어떻게 이어 줄 것인가
            </strong>
            가 더 중요하다고 느끼고 있습니다.
          </p>
          <p className={styles.body}>
            매번 처음부터 설명하지 않아도 이전 작업의 맥락을 다시 사용할 수 있도록 개인적인 지식
            구조와 작업 방식을 만들고 있습니다.
          </p>
          <p className={styles.body}>아직 완성된 방법은 없습니다. 만들면서 계속 바뀌고 있습니다.</p>
        </div>

        <div className={styles.item}>
          <h3 className={styles.itemTitle}>에이전트 스킬</h3>
          <p className={styles.body}>
            반복되는 작업보다 반복되는 <strong>판단</strong>을 자동화하는 것에 관심이 있습니다.
          </p>
          <p className={styles.body}>
            문구를 검토하는 기준, 조사를 시작하는 방법, 코드를 확인할 때 보는 항목처럼 자주 사용하는
            사고 과정을 작은 도구로 만들어 다시 사용하는 방식을 실험하고 있습니다.
          </p>
        </div>
      </section>

      <section className={styles.block} aria-labelledby="about-stack">
        <Eyebrow as="h2" id="about-stack">
          다루는 기술
        </Eyebrow>
        <p className={styles.body}>주로 TypeScript와 React를 사용합니다.</p>
        <p className={styles.body}>
          Next.js, Node.js를 함께 사용하고 있고, 일반적인 웹 UI 외에도 Canvas 기반 인터랙션이나
          에디터처럼 상태와 좌표를 많이 다뤄야 하는 화면을 만드는 것을 좋아합니다.
        </p>
        <p className={styles.body}>필요하면 Docker나 간단한 서버 환경까지 직접 다룹니다.</p>
        <p className={styles.body}>
          특정 기술 자체보다는 지금 해결하려는 문제에 어떤 도구가 적당한지를 더 중요하게 생각합니다.
        </p>
      </section>

      <section className={styles.block} aria-labelledby="about-record">
        <Eyebrow as="h2" id="about-record">
          이곳에 남기는 것
        </Eyebrow>
        <p className={styles.body}>
          이 블로그에는 주로 제가 직접 만들거나 고민하면서 배운 것을 기록합니다.
        </p>
        <p className={styles.body}>
          잘된 방법만 정리하지는 않으려고 합니다. 처음에는 괜찮아 보였지만 나중에 버린 구조나,
          예상과 실제가 달랐던 경우도 가능하면 같이 남기려고 합니다.
        </p>
        <p className={styles.body}>
          시간이 지나 생각이 바뀌면 예전 글과 지금 글이 서로 다를 수도 있습니다.
        </p>
        <p className={styles.body}>그것도 기록의 일부라고 생각합니다.</p>
      </section>
    </article>
  );
}
