import type { IShoppingCard } from "@utils/types";

export const ShoppingCard: React.FC<IShoppingCard> = ({ name, decsription, price, vendor, img_url}): React.ReactElement => {
  return (
   <>
        <div className="w-[200px] h-[350px] flex flex-col gap-[.75rem] pb-[.5rem]">
            <div className="w-full h-[250px] relative overflow-hidden">
                <img src={img_url} alt={name} className="w-full h-full block object-cover"/>
            </div>
            <div className="line-clamp-2">
                { decsription }
            </div>
            <div>
                { vendor }
            </div>
            <div>
                R{ price }
            </div>
        </div>
   </>
  );
};
