import styles from './index.module.css';

const Loader: React.FC = () => {
  return (
    <svg viewBox="25 25 50 50" className={styles.svg}>
      <circle r="20" cy="50" cx="50" className={styles.circle}></circle>
    </svg>
  )
}

export default Loader;