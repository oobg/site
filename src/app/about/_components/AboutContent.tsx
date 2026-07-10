import styles from './AboutContent.module.css';

/* About 정적 콘텐츠.
   아래 산문은 기존 사이트 보이스(Hero·Footer·Exploring)와 리포에서 확인 가능한 사실
   (api.raven.kr, github.com/oobg)만 재조합한 초안입니다.
   저자 personalization 지점: 이름·경력·"지금" 항목을 실제 내용으로 교체하세요. */
export function AboutContent() {
  return (
    <article className={styles.about}>
      <h1 className={styles.title}>About</h1>

      <p className={styles.lead}>
        raven.kr은 생각을 다듬고, 그것을 시스템과 제품으로 옮기는 과정을 기록하는 공간입니다.
      </p>
      <p className={styles.body}>
        복잡함을 감추기보다 명료하게 드러내는 인터페이스, 그리고 그 생각을 오래 지탱하는 시스템에
        관심이 있습니다. 코드만이 아니라 사고를 확장하는 도구를 만들고자 합니다.
      </p>

      <section className={styles.block} aria-labelledby="about-now">
        <p id="about-now" className={styles.label}>
          Now
        </p>
        <p className={styles.body}>
          지금은 raven.kr과 그 콘텐츠 API(api.raven.kr)를 만들며, 글과 프로젝트로 그 과정을 남기고
          있습니다.
        </p>
      </section>

      <section className={styles.block} aria-labelledby="about-connect">
        <p id="about-connect" className={styles.label}>
          Connect
        </p>
        <p className={styles.body}>
          작업과 코드는{' '}
          <a href="https://github.com/oobg" className={styles.link}>
            GitHub
          </a>
          에서 볼 수 있습니다.
        </p>
      </section>
    </article>
  );
}
