import styles from './index.module.css'
export const Hamburger = ({ isOpen }: { isOpen: boolean }) => {
  return (
    <button className={styles.container}>
        <span className={styles.span}></span>
        <span className={styles.span}></span>
        <span className={styles.span}></span>
    </button>
  )
}