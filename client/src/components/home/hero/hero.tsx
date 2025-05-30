import { Link } from 'react-router';
import styles from './index.module.css';

export const Hero = () => {
  return (
    <>
      <div className={styles.parent}>
        
        <div className={styles.div1}> 
          <div className='w-full h-full bg-[#0000003e] flex items-end justify-end'>
              <Link to={'#'} className='text-[3rem] font-[700] text-white mb-5 mr-[4rem]'>
                <h1>
                    Men 
                </h1>
              </Link>
          </div> 
        </div>
        <div className={styles.div2}> 
          <div className='w-full h-full bg-[#0000003e] flex items-end justify-end'>
              <Link to={'#'} className='text-[3rem] font-[700] text-white mb-5 mr-[4rem]'>
                <h1>
                    Sport
                </h1>
              </Link>
          </div> 
        </div>
        <div className={styles.div3}> 
          <div className='w-full h-full bg-[#0000003e] flex items-end justify-end'>
               <Link to={'#'} className='text-[3rem] font-[700] text-white mb-5 mr-[4rem]'>
                <h1>
                    Women
                </h1>
              </Link>
          </div> 
        </div>
        <div className={styles.div4}> 
          <div className='w-full h-full bg-[#0000003e] flex items-end justify-end'>
             <Link to={'#'} className='text-[3rem] font-[700] text-white mb-5 mr-[4rem]'>
                <h1>
                    Children
                </h1>
              </Link>
          </div>
        </div>
        <div className={styles.div5}> 
          <div className='w-full h-full bg-[#0000003e] flex items-end justify-center'>
             <Link to={'#'} className='text-[3rem] font-[700] text-white mb-5 mx-[1rem]'>
                <h1>
                    Beauty
                </h1>
              </Link>
          </div> 
        </div>
      </div>
    </>
  );
};
