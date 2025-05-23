import styles from './index.module.css';

export const Hero = () => {
  return (
    <>
      <div className={styles.parent}>
        <div className={styles.div1}> <div className='w-full h-full bg-[#0000003e]'></div> </div>
        <div className={styles.div2}> <div className='w-full h-full bg-[#0000003e]'></div> </div>
        <div className={styles.div3}> <div className='w-full h-full bg-[#0000003e]'></div> </div>
        <div className={styles.div4}> <div className='w-full h-full bg-[#0000003e]'></div> </div>
        <div className={styles.div5}> <div className='w-full h-full bg-[#0000003e]'></div> </div>
      </div>
    </>
  );
};
