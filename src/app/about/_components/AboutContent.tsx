import { body, connect, experience, focus, lead, now, stack } from './profile';
import styles from './AboutContent.module.css';

export function AboutContent() {
  return (
    <article className={styles.about}>
      <h1 className={styles.title}>About</h1>

      <p className={styles.lead}>{lead}</p>
      <p className={styles.body}>{body}</p>

      <section className={styles.block} aria-labelledby="about-focus">
        <p id="about-focus" className={styles.label}>
          What I focus on
        </p>
        <ul className={styles.focusList}>
          {focus.map((item) => (
            <li key={item.title} className={styles.focusItem}>
              <h2 className={styles.focusTitle}>{item.title}</h2>
              <p className={styles.body}>{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.block} aria-labelledby="about-experience">
        <p id="about-experience" className={styles.label}>
          Experience
        </p>
        <ul className={styles.expList}>
          {experience.map((item) => (
            <li key={`${item.company}-${item.period}`} className={styles.expItem}>
              <span className={styles.expCompany}>{item.company}</span>
              <span className={styles.expRole}>{item.role}</span>
              <span className={styles.expPeriod}>{item.period}</span>
            </li>
          ))}
        </ul>
        <ul className={styles.stack}>
          {stack.map((tag) => (
            <li key={tag} className={styles.tag}>
              {tag}
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.block} aria-labelledby="about-now">
        <p id="about-now" className={styles.label}>
          Now
        </p>
        <p className={styles.body}>{now}</p>
      </section>

      <section className={styles.block} aria-labelledby="about-connect">
        <p id="about-connect" className={styles.label}>
          Connect
        </p>
        <ul className={styles.connect}>
          {connect.map((item) => (
            <li key={item.label}>
              <a href={item.href} className={styles.link}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
